"""
Worker de ingestão BDGD — invocado pela API como subprocess.

Uso:
    python ingest.py \
        --url <url_gdb> \
        --entidade UNTRD \
        --distribuidora ENEL_SP \
        --ano 2024 \
        --job-id <uuid>
"""
import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

import psycopg2
import requests

DATABASE_URL = os.environ["DATABASE_URL"]

# Mapeamento entidade BDGD → tabela PostGIS
ENTIDADE_TABELA: dict[str, str] = {
    # ── Rede (com geometria) ─────────────────────────────────
    "SSDBT":  "rede_bt.seg_bt",
    "SSDMT":  "rede_bt.seg_mt",
    "SSDAT":  "rede_bt.seg_at",       # SSDAT tem segmentos AT no GDB (com geom)
    "SUB":    "rede_bt.subestacao",
    "UNTRD":  "rede_bt.trafo",
    "UNTRS":  "rede_bt.trafo_sub",
    # ── Consumidores (com geometria) ─────────────────────────
    "UCBT":   "rede_bt.consumidor_pj",
    "UCMT":   "rede_bt.consumidor_pj",
    "UCAT":   "rede_bt.consumidor_pj",
    # ── Equipamentos / geração (com geometria) ───────────────
    "EQCR":   "rede_bt.eq_compensador_reativo",
    "UGBT":   "rede_bt.geracao_dist",
    "UGMT":   "rede_bt.geracao_dist",
    "UGAT":   "rede_bt.geracao_dist",
    "RAMLIG": "rede_bt.ramal_lig",
    "PONNOT": "rede_bt.ponto_notavel",
    # ── Entidades geográficas complementares ─────────────────
    "UNCRBT":  "rede_bt.compensador_reativo_bt",
    "UNCRAT":  "rede_bt.compensador_reativo_at",
    "UNREAT":  "rede_bt.regulador_at",
    "UNSEBT":  "rede_bt.seccionadora_bt",
    "UNTRAT":  "rede_bt.trafo_at",
    # ── Fase 2 — novas layers geográficas ────────────────────
    "ARAT":   "rede_bt.area_atendimento",
    "CONJ":   "rede_bt.conjunto",
    "UNSEMT": "rede_bt.unidade_seg_mt",
    "UNSEAT": "rede_bt.unidade_seg_at",
    "UNCRMT": "rede_bt.unidade_rede_mt",
    "UNREMT": "rede_bt.unidade_rede_est_mt",
    # ── Fase 2/3 — enriquecimento (sem geometria) ────────────
    "CTMT":   "rede_bt.ctmt_dados",
    "SEGCON": "rede_bt.segcon",
    "CTAT":   "rede_bt.ctat_dados",
    "BAR":    "rede_bt.barra",
    "BAY":    "rede_bt.bay",
    "EQTRD":  "rede_bt.eq_trafo_dist",
    "EQTRM":  "rede_bt.eq_trafo_mt",
    "EQTRS":  "rede_bt.eq_trafo_sub",
    "EQSIAT": "rede_bt.eq_siat",
    "EQTRSX": "rede_bt.eq_trsx",
    "EQRE":   "rede_bt.eq_regulador",
    "EQSE":   "rede_bt.eq_seccionamento",
    "EQME":   "rede_bt.eq_medidor",
    "PIP":    "rede_bt.pip",
    # ── Entidades não-geográficas complementares ─────────────
    "EQTRAT": "rede_bt.eq_trafo_at",
    "EQTRMT": "rede_bt.eq_trafo_mt_dist",
    "CRVCRG": "rede_bt.curva_carga",
    # ── Fase 4 — dashboard ───────────────────────────────────
    "BE":     "rede_bt.balanco_energia",
    "EP":     "rede_bt.energia_propria",
    "PT":     "rede_bt.perda_tecnica",
    "PNT":    "rede_bt.perda_nao_tecnica",
    "INDGER": "rede_bt.indicador_gestao",
    "BASE":   "rede_bt.base_metadata",
}

