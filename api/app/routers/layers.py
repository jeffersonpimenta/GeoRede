import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import FeatureDetail, LayerInfo, SubestacaoEnergy, TrafoConsumers
from app.services.db import get_db

router = APIRouter(tags=["layers"])

TILE_SERVER_URL = os.environ.get("TILE_SERVER_URL", "http://localhost:3000")

# Whitelist de layer_id válidos → tabela qualificada no schema rede_bt
# NUNCA interpolar layer_id vindo de request directamente em SQL
LAYER_TABLE_MAP: dict[str, str] = {
    "seg_bt":              "rede_bt.seg_bt",
    "seg_mt":              "rede_bt.seg_mt",
    "seg_at":              "rede_bt.seg_at",
    "trafo":               "rede_bt.trafo",
    "trafo_sub":           "rede_bt.trafo_sub",
    "subestacao":          "rede_bt.subestacao",
    "consumidor_pj":       "rede_bt.consumidor_pj",
    "eq_corte":            "rede_bt.eq_corte",
    "geracao_dist":        "rede_bt.geracao_dist",
    "ramal_lig":           "rede_bt.ramal_lig",
    "ponto_notavel":       "rede_bt.ponto_notavel",
    "area_atendimento":    "rede_bt.area_atendimento",
    "conjunto":            "rede_bt.conjunto",
    "unidade_seg_mt":      "rede_bt.unidade_seg_mt",
    "unidade_seg_at":      "rede_bt.unidade_seg_at",
    "unidade_rede_mt":     "rede_bt.unidade_rede_mt",
    "unidade_rede_est_mt": "rede_bt.unidade_rede_est_mt",
}

# Lista estática de layers — só os metadados dinâmicos vêm da BD
LAYERS_CONFIG = [
    # ── Rede ──────────────────────────────────────────────────
    {"id": "seg_bt",     "nome": "Rede Baixa Tensão",     "tabela": "rede_bt.seg_bt",     "tipo_geom": "LineString"},
    {"id": "seg_mt",     "nome": "Rede Média Tensão",     "tabela": "rede_bt.seg_mt",     "tipo_geom": "LineString"},
    {"id": "seg_at",     "nome": "Rede Alta Tensão",      "tabela": "rede_bt.seg_at",     "tipo_geom": "LineString"},
    {"id": "ramal_lig",  "nome": "Ramais de Ligação",     "tabela": "rede_bt.ramal_lig",  "tipo_geom": "LineString"},
    # ── Equipamentos ─────────────────────────────────────────
    {"id": "trafo",         "nome": "Transformadores",       "tabela": "rede_bt.trafo",         "tipo_geom": "Point"},
    {"id": "trafo_sub",     "nome": "Trafos Subestação",     "tabela": "rede_bt.trafo_sub",     "tipo_geom": "Point"},
    {"id": "eq_corte",      "nome": "Chaves/Religadores",    "tabela": "rede_bt.eq_corte",      "tipo_geom": "Point"},
    {"id": "ponto_notavel", "nome": "Pontos Notáveis",       "tabela": "rede_bt.ponto_notavel", "tipo_geom": "Point"},
    # ── Instalações ──────────────────────────────────────────
    {"id": "subestacao",       "nome": "Subestações",       "tabela": "rede_bt.subestacao",       "tipo_geom": "Point"},
    {"id": "area_atendimento", "nome": "Área Atendimento",  "tabela": "rede_bt.area_atendimento", "tipo_geom": "Polygon"},
    {"id": "conjunto",         "nome": "Conjuntos",         "tabela": "rede_bt.conjunto",         "tipo_geom": "Polygon"},
    # ── Consumo / Geração ────────────────────────────────────
    {"id": "consumidor_pj", "nome": "Consumidores PJ",      "tabela": "rede_bt.consumidor_pj", "tipo_geom": "Point"},
    {"id": "geracao_dist",  "nome": "Geração Distribuída",   "tabela": "rede_bt.geracao_dist",  "tipo_geom": "Point"},
    # ── Perdas ───────────────────────────────────────────────
    {"id": "unidade_seg_mt",      "nome": "Perdas Seg. MT",     "tabela": "rede_bt.unidade_seg_mt",      "tipo_geom": "Point"},
    {"id": "unidade_seg_at",      "nome": "Perdas Seg. AT",     "tabela": "rede_bt.unidade_seg_at",      "tipo_geom": "Point"},
    {"id": "unidade_rede_mt",     "nome": "Perdas Rede MT",     "tabela": "rede_bt.unidade_rede_mt",     "tipo_geom": "Point"},
    {"id": "unidade_rede_est_mt", "nome": "Perdas Est. MT",     "tabela": "rede_bt.unidade_rede_est_mt", "tipo_geom": "Point"},
]


