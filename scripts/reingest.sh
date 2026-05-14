#!/usr/bin/env bash
# =============================================================================
# reingest.sh — limpa dados existentes e reinicia ingestão a partir de ficheiro
#               local, sem passar pela interface web.
#
# Uso:
#   ./scripts/reingest.sh <ficheiro.gdb.zip> [opções]
#
# Opções:
#   -d, --distribuidora  Sigla da distribuidora   (ex: ENEL_CE)
#   -a, --ano            Ano de referência         (ex: 2017)
#   -e, --entidades      Lista separada por vírgula (default: todas)
#                        Geo:    SSDBT,SSDMT,UNTRD,SUB,UCBT,UCMT,UCAT
#                                EQCR,UGBT,UGMT,UGAT,RAMLIG,PONNOT
#                        Não-geo: SSDAT,CTMT,SEGCON
#       --clean-only     Apenas limpa dados; não ingere
#       --no-confirm     Não pede confirmação antes de truncar
#
# Exemplos:
#   ./scripts/reingest.sh dados/Enel_CE_2017.gdb.zip -d ENEL_CE -a 2017
#   ./scripts/reingest.sh dados/Enel_CE_2017.gdb.zip -d ENEL_CE -a 2017 -e SSDBT,UNTRD
#   ./scripts/reingest.sh --clean-only --no-confirm
# =============================================================================
set -euo pipefail

# ─── Cores ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${CYAN}[reingest]${NC} $*"; }
ok()   { echo -e "${GREEN}[ok]${NC} $*"; }
warn() { echo -e "${YELLOW}[aviso]${NC} $*"; }
err()  { echo -e "${RED}[erro]${NC} $*" >&2; exit 1; }

# ─── Defaults ────────────────────────────────────────────────────────────────
GDB_FILE=""
DISTRIBUIDORA=""
ANO=""
ENTIDADES="SSDBT,SSDMT,UNTRD,SUB,UCBT,UCMT,UCAT,EQCR,UGBT,UGMT,UGAT,RAMLIG,PONNOT,SSDAT,CTMT,SEGCON"
CLEAN_ONLY=false
NO_CONFIRM=false

# ─── Parse args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--distribuidora) DISTRIBUIDORA="$2"; shift 2 ;;
    -a|--ano)           ANO="$2";           shift 2 ;;
    -e|--entidades)     ENTIDADES="$2";     shift 2 ;;
    --clean-only)       CLEAN_ONLY=true;    shift   ;;
    --no-confirm)       NO_CONFIRM=true;    shift   ;;
    -h|--help)
      sed -n '3,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    -*)  err "Opção desconhecida: $1" ;;
    *)
      [[ -z "$GDB_FILE" ]] && GDB_FILE="$1" || err "Argumento inesperado: $1"
      shift ;;
  esac
done

# ─── Validações ──────────────────────────────────────────────────────────────
if ! $CLEAN_ONLY; then
  [[ -z "$GDB_FILE" ]]       && err "Especifica o ficheiro .gdb.zip como primeiro argumento."
  [[ ! -f "$GDB_FILE" ]]     && err "Ficheiro não encontrado: $GDB_FILE"
  [[ -z "$DISTRIBUIDORA" ]]  && err "Falta -d / --distribuidora (ex: ENEL_CE)"
  [[ -z "$ANO" ]]            && err "Falta -a / --ano (ex: 2017)"
  [[ "$ANO" =~ ^[0-9]{4}$ ]] || err "Ano inválido: $ANO"
fi

# Verificar que os containers estão a correr
docker compose ps --services --filter status=running | grep -q "^db$"   || err "Container 'db' não está a correr. Executa: docker compose up -d db"
if ! $CLEAN_ONLY; then
  docker compose ps --services --filter status=running | grep -q "^worker$" || err "Container 'worker' não está a correr. Executa: docker compose up -d worker"
fi

