from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import dashboard, ingestao, layers

app = FastAPI(
    title="Mapa Rede BT — API",
    description="API de metadados e ingestão — BDGD/ANEEL",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(layers.router, prefix="/api")
app.include_router(ingestao.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/health", tags=["infra"])
async def health():
    return {"status": "ok"}
