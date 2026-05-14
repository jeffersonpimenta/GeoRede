-- Schema da rede elétrica BT/MT — BDGD/ANEEL
-- SRID: 4674 (SIRGAS 2000) — datum nativo da BDGD

-- ─────────────────────────────────────────────────────────────
-- Segmentos de rede de Baixa Tensão
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.seg_bt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,        -- Código identificador ANEEL
    distribuidora TEXT,        -- Ex: ENEL_SP, CELPE
    tensao_nom    NUMERIC,     -- Tensão nominal (kV)
    comprimento   NUMERIC,     -- Comprimento do segmento (metros)
    fases         TEXT,        -- Fases condutoras: A, B, C, AB, ABC...
    condutor      TEXT,        -- Tipo de condutor
    ano_ref       INTEGER,     -- Ano de referência da BDGD
    -- FK / contexto BDGD
    ctmt          TEXT,        -- Circuito MT ao qual pertence
    uni_tr_d      TEXT,        -- Transformador distribuição (FK → trafo.cod_id)
    pac_1         TEXT,        -- Ponto de acesso 1
    pac_2         TEXT,        -- Ponto de acesso 2
    tipo_cabo     TEXT,        -- Tipo de cabo
    fas_con       TEXT,        -- Fases condutoras (detalhe BDGD)
    tip_rede      TEXT,        -- Tipo de rede (aérea, subterrânea, etc.)
    geom          GEOMETRY(MultiLineString, 4674)
);

COMMENT ON TABLE  rede_bt.seg_bt              IS 'Segmentos de rede de Baixa Tensão (SSDBT) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.seg_bt.cod_id       IS 'Código identificador único ANEEL';
COMMENT ON COLUMN rede_bt.seg_bt.distribuidora IS 'Sigla da distribuidora (ex: ENEL_SP)';
COMMENT ON COLUMN rede_bt.seg_bt.tensao_nom   IS 'Tensão nominal em kV';
COMMENT ON COLUMN rede_bt.seg_bt.comprimento  IS 'Comprimento do segmento em metros';
COMMENT ON COLUMN rede_bt.seg_bt.ano_ref      IS 'Ano de referência da base BDGD';
COMMENT ON COLUMN rede_bt.seg_bt.geom         IS 'Geometria LineString — SIRGAS 2000 (EPSG:4674)';

CREATE INDEX ON rede_bt.seg_bt USING GIST (geom);
CREATE INDEX ON rede_bt.seg_bt (distribuidora);
CREATE INDEX ON rede_bt.seg_bt (ano_ref);
CREATE INDEX ON rede_bt.seg_bt (uni_tr_d);


-- ─────────────────────────────────────────────────────────────
-- Segmentos de rede de Média Tensão
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.seg_mt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    tensao_nom    NUMERIC,
    comprimento   NUMERIC,
    fases         TEXT,
    condutor      TEXT,
    ano_ref       INTEGER,
    -- FK / contexto BDGD
    ctmt          TEXT,        -- Circuito MT
    pac_1         TEXT,
    pac_2         TEXT,
    tipo_cabo     TEXT,
    fas_con       TEXT,
    tip_rede      TEXT,
    geom          GEOMETRY(MultiLineString, 4674)
);

COMMENT ON TABLE  rede_bt.seg_mt              IS 'Segmentos de rede de Média Tensão (SSDMT) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.seg_mt.cod_id       IS 'Código identificador único ANEEL';
COMMENT ON COLUMN rede_bt.seg_mt.distribuidora IS 'Sigla da distribuidora';
COMMENT ON COLUMN rede_bt.seg_mt.tensao_nom   IS 'Tensão nominal em kV';
COMMENT ON COLUMN rede_bt.seg_mt.comprimento  IS 'Comprimento do segmento em metros';
COMMENT ON COLUMN rede_bt.seg_mt.ano_ref      IS 'Ano de referência da base BDGD';
COMMENT ON COLUMN rede_bt.seg_mt.geom         IS 'Geometria LineString — SIRGAS 2000 (EPSG:4674)';

