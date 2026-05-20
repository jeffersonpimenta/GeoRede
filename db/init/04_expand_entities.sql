-- Expansão de entidades — Fase 1 + 2
-- Novas layers geográficas e correção do mapeamento SSDAT
-- SRID: 4674 (SIRGAS 2000)

-- ─────────────────────────────────────────────────────────────
-- Segmentos de Alta Tensão (SSDAT)
-- SSDAT no GDB tem geometria MultiLineString, NÃO dados energéticos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.seg_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    fas_con       TEXT,
    tipo_cabo     TEXT,
    comp          NUMERIC,
    tip_rede      TEXT,
    geom          GEOMETRY(MultiLineString, 4674)
);

COMMENT ON TABLE rede_bt.seg_at IS 'Segmentos de rede de Alta Tensão (SSDAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS seg_at_geom_idx ON rede_bt.seg_at USING GIST (geom);
CREATE INDEX IF NOT EXISTS seg_at_dist_ano_idx ON rede_bt.seg_at (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Transformadores de Subestação (UNTRS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.trafo_sub (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT,
    pot_nom       NUMERIC,
    ten_pri       NUMERIC,
    ten_sec       NUMERIC,
    fas_con       TEXT,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.trafo_sub IS 'Transformadores de Subestação (UNTRS) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS trafo_sub_geom_idx ON rede_bt.trafo_sub USING GIST (geom);
CREATE INDEX IF NOT EXISTS trafo_sub_dist_ano_idx ON rede_bt.trafo_sub (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS trafo_sub_sub_gd_idx ON rede_bt.trafo_sub (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- Área de Atendimento (ARAT) — limite geográfico da concessão
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.area_atendimento (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    geom          GEOMETRY(MultiPolygon, 4674)
);

COMMENT ON TABLE rede_bt.area_atendimento IS 'Área de Atendimento (ARAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS area_atendimento_geom_idx ON rede_bt.area_atendimento USING GIST (geom);
CREATE INDEX IF NOT EXISTS area_atendimento_dist_ano_idx ON rede_bt.area_atendimento (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Conjuntos de UCs (CONJ) — áreas de continuidade DIC/FIC
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.conjunto (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    nom           TEXT,
    des_conj      TEXT,
    geom          GEOMETRY(MultiPolygon, 4674)
);

COMMENT ON TABLE rede_bt.conjunto IS 'Conjuntos de UCs (CONJ) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS conjunto_geom_idx ON rede_bt.conjunto USING GIST (geom);
CREATE INDEX IF NOT EXISTS conjunto_dist_ano_idx ON rede_bt.conjunto (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Perdas por segmento MT (UNSEMT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.unidade_seg_mt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    seg_id        TEXT,
    ene_per       NUMERIC,
    ene_sup       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.unidade_seg_mt IS 'Perdas por segmento MT (UNSEMT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS unidade_seg_mt_geom_idx ON rede_bt.unidade_seg_mt USING GIST (geom);
CREATE INDEX IF NOT EXISTS unidade_seg_mt_dist_ano_idx ON rede_bt.unidade_seg_mt (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS unidade_seg_mt_seg_id_idx ON rede_bt.unidade_seg_mt (seg_id);


-- ─────────────────────────────────────────────────────────────
-- Perdas por segmento AT (UNSEAT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.unidade_seg_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    seg_id        TEXT,
    ene_per       NUMERIC,
    ene_sup       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.unidade_seg_at IS 'Perdas por segmento AT (UNSEAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS unidade_seg_at_geom_idx ON rede_bt.unidade_seg_at USING GIST (geom);
CREATE INDEX IF NOT EXISTS unidade_seg_at_dist_ano_idx ON rede_bt.unidade_seg_at (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS unidade_seg_at_seg_id_idx ON rede_bt.unidade_seg_at (seg_id);


-- ─────────────────────────────────────────────────────────────
-- Unidade de Rede MT (UNCRMT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.unidade_rede_mt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT,
    ctmt          TEXT,
    ene_per       NUMERIC,
    ene_sup       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.unidade_rede_mt IS 'Unidade de Rede MT (UNCRMT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS unidade_rede_mt_geom_idx ON rede_bt.unidade_rede_mt USING GIST (geom);
CREATE INDEX IF NOT EXISTS unidade_rede_mt_dist_ano_idx ON rede_bt.unidade_rede_mt (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Unidade de Rede Estimada MT (UNREMT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.unidade_rede_est_mt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT,
    ene_per_est   NUMERIC,
    ene_sup       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.unidade_rede_est_mt IS 'Unidade de Rede Estimada MT (UNREMT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS unidade_rede_est_mt_geom_idx ON rede_bt.unidade_rede_est_mt USING GIST (geom);
CREATE INDEX IF NOT EXISTS unidade_rede_est_mt_dist_ano_idx ON rede_bt.unidade_rede_est_mt (distribuidora, ano_ref);