# Tabelas declaradamente sem geometria — fallback quando detecção adaptativa não é possível
_NOGEO_TABELAS: set[str] = {
    "rede_bt.ctmt_dados",
    "rede_bt.segcon",
    "rede_bt.ctat_dados",
    "rede_bt.barra",
    "rede_bt.bay",
    "rede_bt.eq_trafo_dist",
    "rede_bt.eq_trafo_mt",
    "rede_bt.eq_trafo_sub",
    "rede_bt.eq_siat",
    "rede_bt.eq_trsx",
    "rede_bt.eq_regulador",
    "rede_bt.eq_seccionamento",
    "rede_bt.eq_medidor",
    "rede_bt.pip",
    "rede_bt.balanco_energia",
    "rede_bt.energia_propria",
    "rede_bt.perda_tecnica",
    "rede_bt.perda_nao_tecnica",
    "rede_bt.indicador_gestao",
    "rede_bt.base_metadata",
    "rede_bt.eq_trafo_at",
    "rede_bt.eq_trafo_mt_dist",
    "rede_bt.curva_carga",
}

# Entidades que partilham tabela — nível de tensão injectado como campo extra
_NIVEL_TENSAO_MAP: dict[str, str] = {
    "UGBT": "BT",
    "UGMT": "MT",
    "UGAT": "AT",
    "UCBT": "BT",
    "UCMT": "MT",
    "UCAT": "AT",
}

# Mapeamento de colunas GDB (padrão BDGD/ANEEL) → colunas PostgreSQL pré-definidas
# Resolve o mismatch de nomes entre o GDB e o schema do sistema
COLUMN_MAP: dict[str, dict[str, str]] = {
    "SSDBT": {
        "DIST": "distribuidora",
        "COMP": "comprimento",
        "TEN_NOM": "tensao_nom",
        "TIP_CND": "condutor",
        "SUB": "sub_gd",
    },
    "SSDMT": {
        "DIST": "distribuidora",
        "COMP": "comprimento",
        "TEN_NOM": "tensao_nom",
        "TIP_CND": "condutor",
        "SUB": "sub_gd",
    },
    "SSDAT": {
        "DIST": "distribuidora",
        "COMP": "comprimento",
        "SUB": "sub_gd",
    },
    "SUB": {
        "DIST": "distribuidora",
        "NOM": "nome",
        "TEN_PRI": "tensao_prim",
        "TEN_SEC": "tensao_sec",
        "POT_NOM": "potencia_mva",
    },
    "UNTRD": {
        "DIST": "distribuidora",
        "POT_NOM": "potencia_kva",
        "TEN_PRI": "tensao_prim",
        "TEN_SEC": "tensao_sec",
        "MUN": "mun_id",
        "SUB": "sub_gd",
    },
    "UNTRS": {
        "DIST": "distribuidora",
        "POT_NOM": "pot_nom",
        "TEN_PRI": "ten_pri",
        "TEN_SEC": "ten_sec",
        "SUB": "sub_gd",
    },
    "UCBT": {
        "DIST": "distribuidora",
        "UNI_TR_MT": "uni_tr_d",
        "MUN": "mun_id",
        "CLAS_SUB": "classe",
        "CAR_INST": "demanda_kw",
        "SUB": "sub_gd",
    },
    "UCMT": {
        "DIST": "distribuidora",
        "UNI_TR_AT": "uni_tr_d",
        "MUN": "mun_id",
        "CLAS_SUB": "classe",
        "DEM_CONT": "demanda_kw",
        "SUB": "sub_gd",
    },
    "UCAT": {
        "DIST": "distribuidora",
        "MUN": "mun_id",
        "CLAS_SUB": "classe",
        "DEM_CONT": "demanda_kw",
        "SUB": "sub_gd",
    },
    "UGBT": {
        "DIST": "distribuidora",
        "UNI_TR_MT": "uni_tr_d",
        "POT_INST": "pot_inst",
        "SUB": "sub_gd",
        "MUN": "mun_id",
    },
    "UGMT": {
        "DIST": "distribuidora",
        "UNI_TR_MT": "uni_tr_d",
        "POT_INST": "pot_inst",
        "SUB": "sub_gd",
        "MUN": "mun_id",
    },
    "UGAT": {
        "DIST": "distribuidora",
        "POT_INST": "pot_inst",
        "SUB": "sub_gd",
        "MUN": "mun_id",
    },
    "EQCR": {
        "DIST": "distribuidora",
        "TEN_NOM": "ten_nom",
    },
    "RAMLIG": {
        "DIST": "distribuidora",
        "UNI_TR_MT": "uni_tr_d",
        "COMP": "comp",
    },
    "PONNOT": {
        "DIST": "distribuidora",
    },
    "CTMT": {
        "DIST": "distribuidora",
        "DES_CIRC": "des_circ",
        "TEN_NOM": "ten_nom",
    },
    "CTAT": {
        "DIST": "distribuidora",
        "SUB": "sub_gd",
        "DES_CIRC": "des_circ",
        "TEN_NOM": "ten_nom",
    },
    "SEGCON": {
        "DIST": "distribuidora",
        "DESCR": "descr",
        "RES_POS": "res_pos",
        "REA_POS": "rea_pos",
        "CAP_AMP": "cap_amp",
        "TIP_CND": "tip_cnd",
        "BIT_CND": "bit_cnd",
    },
}