CREATE INDEX ON rede_bt.seg_mt USING GIST (geom);
CREATE INDEX ON rede_bt.seg_mt (distribuidora);
CREATE INDEX ON rede_bt.seg_mt (ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Transformadores MT/BT
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.trafo (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    potencia_kva  NUMERIC,     -- Potência nominal (kVA)
    tensao_prim   NUMERIC,     -- Tensão no primário (kV)
    tensao_sec    NUMERIC,     -- Tensão no secundário (kV)
    ano_ref       INTEGER,
    -- FK / contexto BDGD
    ctmt          TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    sub_gd        TEXT,        -- Subestação (FK → subestacao.cod_id)
    fas_con       TEXT,
    tip_trf       TEXT,        -- Tipo de transformador
    mun_id        TEXT,        -- Município
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE  rede_bt.trafo              IS 'Transformadores MT/BT (TRAFO) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.trafo.cod_id       IS 'Código identificador único ANEEL';
COMMENT ON COLUMN rede_bt.trafo.distribuidora IS 'Sigla da distribuidora';
COMMENT ON COLUMN rede_bt.trafo.potencia_kva IS 'Potência nominal em kVA';
COMMENT ON COLUMN rede_bt.trafo.tensao_prim  IS 'Tensão no enrolamento primário (kV)';
COMMENT ON COLUMN rede_bt.trafo.tensao_sec   IS 'Tensão no enrolamento secundário (kV)';
COMMENT ON COLUMN rede_bt.trafo.ano_ref      IS 'Ano de referência da base BDGD';
COMMENT ON COLUMN rede_bt.trafo.geom         IS 'Geometria Point — SIRGAS 2000 (EPSG:4674)';

CREATE INDEX ON rede_bt.trafo USING GIST (geom);
CREATE INDEX ON rede_bt.trafo (distribuidora);
CREATE INDEX ON rede_bt.trafo (ano_ref);
CREATE INDEX ON rede_bt.trafo (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- Subestações de distribuição MT
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.subestacao (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    nome          TEXT,        -- Nome da subestação
    distribuidora TEXT,
    tensao_prim   NUMERIC,     -- Tensão no primário (kV)
    tensao_sec    NUMERIC,     -- Tensão no secundário (kV)
    potencia_mva  NUMERIC,     -- Potência nominal (MVA)
    ano_ref       INTEGER,
    -- FK / contexto BDGD
    pac           TEXT,        -- Ponto de acesso
    tip_sub       TEXT,        -- Tipo de subestação
    dem_med       NUMERIC,     -- Demanda média (MVA)
    geom          GEOMETRY(Geometry, 4674)  -- Point (V11+) ou MultiLineString (formato antigo)
);

COMMENT ON TABLE  rede_bt.subestacao              IS 'Subestações de distribuição MT (SSDMT) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.subestacao.cod_id       IS 'Código identificador único ANEEL';
COMMENT ON COLUMN rede_bt.subestacao.nome         IS 'Nome da subestação';
COMMENT ON COLUMN rede_bt.subestacao.distribuidora IS 'Sigla da distribuidora';
COMMENT ON COLUMN rede_bt.subestacao.tensao_prim  IS 'Tensão no enrolamento primário (kV)';
COMMENT ON COLUMN rede_bt.subestacao.tensao_sec   IS 'Tensão no enrolamento secundário (kV)';
COMMENT ON COLUMN rede_bt.subestacao.potencia_mva IS 'Potência nominal em MVA';
COMMENT ON COLUMN rede_bt.subestacao.ano_ref      IS 'Ano de referência da base BDGD';
COMMENT ON COLUMN rede_bt.subestacao.geom         IS 'Geometria Point — SIRGAS 2000 (EPSG:4674)';

CREATE INDEX ON rede_bt.subestacao USING GIST (geom);
CREATE INDEX ON rede_bt.subestacao (distribuidora);
CREATE INDEX ON rede_bt.subestacao (ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Unidades Consumidoras — Pessoas Jurídicas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.consumidor_pj (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    nivel_tensao  TEXT,        -- AT, MT ou BT
    classe        TEXT,        -- Industrial, Comercial, etc.
    demanda_kw    NUMERIC,     -- Demanda contratada (kW)
    consumo_mwh   NUMERIC,     -- Consumo anual (MWh)
    ano_ref       INTEGER,
    -- FK / contexto BDGD
    ctmt          TEXT,
    uni_tr_d      TEXT,        -- Transformador distribuição (FK → trafo.cod_id)
    pac           TEXT,
    mun_id        TEXT,
    tip_cc        TEXT,        -- Tipo de conexão
    gru_ten       TEXT,        -- Grupo de tensão
    dmcr          NUMERIC,     -- Demanda média calculada (kW)
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE  rede_bt.consumidor_pj              IS 'Unidades Consumidoras PJ (UCBT_PJ / UCMT_PJ / UCAT_PJ) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.consumidor_pj.cod_id       IS 'Código identificador único ANEEL';
COMMENT ON COLUMN rede_bt.consumidor_pj.distribuidora IS 'Sigla da distribuidora';
COMMENT ON COLUMN rede_bt.consumidor_pj.nivel_tensao IS 'Nível de tensão de conexão: AT, MT ou BT';
COMMENT ON COLUMN rede_bt.consumidor_pj.classe       IS 'Classe de consumo (industrial, comercial, etc.)';
COMMENT ON COLUMN rede_bt.consumidor_pj.demanda_kw   IS 'Demanda contratada em kW';
COMMENT ON COLUMN rede_bt.consumidor_pj.consumo_mwh  IS 'Consumo anual em MWh';
COMMENT ON COLUMN rede_bt.consumidor_pj.ano_ref      IS 'Ano de referência da base BDGD';
COMMENT ON COLUMN rede_bt.consumidor_pj.geom         IS 'Geometria Point — SIRGAS 2000 (EPSG:4674)';

CREATE INDEX ON rede_bt.consumidor_pj USING GIST (geom);
CREATE INDEX ON rede_bt.consumidor_pj (distribuidora);
CREATE INDEX ON rede_bt.consumidor_pj (ano_ref);
CREATE INDEX ON rede_bt.consumidor_pj (uni_tr_d);


-- ─────────────────────────────────────────────────────────────
-- Registo de ingestões realizadas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.ingestao_log (
    id            SERIAL PRIMARY KEY,
    job_id        TEXT,                                -- UUID do job (gerado pela API)
    distribuidora TEXT,
    ano_ref       INTEGER,
    entidade      TEXT,                               -- Código BDGD: RAMBT, TRAFO, etc.
    n_registos    INTEGER,
    status        TEXT,                               -- 'em_progresso', 'ok', 'erro'
    mensagem      TEXT,                               -- Mensagem de erro ou info adicional
    iniciado_em   TIMESTAMPTZ DEFAULT now(),
    concluido_em  TIMESTAMPTZ,
    UNIQUE (job_id, entidade)
);

COMMENT ON TABLE  rede_bt.ingestao_log              IS 'Log de jobs de ingestão BDGD';
COMMENT ON COLUMN rede_bt.ingestao_log.job_id       IS 'UUID v4 gerado pela API ao iniciar o job';
COMMENT ON COLUMN rede_bt.ingestao_log.entidade     IS 'Código da entidade BDGD: RAMBT, RAMMT, TRAFO, SSDMT, UCBT_PJ';
COMMENT ON COLUMN rede_bt.ingestao_log.status       IS 'Estado do job: em_progresso | ok | erro';
COMMENT ON COLUMN rede_bt.ingestao_log.mensagem     IS 'Saída do ogr2ogr ou mensagem de erro';

CREATE INDEX ON rede_bt.ingestao_log (job_id);
CREATE INDEX ON rede_bt.ingestao_log (distribuidora);
CREATE INDEX ON rede_bt.ingestao_log (status);
