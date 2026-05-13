import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import (
    DistribuidoraInfo,
    IngestaoHistoricoItem,
    IngestaoRequest,
    IngestaoStatus,
)
from app.services.db import get_db
from app.services.ingestor import launch_worker

router = APIRouter(prefix="/ingestao", tags=["ingestao"])

# Lista de distribuidoras — URLs BDGD ANEEL (ArcGIS Open Data)
# URL padrão: https://aneel.maps.arcgis.com/sharing/rest/content/items/{ID}/data
# IDs obtidos do catálogo dadosabertos-aneel.opendata.arcgis.com — dados 2024
_BASE = "https://aneel.maps.arcgis.com/sharing/rest/content/items/{}/data"

DISTRIBUIDORAS: list[dict] = [
    # ── Enel ──────────────────────────────────────────────────────────────────
    {
        "sigla": "ENEL_CE",
        "nome": "Enel Distribuição Ceará",
        "url_gdb": _BASE.format("f9d38bba5dcb4525bcf19b03666197da"),
    },
    {
        "sigla": "ENEL_SP",
        "nome": "Enel Distribuição São Paulo",
        "url_gdb": _BASE.format("991f67542c4a4703bebf057f515a976b"),
    },
    {
        "sigla": "ENEL_RJ",
        "nome": "Enel Distribuição Rio de Janeiro",
        "url_gdb": _BASE.format("6d53789f98c74cbb84c070ecb4633b0f"),
    },
    {
        "sigla": "EQ_GO",
        "nome": "Equatorial Goiás (ex-Enel GO)",
        "url_gdb": _BASE.format("4c2fc0e35982454bbc54db53d1532b90"),
    },
    # ── Neoenergia ────────────────────────────────────────────────────────────
    {
        "sigla": "NEO_PE",
        "nome": "Neoenergia Pernambuco (Celpe)",
        "url_gdb": _BASE.format("11a1feed9e3242d1bce8fe8af0a48e4b"),
    },
    {
        "sigla": "NEO_BA",
        "nome": "Neoenergia Coelba (Bahia)",
        "url_gdb": _BASE.format("cd78b8f92880449c8230c662e9c4102b"),
    },
    {
        "sigla": "NEO_COSERN",
        "nome": "Neoenergia Cosern (Rio Grande do Norte)",
        "url_gdb": _BASE.format("73fbf2ce59ca406aaf7830e98a01a34a"),
    },
    {
        "sigla": "NEO_ELEKTRO",
        "nome": "Neoenergia Elektro (SP/MS)",
        "url_gdb": _BASE.format("8eaa712a707745adac9948b24e188bd9"),
    },
    {
        "sigla": "NEO_BRASILIA",
        "nome": "Neoenergia Brasília (DF)",
        "url_gdb": _BASE.format("c50b02337f2141c9814255c149433437"),
    },
    # ── Cemig / Copel / Celesc ────────────────────────────────────────────────
    {
        "sigla": "CEMIG_D",
        "nome": "Cemig Distribuição (Minas Gerais)",
        "url_gdb": _BASE.format("7dcfe1549a4c4df29b02f164b0c362c5"),
    },
    {
        "sigla": "COPEL_DIS",
        "nome": "Copel Distribuição (Paraná)",
        "url_gdb": _BASE.format("d31f897573b64963ba31a820aabca897"),
    },
    {
        "sigla": "CELESC_DIS",
        "nome": "Celesc Distribuição (Santa Catarina)",
        "url_gdb": _BASE.format("bdbcd6d12aee4a4fb9d86dca8aca1323"),
    },
    # ── CPFL ──────────────────────────────────────────────────────────────────
    {
        "sigla": "CPFL_PAULISTA",
        "nome": "CPFL Paulista",
        "url_gdb": _BASE.format("0cb23e98e49e4a89b2b72ee315112a78"),
    },
    {
        "sigla": "CPFL_PIRATININGA",
        "nome": "CPFL Piratininga",
        "url_gdb": _BASE.format("45081d05c49d4e428200311ba9d09acf"),
    },
    {
        "sigla": "RGE",
        "nome": "RGE / CPFL Rio Grande do Sul",
        "url_gdb": _BASE.format("9ad0d5bfc98648f880c488dfbfff1646"),
    },
    # ── Equatorial ────────────────────────────────────────────────────────────
    {
        "sigla": "EQ_PA",
        "nome": "Equatorial Pará",
        "url_gdb": _BASE.format("60a26bb11754487db39fa6bb91e5dce2"),
    },
    {
        "sigla": "EQ_MA",
        "nome": "Equatorial Maranhão",
        "url_gdb": _BASE.format("ba59d4a881684374b53f51656b945b18"),
    },
    {
        "sigla": "EQ_AL",
        "nome": "Equatorial Alagoas",
        "url_gdb": _BASE.format("78d8ae0fe3cc46888dc37f2c87bc3f00"),
    },
    {
        "sigla": "EQ_PI",
        "nome": "Equatorial Piauí",
        "url_gdb": _BASE.format("642e8c25d57d4a3893c0d069c4363911"),
    },
    {
        "sigla": "CEEE_EQ",
        "nome": "Equatorial Rio Grande do Sul (CEEE)",
        "url_gdb": _BASE.format("15b77072ab3b46bb8581cca726cdf08a"),
    },
    # ── Energisa ──────────────────────────────────────────────────────────────
    {
        "sigla": "ENERGISA_MT",
        "nome": "Energisa Mato Grosso",
        "url_gdb": _BASE.format("8fed7443387d4d04a361e7f4d1edea64"),
    },
    {
        "sigla": "ENERGISA_MS",
        "nome": "Energisa Mato Grosso do Sul",
        "url_gdb": _BASE.format("b7fad4cd388845a08a01643599ec747b"),
    },
    {
        "sigla": "ENERGISA_PB",
        "nome": "Energisa Paraíba",
        "url_gdb": _BASE.format("700e0bfcb04349fea9d1d0af43c2a354"),
    },
    {
        "sigla": "ENERGISA_SE",
        "nome": "Energisa Sergipe",
        "url_gdb": _BASE.format("910e329827a04ffda153c235ac9c5bc1"),
    },
    {
        "sigla": "ENERGISA_TO",
        "nome": "Energisa Tocantins",
        "url_gdb": _BASE.format("1bfec53ce077408581c6b2a82076d89a"),
    },
    {
        "sigla": "ENERGISA_RO",
        "nome": "Energisa Rondônia",
        "url_gdb": _BASE.format("cb6bd431508544a49256c4a03cdf7cc7"),
    },
    {
        "sigla": "ENERGISA_AC",
        "nome": "Energisa Acre",
        "url_gdb": _BASE.format("0d3f9d648eb54c758b592b794faf2ccc"),
    },
    {
        "sigla": "ENERGISA_MR",
        "nome": "Energisa Minas Rio",
        "url_gdb": _BASE.format("bc209c308cac42b9b03fb963ca9c5602"),
    },
    {
        "sigla": "ENERGISA_BOR",
        "nome": "Energisa Borborema",
        "url_gdb": _BASE.format("52683032a8134d43951ddc860d360f4d"),
    },
    # ── Light / EDP ───────────────────────────────────────────────────────────
    {
        "sigla": "LIGHT",
        "nome": "Light (Rio de Janeiro)",
        "url_gdb": _BASE.format("6a3c464bde7b4c0b9dc661f99341e050"),
    },
    {
        "sigla": "EDP_SP",
        "nome": "EDP São Paulo",
        "url_gdb": _BASE.format("659c0309e8f2433a9d08bf4de2715d99"),
    },
    {
        "sigla": "EDP_ES",
        "nome": "EDP Espírito Santo",
        "url_gdb": _BASE.format("dc96ad6d57684c3e97dd38d063501d1a"),
    },
    # ── Norte / Centro-Oeste ──────────────────────────────────────────────────
    {
        "sigla": "AME",
        "nome": "Amazonas Energia",
        "url_gdb": _BASE.format("f7f2d8505ede499280237b16a54c84c4"),
    },
    {
        "sigla": "DMED",
        "nome": "Dmed (Minas Gerais)",
        "url_gdb": _BASE.format("5cd60c9c3ea5449593ea91b2390edfad"),
    },
]