# ─── Confirmação ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  GeoRede — Re-ingestão de dados${NC}"
echo -e "${BOLD}════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Tabelas a limpar: ${YELLOW}seg_bt, seg_mt, trafo, subestacao, consumidor_pj,${NC}"
echo -e "                    ${YELLOW}eq_corte, geracao_dist, ramal_lig, ponto_notavel,${NC}"
echo -e "                    ${YELLOW}ssdat, ctmt_dados, segcon, ingestao_log${NC}"
if ! $CLEAN_ONLY; then
  echo -e "  Ficheiro:         ${CYAN}$GDB_FILE${NC}"
  echo -e "  Distribuidora:    ${CYAN}$DISTRIBUIDORA${NC}"
  echo -e "  Ano:              ${CYAN}$ANO${NC}"
  echo -e "  Entidades:        ${CYAN}$ENTIDADES${NC}"
fi
echo ""

if ! $NO_CONFIRM; then
  read -rp "$(echo -e "${YELLOW}Confirmar? Todos os dados existentes serão apagados. [s/N]${NC} ")" resp
  [[ "${resp,,}" == "s" ]] || { log "Cancelado."; exit 0; }
fi

# ─── Passo 1: Truncar tabelas ─────────────────────────────────────────────────
log "A truncar tabelas de dados…"
docker compose exec -T db psql \
  -U "${DB_USER:-rede_bt_user}" \
  -d "${DB_NAME:-rede_bt}" \
  -c "
    TRUNCATE TABLE
      rede_bt.seg_bt,
      rede_bt.seg_mt,
      rede_bt.trafo,
      rede_bt.subestacao,
      rede_bt.consumidor_pj,
      rede_bt.eq_corte,
      rede_bt.geracao_dist,
      rede_bt.ramal_lig,
      rede_bt.ponto_notavel,
      rede_bt.ssdat,
      rede_bt.ctmt_dados,
      rede_bt.segcon,
      rede_bt.ingestao_log
    RESTART IDENTITY;
  "
ok "Tabelas limpas."

$CLEAN_ONLY && { ok "Limpeza concluída (--clean-only)."; exit 0; }

# ─── Passo 2: Copiar ficheiro para o container ────────────────────────────────
CONTAINER_PATH="/tmp/reingest_input"
log "A copiar ficheiro para o container worker…"
# Obter nome real do container
WORKER_CONTAINER=$(docker compose ps -q worker)
[[ -z "$WORKER_CONTAINER" ]] && err "Não foi possível obter o ID do container worker."
docker cp "$GDB_FILE" "${WORKER_CONTAINER}:${CONTAINER_PATH}"
ok "Ficheiro copiado → ${CONTAINER_PATH}"

# ─── Passo 3: Gerar job-id ────────────────────────────────────────────────────
JOB_ID=$(docker compose exec -T worker python3 -c "import uuid; print(uuid.uuid4())" | tr -d '\r')
log "Job ID: ${JOB_ID}"

# ─── Passo 4: Executar ingest.py ──────────────────────────────────────────────
log "A iniciar ingestão (output em tempo real)…"
echo ""
docker compose exec -T worker python3 /worker/ingest.py \
  --local-path "${CONTAINER_PATH}" \
  --entidades  "${ENTIDADES}" \
  --distribuidora "${DISTRIBUIDORA}" \
  --ano        "${ANO}" \
  --job-id     "${JOB_ID}"
echo ""

# ─── Passo 5: Limpeza do ficheiro temporário ─────────────────────────────────
docker compose exec -T worker rm -f "${CONTAINER_PATH}"

# ─── Resultado ────────────────────────────────────────────────────────────────
ok "Ingestão concluída. Verifica o estado:"
echo -e "  ${CYAN}docker compose exec db psql -U \${DB_USER:-rede_bt_user} -d \${DB_NAME:-rede_bt} -c \"SELECT entidade, status, n_registos, mensagem FROM rede_bt.ingestao_log WHERE job_id = '${JOB_ID}';\"${NC}"
echo ""
