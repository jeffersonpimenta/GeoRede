"""
Worker de ingestão BDGD — invocado pela API como subprocess.

Uso:
    python ingest.py \
        --url <url_gdb> \
        --entidade TRAFO \
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
    "RAMBT":   "rede_bt.seg_bt",
    "RAMMT":   "rede_bt.seg_mt",
    "TRAFO":   "rede_bt.trafo",
    "SSDMT":   "rede_bt.subestacao",
    "UCBT_PJ": "rede_bt.consumidor_pj",
    "UCMT_PJ": "rede_bt.consumidor_pj",
    "UCAT_PJ": "rede_bt.consumidor_pj",
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


# ─── ogr2ogr — ingerir entidade ──────────────────────────────────────────────

def _ogr2ogr(gdb_path: Path, entidade: str, tabela: str) -> tuple[bool, str]:
    pg_dsn = DATABASE_URL.replace("postgresql://", "PG:", 1)

    cmd = [
        "ogr2ogr",
        "-f", "PostgreSQL",
        pg_dsn,
        str(gdb_path),
        entidade,
        "-nln", tabela,
        "-t_srs", "EPSG:4674",
        "-append",
        "--config", "OGR_TRUNCATE", "NO",
        "--config", "PG_USE_COPY", "YES",
    ]

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
    tabela = ENTIDADE_TABELA.get(entidade)
    if tabela is None:
        _log_update(job_id, entidade, "erro", f"Entidade '{entidade}' não reconhecida.")
        return False

    # Validar layer no .gdb
    if not _layer_exists(gdb_path, entidade):
        msg = f"Layer '{entidade}' não encontrada no ficheiro .gdb."
        print(f"[ingest] AVISO: {msg}", flush=True)
        _log_update(job_id, entidade, "erro", msg)
        return False

    # Executar ogr2ogr
    ok, erro_msg = _ogr2ogr(gdb_path, entidade, tabela)

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
    parser.add_argument("--url", required=True, help="URL do ficheiro .gdb")
    parser.add_argument("--entidades", required=True, help="Entidades separadas por vírgula: RAMBT,TRAFO")
    parser.add_argument("--distribuidora", required=True)
    parser.add_argument("--ano", required=True, type=int)
    parser.add_argument("--job-id", required=True, dest="job_id")
    args = parser.parse_args()

    entidades = [e.strip() for e in args.entidades.split(",") if e.strip()]
    tmp_dir = Path(f"/tmp/ingest/{args.job_id}")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    download_path = tmp_dir / "input.download"

    print(f"[worker] job={args.job_id} distribuidora={args.distribuidora} ano={args.ano}", flush=True)
    print(f"[worker] entidades={entidades}", flush=True)

    # Registar todas as entidades como em_progresso
    _log_init(args.job_id, args.distribuidora, args.ano, entidades)

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
