from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.db import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Tabelas de contagem — layer_id → tabela
_COUNT_TABLES = {
    "seg_bt": "rede_bt.seg_bt",
    "seg_mt": "rede_bt.seg_mt",
    "seg_at": "rede_bt.seg_at",
    "trafo": "rede_bt.trafo",
    "trafo_sub": "rede_bt.trafo_sub",
    "subestacao": "rede_bt.subestacao",
    "consumidor_pj": "rede_bt.consumidor_pj",
    "geracao_dist": "rede_bt.geracao_dist",
    "eq_corte": "rede_bt.eq_corte",
    "ramal_lig": "rede_bt.ramal_lig",
    "ponto_notavel": "rede_bt.ponto_notavel",
}


@router.get("/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Contagens por tabela + metadados base."""
    counts = {}
    for layer_id, tabela in _COUNT_TABLES.items():
        try:
            r = await db.execute(text(f"SELECT COUNT(*) AS n FROM {tabela}"))
            counts[layer_id] = r.scalar()
        except Exception:
            counts[layer_id] = 0

    # Base metadata
    try:
        r = await db.execute(text("SELECT * FROM rede_bt.base_metadata LIMIT 1"))
        base = dict(r.mappings().one()) if r else None
    except Exception:
        base = None

    return {"counts": counts, "base": base}


@router.get("/energy-balance/{distribuidora}")
async def energy_balance(distribuidora: str, db: AsyncSession = Depends(get_db)):
    """Balanço energético + perdas de uma distribuidora."""
    async def _all(tabela):
        try:
            r = await db.execute(
                text(f"SELECT * FROM {tabela} WHERE distribuidora = :d ORDER BY ano_ref DESC"),
                {"d": distribuidora},
            )
            return [dict(row) for row in r.mappings().all()]
        except Exception:
            return []

    return {
        "balanco": await _all("rede_bt.balanco_energia"),
        "energia_propria": await _all("rede_bt.energia_propria"),
        "perda_tecnica": await _all("rede_bt.perda_tecnica"),
        "perda_nao_tecnica": await _all("rede_bt.perda_nao_tecnica"),
    }


@router.get("/indicators/{distribuidora}")
async def indicators(distribuidora: str, db: AsyncSession = Depends(get_db)):
    """Indicadores de gestão por município."""
    try:
        r = await db.execute(
            text("SELECT * FROM rede_bt.indicador_gestao WHERE distribuidora = :d ORDER BY mun_id"),
            {"d": distribuidora},
        )
        return [dict(row) for row in r.mappings().all()]
    except Exception:
        return []
