from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class LayerInfo(BaseModel):
    id: str
    nome: str
    tabela: str
    tipo_geom: str
    n_registos: int
    distribuidoras: List[str]
    anos: List[int]
    tile_url: str


class FeatureDetail(BaseModel):
    id: int
    cod_id: Optional[str] = None
    distribuidora: Optional[str] = None
    ano_ref: Optional[int] = None
    # seg_bt / seg_mt
    tensao_nom: Optional[float] = None
    comprimento: Optional[float] = None
    fases: Optional[str] = None
    condutor: Optional[str] = None
    # trafo
    potencia_kva: Optional[float] = None
    tensao_prim: Optional[float] = None
    tensao_sec: Optional[float] = None
    # subestacao
    nome: Optional[str] = None
    potencia_mva: Optional[float] = None
    # consumidor_pj
    nivel_tensao: Optional[str] = None
    classe: Optional[str] = None
    demanda_kw: Optional[float] = None
    consumo_mwh: Optional[float] = None


# ─── Ingestão ─────────────────────────────────────────────────────────────────

class IngestaoRequest(BaseModel):
    distribuidora: str
    ano_ref: int
    url_gdb: str
    entidades: List[str]


class IngestaoStatus(BaseModel):
    job_id: str
    distribuidora: Optional[str] = None
    ano_ref: Optional[int] = None
    entidade: Optional[str] = None
    status: str
    mensagem: Optional[str] = None
    n_registos: Optional[int] = None
    iniciado_em: Optional[datetime] = None
    concluido_em: Optional[datetime] = None


class IngestaoHistoricoItem(BaseModel):
    id: int
    job_id: Optional[str] = None
    distribuidora: Optional[str] = None
    ano_ref: Optional[int] = None
    entidade: Optional[str] = None
    n_registos: Optional[int] = None
    status: Optional[str] = None
    mensagem: Optional[str] = None
    iniciado_em: Optional[datetime] = None
    concluido_em: Optional[datetime] = None


class DistribuidoraInfo(BaseModel):
    sigla: str
    nome: str
    url_gdb: str
