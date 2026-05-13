"""
Servidor HTTP do worker — recebe pedidos de ingestão da API e executa em thread.
"""
import subprocess
import sys
import threading

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class RunRequest(BaseModel):
    job_id: str
    url_gdb: str
    entidades: str       # vírgula-separado: "RAMBT,TRAFO"
    distribuidora: str
    ano: int


@app.post("/run", status_code=202)
def run_job(req: RunRequest):
    def _execute():
        proc = subprocess.Popen(
            [
                sys.executable, "/worker/ingest.py",
                "--url",          req.url_gdb,
                "--entidades",    req.entidades,
                "--distribuidora", req.distribuidora,
                "--ano",          str(req.ano),
                "--job-id",       req.job_id,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        for line in proc.stdout:
            print(f"[job {req.job_id[:8]}] {line}", end="", flush=True)
        proc.wait()

    threading.Thread(target=_execute, daemon=True).start()
    return {"job_id": req.job_id, "status": "started"}


@app.get("/health")
def health():
    return {"status": "ok"}