# Nomes alternativos por versão do BDGD (formato antigo → entidade canónica)
# Formatos anteriores a ~2020 usam nomes diferentes para algumas layers
LAYER_ALIASES: dict[str, str] = {
    "UNTRMT":   "UNTRD",   # nome antigo da unidade transformadora de distribuição
    "UCBT_TAB": "UCBT",    # formato antigo com sufixo _tab
    "UCMT_TAB": "UCMT",
    "UCAT_TAB": "UCAT",
    "UGBT_TAB": "UGBT",    # formato antigo (ex. Enel CE 2017)
    "UGMT_TAB": "UGMT",
    "UGAT_TAB": "UGAT",
    # UNTRAT agora é entidade standalone (rede_bt.trafo_at)
}


# ─── BD helpers ──────────────────────────────────────────────────────────────

def _get_conn():
    return psycopg2.connect(DATABASE_URL)


def _log_update(job_id: str, entidade: str, status: str, mensagem: str = "", n_registos: int | None = None):
    with _get_conn() as conn:
        with conn.cursor() as cur:
            if status == "em_progresso":
                cur.execute(
                    """
                    INSERT INTO rede_bt.ingestao_log (job_id, entidade, status, mensagem)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (job_id, entidade, status, mensagem),
                )
            else:
                cur.execute(
                    """
                    UPDATE rede_bt.ingestao_log
                    SET status = %s,
                        mensagem = %s,
                        n_registos = %s,
                        concluido_em = now()
                    WHERE job_id = %s AND entidade = %s
                    """,
                    (status, mensagem, n_registos, job_id, entidade),
                )
        conn.commit()


def _log_init(job_id: str, distribuidora: str, ano_ref: int, entidades: list[str]):
    """Cria uma entrada por entidade com status em_progresso."""
    with _get_conn() as conn:
        with conn.cursor() as cur:
            for entidade in entidades:
                cur.execute(
                    """
                    INSERT INTO rede_bt.ingestao_log
                        (job_id, distribuidora, ano_ref, entidade, status)
                    VALUES (%s, %s, %s, %s, 'em_progresso')
                    ON CONFLICT DO NOTHING
                    """,
                    (job_id, distribuidora, ano_ref, entidade),
                )
        conn.commit()


def _count_inserted(tabela: str, job_id_marker: str) -> int:
    """Conta registos totais na tabela (aproximação simples — sem marcador por job)."""
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {tabela}")  # noqa: S608 — tabela de whitelist interna
            return cur.fetchone()[0]


# ─── Download ────────────────────────────────────────────────────────────────

def _download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"[download] {url} → {dest}", flush=True)

    with requests.get(url, stream=True, timeout=300) as resp:
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        downloaded = 0

        with open(dest, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=8 * 1024 * 1024):
                fh.write(chunk)
                downloaded += len(chunk)
                if total:
                    pct = downloaded / total * 100
                    print(f"[download] {pct:.1f}%", flush=True)

    print(f"[download] concluído ({downloaded} bytes)", flush=True)


# ─── Extracção do .gdb (suporta .zip ou .gdb directo) ────────────────────────

def _extract_gdb(download_path: Path, work_dir: Path) -> Path | None:
    """
    Dado o ficheiro descarregado, devolve o Path para o .gdb pronto a usar.
    - Se for .zip → extrai e localiza o directório .gdb dentro
    - Se já for .gdb → devolve directamente
    """
    # Testar se é ZIP (magic bytes)
    try:
        with open(download_path, "rb") as fh:
            magic = fh.read(4)
        is_zip = magic[:2] == b"PK"
    except OSError:
        return None

    if is_zip:
        extract_dir = work_dir / "extracted"
        extract_dir.mkdir(exist_ok=True)
        print(f"[worker] a extrair zip → {extract_dir}", flush=True)
        with zipfile.ZipFile(download_path, "r") as zf:
            zf.extractall(extract_dir)
        # Localizar primeiro directório .gdb (pode estar em subdirectório)
        for candidate in sorted(extract_dir.rglob("*.gdb")):
            if candidate.is_dir():
                return candidate
        return None

    # Assumir que é directamente um directório .gdb (raro, mas possível)
    gdb_direct = work_dir / "input.gdb"
    download_path.rename(gdb_direct)
    return gdb_direct if gdb_direct.is_dir() else None


# ─── ogrinfo — validar layer no .gdb ─────────────────────────────────────────

def _layer_exists(gdb_path: Path, layer_name: str) -> bool:
    result = subprocess.run(
        ["ogrinfo", "-ro", "-al", "-so", str(gdb_path), layer_name],
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def _list_layers(gdb_path: Path) -> list[str]:
    # ogrinfo -ro (no layer arg) lists layers.
    # GDAL ≥3.x: "Layer: NAME (type)"
    # GDAL <3.x:  "N: NAME (type)"
    result = subprocess.run(
        ["ogrinfo", "-ro", str(gdb_path)],
        capture_output=True, text=True,
    )
    layers = []
    for line in result.stdout.splitlines():
        if ": " not in line:
            continue
        if line.startswith("Layer: ") or (line[0].isdigit()):
            name = line.split(": ", 1)[1].split(" (")[0].strip()
            layers.append(name)
    return layers


def _detect_geom_type(gdb_path: Path, layer_name: str) -> str | None:
    """Detecta tipo de geometria de um layer via ogrinfo -so.

    Retorna tipo de geometria (e.g. 'Point', 'Multi Line String', 'None')
    ou None se não conseguir detectar.
    """
    result = subprocess.run(
        ["ogrinfo", "-ro", "-so", str(gdb_path), layer_name],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        return None
    for line in result.stdout.splitlines():
        if "Geometry:" in line:
            geom_type = line.split("Geometry:", 1)[1].strip()
            return geom_type
    return None


# ─── ogr2ogr — ingerir entidade ──────────────────────────────────────────────

_LINE_TABELAS = {"rede_bt.seg_bt", "rede_bt.seg_mt", "rede_bt.seg_at", "rede_bt.ramal_lig"}
_POLYGON_TABELAS = {"rede_bt.area_atendimento", "rede_bt.conjunto", "rede_bt.subestacao"}


def _ogr2ogr(
    gdb_path: Path,
    entidade: str,
    entidade_orig: str,
    tabela: str,
    nivel_tensao: str | None = None,
    force_no_geo: bool = False,
) -> tuple[bool, str]:
    pg_dsn = "PG:" + DATABASE_URL
    no_geo = force_no_geo or tabela in _NOGEO_TABELAS

    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        pg_dsn,
        str(gdb_path),
    ]

    # Construir cláusula -sql com:
    #   1) Aliases de colunas (COLUMN_MAP) para mapear nomes GDB→PostgreSQL
    #   2) Injeção de nivel_tensao para entidades que partilham tabela
    col_map = COLUMN_MAP.get(entidade_orig, {})
    aliases = [f'"{gdb}" AS {db}' for gdb, db in col_map.items()]
    if nivel_tensao:
        aliases.append(f"'{nivel_tensao}' AS nivel_tensao")

    if aliases:
        select_parts = ", ".join(aliases) + ", *"
        cmd += ["-sql", f"SELECT {select_parts} FROM {entidade}"]
    else:
        cmd.append(entidade)

    cmd += [
        "-nln", tabela,
        "-append",
        "--config", "OGR_TRUNCATE", "NO",
        "--config", "PG_USE_COPY", "YES",
    ]

    if no_geo:
        cmd += ["-nlt", "NONE"]
    else:
        cmd += ["-t_srs", "EPSG:4674"]
        if tabela in _LINE_TABELAS:
            cmd += ["-nlt", "PROMOTE_TO_MULTI"]
        elif tabela in _POLYGON_TABELAS:
            cmd += ["-nlt", "PROMOTE_TO_MULTI"]

    print(f"[ogr2ogr] {entidade} → {tabela}{' (no-geo)' if no_geo else ''}", flush=True)
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        msg = (result.stderr or result.stdout or "erro desconhecido").strip()
        print(f"[ogr2ogr] ERRO: {msg}", flush=True)
        return False, msg

    print(f"[ogr2ogr] OK", flush=True)
    return True, ""


# ─── Função principal de ingestão ────────────────────────────────────────────

def ingest_entidade(
    url_gdb: str,
    entidade: str,
    distribuidora: str,
    ano_ref: int,
    job_id: str,
    gdb_path: Path,
) -> bool:
    """Ingere uma entidade BDGD. Retorna True se bem-sucedido."""
    entidade_orig = entidade  # preservar para lookups após resolução de aliases
    tabela = ENTIDADE_TABELA.get(entidade)
    if tabela is None:
        _log_update(job_id, entidade, "erro", f"Entidade '{entidade}' não reconhecida.")
        return False

    # Validar layer no .gdb
    if not _layer_exists(gdb_path, entidade):
        available = _list_layers(gdb_path)
        available_upper = {l.upper(): l for l in available}

        # 1. Case-insensitive exact match
        match = available_upper.get(entidade.upper())
        if match and match != entidade:
            print(f"[ingest] AVISO: Layer '{entidade}' → usando '{match}' (nome real no .gdb)", flush=True)
            entidade = match
        else:
            # 2. Try known version aliases: find if any available layer maps to this entidade
            alias_match = next(
                (real for real, canonical in LAYER_ALIASES.items()
                 if canonical == entidade and real in available_upper),
                None,
            )
            if alias_match:
                real_name = available_upper[alias_match]
                print(f"[ingest] AVISO: Layer '{entidade}' → usando alias '{real_name}' (formato BDGD antigo)", flush=True)
                entidade = real_name
            else:
                msg = f"Layer '{entidade}' não encontrada no ficheiro .gdb. Layers disponíveis: {available}"
                print(f"[ingest] AVISO: {msg}", flush=True)
                _log_update(job_id, entidade, "erro", msg)
                return False

    # Detecção adaptativa de geometria
    force_no_geo = False
    geom_type = _detect_geom_type(gdb_path, entidade)
    if geom_type and geom_type.lower() in ("none", "unknown (any)"):
        print(f"[ingest] Layer '{entidade}' sem geometria no GDB — usando -nlt NONE", flush=True)
        force_no_geo = True

    # Executar ogr2ogr (injecta nivel_tensao para UC*/UG* e aliases de colunas)
    nivel_tensao = _NIVEL_TENSAO_MAP.get(entidade_orig)
    ok, erro_msg = _ogr2ogr(gdb_path, entidade, entidade_orig, tabela, nivel_tensao=nivel_tensao, force_no_geo=force_no_geo)

    if ok:
        n = _count_inserted(tabela, job_id)
        _log_update(job_id, entidade, "ok", "", n_registos=n)
        return True
    else:
        _log_update(job_id, entidade, "erro", erro_msg)
        return False


# ─── main() — invocado pela API como subprocess ───────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Worker de ingestão BDGD")
    parser.add_argument("--url", default=None, help="URL do ficheiro .gdb")
    parser.add_argument("--local-path", default=None, dest="local_path",
                        help="Caminho local para o ficheiro .gdb/.zip (ignora --url, para testes)")
    parser.add_argument("--entidades", required=True, help="Entidades separadas por vírgula: RAMBT,TRAFO")
    parser.add_argument("--distribuidora", required=True)
    parser.add_argument("--ano", required=True, type=int)
    parser.add_argument("--job-id", required=True, dest="job_id")
    args = parser.parse_args()

    if not args.url and not args.local_path:
        parser.error("É necessário --url ou --local-path")

    entidades = [e.strip() for e in args.entidades.split(",") if e.strip()]
    tmp_dir = Path(f"/tmp/ingest/{args.job_id}")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    download_path = tmp_dir / "input.download"

    print(f"[worker] job={args.job_id} distribuidora={args.distribuidora} ano={args.ano}", flush=True)
    print(f"[worker] entidades={entidades}", flush=True)

    # Registar todas as entidades como em_progresso
    _log_init(args.job_id, args.distribuidora, args.ano, entidades)

    if args.local_path:
        # Modo teste: usar ficheiro local, sem download
        import shutil as _shutil
        local = Path(args.local_path)
        print(f"[worker] modo local: {local}", flush=True)
        _shutil.copy2(local, download_path)
    else:
        # Download único (partilhado por todas as entidades)
        try:
            _download(args.url, download_path)
        except Exception as exc:
            msg = f"Falha no download: {exc}"
            print(f"[worker] ERRO: {msg}", flush=True)
            for entidade in entidades:
                _log_update(args.job_id, entidade, "erro", msg)
            sys.exit(1)

    # Detectar e extrair .zip se necessário
    gdb_path = _extract_gdb(download_path, tmp_dir)
    if gdb_path is None:
        msg = "Não foi possível localizar .gdb no ficheiro descarregado."
        print(f"[worker] ERRO: {msg}", flush=True)
        for entidade in entidades:
            _log_update(args.job_id, entidade, "erro", msg)
        sys.exit(1)
    print(f"[worker] .gdb localizado em: {gdb_path}", flush=True)

    # Ingerir cada entidade sequencialmente
    for entidade in entidades:
        try:
            ingest_entidade(
                url_gdb=args.url,
                entidade=entidade,
                distribuidora=args.distribuidora,
                ano_ref=args.ano,
                job_id=args.job_id,
                gdb_path=gdb_path,
            )
        except Exception as exc:
            msg = f"Erro inesperado em '{entidade}': {exc}"
            print(f"[worker] ERRO: {msg}", flush=True)
            _log_update(args.job_id, entidade, "erro", msg)

    # Limpeza
    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print(f"[worker] temporários removidos: {tmp_dir}", flush=True)
    except Exception:
        pass

    print("[worker] concluído.", flush=True)


if __name__ == "__main__":
    main()
