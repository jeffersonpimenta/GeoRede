"""
Lança o worker de ingestão via HTTP.
O worker corre num container separado (GDAL + ogr2ogr) e expõe POST /run.
"""
import os

import httpx

WORKER_URL = os.environ.get("WORKER_URL", "http://worker:5000")


async def launch_worker(
    job_id: str,
    url_gdb: str,
    entidades: list[str],
    distribuidora: str,
    ano_ref: int,
) -> None:
    """Envia pedido ao worker HTTP. Retorna imediatamente — worker executa em background."""
    payload = {
        "job_id":        job_id,
        "url_gdb":       url_gdb,
        "entidades":     ",".join(entidades),
        "distribuidora": distribuidora,
        "ano":           ano_ref,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{WORKER_URL}/run", json=payload, timeout=15)
        resp.raise_for_status()