@router.get("/layers", response_model=List[LayerInfo])
async def list_layers(db: AsyncSession = Depends(get_db)):
    results = []

    for cfg in LAYERS_CONFIG:
        tabela = cfg["tabela"]  # valor vem de constante interna — sem interpolação de input externo

        try:
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
        except Exception:
            # Tabela pode não existir ainda (antes de migration)
            r = None

        results.append(
            LayerInfo(
                id=cfg["id"],
                nome=cfg["nome"],
                tabela=tabela,
                tipo_geom=cfg["tipo_geom"],
                n_registos=r.n_registos if r else 0,
                distribuidoras=r.distribuidoras or [] if r else [],
                anos=r.anos or [] if r else [],
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


@router.get("/layers/trafo/consumers/{cod_id}", response_model=TrafoConsumers)
async def get_trafo_consumers(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Contagem de consumidores e ramais ligados a um transformador."""
    row = await db.execute(text("""
        SELECT COUNT(*) AS total,
               COALESCE(SUM(demanda_kw), 0) AS demanda,
               COALESCE(SUM(consumo_mwh), 0) AS consumo,
               COALESCE(array_agg(DISTINCT classe)
                   FILTER (WHERE classe IS NOT NULL), ARRAY[]::text[]) AS classes
        FROM rede_bt.consumidor_pj WHERE uni_tr_d = :cod_id
    """), {"cod_id": cod_id})
    c = row.one()

    r = await db.execute(text(
        "SELECT COUNT(*) AS total FROM rede_bt.ramal_lig WHERE uni_tr_d = :cod_id"
    ), {"cod_id": cod_id})

    return TrafoConsumers(
        total_consumidores=c.total,
        total_ramais=r.scalar(),
        demanda_total_kw=c.demanda,
        consumo_total_mwh=c.consumo,
        classes=c.classes or [],
    )


# ─── Endpoints de enriquecimento (Fase 3) ───────────────────────────────────

@router.get("/layers/subestacao/details/{cod_id}")
async def get_subestacao_details(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Dados detalhados de subestação: barras, bays, eq_siat, eq_trsx, circuitos AT."""
    async def _fetch(tabela, fk_col):
        try:
            r = await db.execute(text(f"SELECT * FROM {tabela} WHERE {fk_col} = :cod_id LIMIT 100"), {"cod_id": cod_id})
            return [dict(row) for row in r.mappings().all()]
        except Exception:
            return []

    barras = await _fetch("rede_bt.barra", "sub_gd")
    bays = await _fetch("rede_bt.bay", "sub_gd")
    eq_siat = await _fetch("rede_bt.eq_siat", "sub_gd")
    eq_trsx = await _fetch("rede_bt.eq_trsx", "sub_gd")
    ctat = await _fetch("rede_bt.ctat_dados", "sub_gd")

    return {
        "barras": barras,
        "bays": bays,
        "eq_siat": eq_siat,
        "eq_trsx": eq_trsx,
        "circuitos_at": ctat,
    }


@router.get("/layers/trafo/details/{cod_id}")
async def get_trafo_details(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Equipamentos e iluminação de um transformador."""
    try:
        r = await db.execute(text("SELECT * FROM rede_bt.eq_trafo_dist WHERE uni_tr_d = :cod_id LIMIT 50"), {"cod_id": cod_id})
        equipamentos = [dict(row) for row in r.mappings().all()]
    except Exception:
        equipamentos = []

    try:
        r = await db.execute(text("""
            SELECT COUNT(*) AS total, COALESCE(SUM(pot_lamp), 0) AS pot_total
            FROM rede_bt.pip WHERE uni_tr_d = :cod_id
        """), {"cod_id": cod_id})
        pip = dict(r.one()._mapping)
    except Exception:
        pip = {"total": 0, "pot_total": 0}

    return {"equipamentos": equipamentos, "iluminacao": pip}


@router.get("/layers/ctmt/details/{cod_id}")
async def get_ctmt_details(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Dados do circuito MT: energéticos, contagens, equipamentos."""
    try:
        r = await db.execute(text("SELECT * FROM rede_bt.ctmt_dados WHERE cod_id = :cod_id LIMIT 1"), {"cod_id": cod_id})
        dados = dict(r.mappings().one()) if r else None
    except Exception:
        dados = None

    try:
        r = await db.execute(text("SELECT COUNT(*) AS total FROM rede_bt.eq_regulador WHERE ctmt = :cod_id"), {"cod_id": cod_id})
        n_reguladores = r.scalar()
    except Exception:
        n_reguladores = 0

    try:
        r = await db.execute(text("SELECT COUNT(*) AS total FROM rede_bt.eq_seccionamento WHERE ctmt = :cod_id"), {"cod_id": cod_id})
        n_seccionamento = r.scalar()
    except Exception:
        n_seccionamento = 0

    return {"dados": dados, "n_reguladores": n_reguladores, "n_seccionamento": n_seccionamento}


@router.get("/layers/segcon/lookup/{cod_id}")
async def get_segcon_lookup(cod_id: str, db: AsyncSession = Depends(get_db)):
    """Detalhes do condutor por código."""
    r = await db.execute(text("SELECT * FROM rede_bt.segcon WHERE cod_id = :cod_id LIMIT 1"), {"cod_id": cod_id})
    record = r.mappings().one_or_none()
    if record is None:
        raise HTTPException(status_code=404, detail=f"Condutor '{cod_id}' não encontrado.")
    return dict(record)


# ─── Busca global (Fase 5) ──────────────────────────────────────────────────

@router.get("/search")
async def global_search(q: str = Query(..., min_length=2), db: AsyncSession = Depends(get_db)):
    """Busca por cod_id em todas as tabelas geográficas."""
    results = []
    for layer_id, tabela in LAYER_TABLE_MAP.items():
        try:
            r = await db.execute(
                text(f"SELECT id, cod_id FROM {tabela} WHERE cod_id = :q LIMIT 5"),
                {"q": q},
            )
            for row in r.mappings().all():
                results.append({"layer_id": layer_id, "id": row["id"], "cod_id": row["cod_id"]})
        except Exception:
            continue
    return results


# ─── Feature endpoints ──────────────────────────────────────────────────────

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
