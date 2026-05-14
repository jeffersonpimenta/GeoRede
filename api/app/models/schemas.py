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
    # FK / contexto BDGD (seg_bt, seg_mt, trafo, consumidor_pj)
    ctmt: Optional[str] = None
    uni_tr_d: Optional[str] = None
    pac_1: Optional[str] = None
    pac_2: Optional[str] = None
    tipo_cabo: Optional[str] = None
    fas_con: Optional[str] = None
    tip_rede: Optional[str] = None
    # trafo FK
    sub_gd: Optional[str] = None
    tip_trf: Optional[str] = None
    mun_id: Optional[str] = None
    # subestacao
    pac: Optional[str] = None
    tip_sub: Optional[str] = None
    dem_med: Optional[float] = None
    # consumidor_pj FK
    tip_cc: Optional[str] = None
    gru_ten: Optional[str] = None
    dmcr: Optional[float] = None
    # eq_corte
    tip_eqp: Optional[str] = None
    cap_int: Optional[float] = None
    class_cont: Optional[str] = None
    # geracao_dist
    tip_gd: Optional[str] = None
    pot_inst: Optional[float] = None
    ceg_gd: Optional[str] = None
    # ramal_lig
    comp: Optional[float] = None
    # ponto_notavel
    tip_pnt: Optional[str] = None


class SubestacaoEnergy(BaseModel):
    id: int
    cod_id: Optional[str] = None
    distribuidora: Optional[str] = None
    ano_ref: Optional[int] = None
    sub_gd: Optional[str] = None
    ene_01: Optional[float] = None
    ene_02: Optional[float] = None
    ene_03: Optional[float] = None
    ene_04: Optional[float] = None
    ene_05: Optional[float] = None
    ene_06: Optional[float] = None
    ene_07: Optional[float] = None
    ene_08: Optional[float] = None
    ene_09: Optional[float] = None
    ene_10: Optional[float] = None
    ene_11: Optional[float] = None
    ene_12: Optional[float] = None
    dem_max: Optional[float] = None
    fp_med: Optional[float] = None


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
