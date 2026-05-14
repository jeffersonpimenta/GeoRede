import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import FeatureDetail, LayerInfo, SubestacaoEnergy
from app.services.db import get_db

router = APIRouter(tags=["layers"])

TILE_SERVER_URL = os.environ.get("TILE_SERVER_URL", "http://localhost:3000")

# Whitelist de layer_id válidos → tabela qualificada no schema rede_bt
# NUNCA interpolar layer_id vindo de request directamente em SQL
LAYER_TABLE_MAP: dict[str, str] = {
    "seg_bt":        "rede_bt.seg_bt",
    "seg_mt":        "rede_bt.seg_mt",
    "trafo":         "rede_bt.trafo",
    "subestacao":    "rede_bt.subestacao",
    "consumidor_pj": "rede_bt.consumidor_pj",
    "eq_corte":      "rede_bt.eq_corte",
    "geracao_dist":  "rede_bt.geracao_dist",
    "ramal_lig":     "rede_bt.ramal_lig",
}

# Lista estática de layers — só os metadados dinâmicos vêm da BD
LAYERS_CONFIG = [
    {
        "id": "seg_bt",
        "nome": "Rede Baixa Tensão",
        "tabela": "rede_bt.seg_bt",
        "tipo_geom": "LineString",
    },
    {
        "id": "seg_mt",
        "nome": "Rede Média Tensão",
        "tabela": "rede_bt.seg_mt",
        "tipo_geom": "LineString",
    },
    {
        "id": "trafo",
        "nome": "Transformadores",
        "tabela": "rede_bt.trafo",
        "tipo_geom": "Point",
    },
    {
        "id": "subestacao",
        "nome": "Subestações",
        "tabela": "rede_bt.subestacao",
        "tipo_geom": "Point",
    },
    {
        "id": "consumidor_pj",
        "nome": "Consumidores PJ",
        "tabela": "rede_bt.consumidor_pj",
        "tipo_geom": "Point",
    },
    {
        "id": "eq_corte",
        "nome": "Chaves/Religadores",
        "tabela": "rede_bt.eq_corte",
        "tipo_geom": "Point",
    },
    {
        "id": "geracao_dist",
        "nome": "Geração Distribuída",
        "tabela": "rede_bt.geracao_dist",
        "tipo_geom": "Point",
    },
    {
        "id": "ramal_lig",
        "nome": "Ramais de Ligação",
        "tabela": "rede_bt.ramal_lig",
        "tipo_geom": "LineString",
    },
]


@router.get("/layers", response_model=List[LayerInfo])
async def list_layers(db: AsyncSession = Depends(get_db)):
    results = []

    for cfg in LAYERS_CONFIG:
        tabela = cfg["tabela"]  # valor vem de constante interna — sem interpolação de input externo

        row = await db.execute(
            text(
                f"""
                SELECT
                    COUNT(*)                                      AS n_registos,
                    COALESCE(
                        array_agg(DISTINCT distribuidora)
                        FILTER (WHERE distribuidora IS NOT NULL),
                        ARRAY[]::text[]
                    )                                             AS distribuidoras,
                    COALESCE(
                        array_agg(DISTINCT ano_ref ORDER BY ano_ref)
                        FILTER (WHERE ano_ref IS NOT NULL),
                        ARRAY[]::integer[]
                    )                                             AS anos
                FROM {tabela}
                """
            )
        )
        r = row.one()

        results.append(
            LayerInfo(
                id=cfg["id"],
                nome=cfg["nome"],
                tabela=tabela,
                tipo_geom=cfg["tipo_geom"],
                n_registos=r.n_registos,
                distribuidoras=r.distribuidoras or [],
                anos=r.anos or [],
                tile_url=f"{TILE_SERVER_URL}/{cfg['id']}/{{z}}/{{x}}/{{y}}",
            )
        )

    return results


@router.get("/layers/subestacao/energy/{cod_id}", response_model=SubestacaoEnergy)
async def get_subestacao_energy(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Dados energéticos mensais de uma subestação (tabela ssdat)."""
    row = await db.execute(
        text(
            "SELECT * FROM rede_bt.ssdat WHERE sub_gd = :cod_id ORDER BY ano_ref DESC LIMIT 1"
        ),
        {"cod_id": cod_id},
    )
    record = row.mappings().one_or_none()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Dados energéticos para subestação '{cod_id}' não encontrados.",
        )

    return SubestacaoEnergy(**dict(record))


@router.get("/layers/{layer_id}/feature/{feature_id}", response_model=FeatureDetail)
async def get_feature(layer_id: str, feature_id: int, db: AsyncSession = Depends(get_db)):
    tabela = LAYER_TABLE_MAP.get(layer_id)
    if tabela is None:
        raise HTTPException(
            status_code=404,
            detail=f"Layer '{layer_id}' não existe. Valores válidos: {list(LAYER_TABLE_MAP)}",
        )

    # tabela vem da whitelist interna — seguro interpolar no SQL
    # feature_id é int validado pelo FastAPI — sem risco de injecção
    row = await db.execute(
        text(f"SELECT * FROM {tabela} WHERE id = :fid"),
        {"fid": feature_id},
    )
    record = row.mappings().one_or_none()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Feature id={feature_id} não encontrado em '{layer_id}'.",
        )

    # Excluir coluna geom — desnecessária no popup (mapa já tem geometria via tile)
    data = {k: v for k, v in record.items() if k != "geom"}
    return FeatureDetail(**data)


@router.get("/layers/{layer_id}/feature/by-cod-id/{cod_id}", response_model=FeatureDetail)
async def get_feature_by_cod_id(layer_id: str, cod_id: str, db: AsyncSession = Depends(get_db)):
    tabela = LAYER_TABLE_MAP.get(layer_id)
    if tabela is None:
        raise HTTPException(
            status_code=404,
            detail=f"Layer '{layer_id}' não existe. Valores válidos: {list(LAYER_TABLE_MAP)}",
        )

    # tabela vem da whitelist interna — seguro interpolar no SQL
    # cod_id é passado como parâmetro vinculado — sem risco de injecção
    row = await db.execute(
        text(f"SELECT * FROM {tabela} WHERE cod_id = :cod_id LIMIT 1"),
        {"cod_id": cod_id},
    )
    record = row.mappings().one_or_none()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Feature cod_id='{cod_id}' não encontrado em '{layer_id}'.",
        )

    data = {k: v for k, v in record.items() if k != "geom"}
    return FeatureDetail(**data)