ENTIDADES_VALIDAS = {"RAMBT", "RAMMT", "TRAFO", "SSDMT", "UCBT_PJ", "UCMT_PJ", "UCAT_PJ"}


@router.get("/distribuidoras", response_model=List[DistribuidoraInfo])
async def list_distribuidoras():
    return [DistribuidoraInfo(**d) for d in DISTRIBUIDORAS]


@router.post("/iniciar", status_code=202)
async def iniciar_ingestao(body: IngestaoRequest, db: AsyncSession = Depends(get_db)):
    # Validar entidades
    invalidas = set(body.entidades) - ENTIDADES_VALIDAS
    if invalidas:
        raise HTTPException(
            status_code=422,
            detail=f"Entidades inválidas: {sorted(invalidas)}. Válidas: {sorted(ENTIDADES_VALIDAS)}",
        )
    if not body.entidades:
        raise HTTPException(status_code=422, detail="Seleccione pelo menos uma entidade.")

    job_id = str(uuid.uuid4())

    # Lança worker em background — não aguarda conclusão
    await launch_worker(
        job_id=job_id,
        url_gdb=body.url_gdb,
        entidades=body.entidades,
        distribuidora=body.distribuidora,
        ano_ref=body.ano_ref,
    )

    return {"job_id": job_id}


@router.get("/status/{job_id}", response_model=List[IngestaoStatus])
async def get_status(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            SELECT id, job_id, distribuidora, ano_ref, entidade,
                   status, mensagem, n_registos, iniciado_em, concluido_em
            FROM rede_bt.ingestao_log
            WHERE job_id = :job_id
            ORDER BY iniciado_em
            """
        ),
        {"job_id": job_id},
    )
    rows = result.mappings().all()

    if not rows:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' não encontrado.")

    return [IngestaoStatus(**dict(r)) for r in rows]


@router.get("/historico", response_model=List[IngestaoHistoricoItem])
async def get_historico(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text(
            """
            SELECT id, job_id, distribuidora, ano_ref, entidade,
                   n_registos, status, mensagem, iniciado_em, concluido_em
            FROM rede_bt.ingestao_log
            ORDER BY iniciado_em DESC
            LIMIT 200
            """
        )
    )
    rows = result.mappings().all()
    return [IngestaoHistoricoItem(**dict(r)) for r in rows]
