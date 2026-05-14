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
    "SSDBT":  "rede_bt.seg_bt",
    "SSDMT":  "rede_bt.seg_mt",
    "UNTRD":  "rede_bt.trafo",
    "SUB":    "rede_bt.subestacao",
    "UCBT":   "rede_bt.consumidor_pj",
    "UCMT":   "rede_bt.consumidor_pj",
    "UCAT":   "rede_bt.consumidor_pj",
    # Tier 1 — novas layers visuais
    "EQCR":   "rede_bt.eq_corte",
    "UGBT":   "rede_bt.geracao_dist",
    "UGMT":   "rede_bt.geracao_dist",
    "UGAT":   "rede_bt.geracao_dist",
    "RAMLIG": "rede_bt.ramal_lig",
    "PONNOT": "rede_bt.ponto_notavel",
    # Tier 2 — enriquecimento (sem geometria)
    "SSDAT":  "rede_bt.ssdat",
    "CTMT":   "rede_bt.ctmt_dados",
    "SEGCON": "rede_bt.segcon",
}

# Tabelas sem geometria — ogr2ogr usa -nlt NONE
_NOGEO_TABELAS: set[str] = {
    "rede_bt.ssdat",
    "rede_bt.ctmt_dados",
    "rede_bt.segcon",
}

# Entidades que partilham tabela — nível de tensão injectado como campo extra
_NIVEL_TENSAO_MAP: dict[str, str] = {
    "UGBT": "BT",
    "UGMT": "MT",
    "UGAT": "AT",
}

# Nomes alternativos por versão do BDGD (formato antigo → entidade canónica)
# Formatos anteriores a ~2020 usam nomes diferentes para algumas layers
LAYER_ALIASES: dict[str, str] = {
    "UNTRMT":   "UNTRD",   # nome antigo da unidade transformadora de distribuição
    "UCBT_TAB": "UCBT",    # formato antigo com sufixo _tab
    "UCMT_TAB": "UCMT",
    "UCAT_TAB": "UCAT",
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


# ─── ogr2ogr — ingerir entidade ──────────────────────────────────────────────

_LINE_TABELAS = {"rede_bt.seg_bt", "rede_bt.seg_mt", "rede_bt.ramal_lig"}


def _ogr2ogr(
    gdb_path: Path,
    entidade: str,
    tabela: str,
    nivel_tensao: str | None = None,
) -> tuple[bool, str]:
    pg_dsn = "PG:" + DATABASE_URL
    no_geo = tabela in _NOGEO_TABELAS

    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        pg_dsn,
        str(gdb_path),
    ]

    # Para entidades que partilham tabela, injectar campo nivel_tensao via -sql
    if nivel_tensao:
        cmd += ["-sql", f"SELECT *, '{nivel_tensao}' AS nivel_tensao FROM {entidade}"]
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
            # Segmentos e ramais podem ser LineString ou MultiLineString conforme versão BDGD
            cmd += ["-nlt", "PROMOTE_TO_MULTI"]

    print(f"[ogr2ogr] {entidade} → {tabela}", flush=True)
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

    # Executar ogr2ogr (injecta nivel_tensao para UGBT/UGMT/UGAT)
    nivel_tensao = _NIVEL_TENSAO_MAP.get(entidade_orig)
    ok, erro_msg = _ogr2ogr(gdb_path, entidade, tabela, nivel_tensao=nivel_tensao)

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
