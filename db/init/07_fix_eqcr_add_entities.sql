-- Correção semântica EQCR + Entidades BDGD ausentes
-- EQCR no manual BDGD = "Equipamento Compensador de Reativo" (bancos capacitores, SVCs)
-- A tabela eq_corte estava incorretamente associada a equipamentos de corte/religamento

-- ─────────────────────────────────────────────────────────────
-- Correção: EQCR → Compensador de Reativo (renomear tabela)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS rede_bt.eq_corte RENAME TO eq_compensador_reativo;

-- Adicionar campos BDGD corretos para compensador de reativo
ALTER TABLE rede_bt.eq_compensador_reativo
    ADD COLUMN IF NOT EXISTS pot_nom NUMERIC,    -- potência nominal (kVAr)
    ADD COLUMN IF NOT EXISTS tip_unid TEXT,       -- tipo de unidade (capacitor fixo, automático, etc.)
    ADD COLUMN IF NOT EXISTS sub_gd TEXT;         -- FK → subestacao.cod_id

COMMENT ON TABLE rede_bt.eq_compensador_reativo IS 'Equipamento Compensador de Reativo (EQCR) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.eq_compensador_reativo.pot_nom IS 'Potência nominal reativa (kVAr)';
COMMENT ON COLUMN rede_bt.eq_compensador_reativo.tip_unid IS 'Tipo de unidade compensadora';

CREATE INDEX IF NOT EXISTS eq_comp_reativo_sub_gd_idx ON rede_bt.eq_compensador_reativo (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- UNCRBT — Unidade Compensadora de Reativo BT (Geográfica, Ponto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.compensador_reativo_bt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT,
    uni_tr_d      TEXT,
    sub_gd        TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    fas_con       TEXT,
    pot_nom       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.compensador_reativo_bt IS 'Unidade Compensadora de Reativo BT (UNCRBT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS comp_reativo_bt_geom_idx ON rede_bt.compensador_reativo_bt USING GIST (geom);
CREATE INDEX IF NOT EXISTS comp_reativo_bt_dist_ano_idx ON rede_bt.compensador_reativo_bt (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS comp_reativo_bt_ctmt_idx ON rede_bt.compensador_reativo_bt (ctmt);


-- ─────────────────────────────────────────────────────────────
-- UNCRAT — Unidade Compensadora de Reativo AT (Geográfica, Ponto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.compensador_reativo_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctat          TEXT,
    sub_gd        TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    fas_con       TEXT,
    pot_nom       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.compensador_reativo_at IS 'Unidade Compensadora de Reativo AT (UNCRAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS comp_reativo_at_geom_idx ON rede_bt.compensador_reativo_at USING GIST (geom);
CREATE INDEX IF NOT EXISTS comp_reativo_at_dist_ano_idx ON rede_bt.compensador_reativo_at (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS comp_reativo_at_sub_gd_idx ON rede_bt.compensador_reativo_at (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- UNREAT — Unidade Reguladora de Tensão AT (Geográfica, Ponto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.regulador_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctat          TEXT,
    sub_gd        TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    fas_con       TEXT,
    pot_nom       NUMERIC,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.regulador_at IS 'Unidade Reguladora de Tensão AT (UNREAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS regulador_at_geom_idx ON rede_bt.regulador_at USING GIST (geom);
CREATE INDEX IF NOT EXISTS regulador_at_dist_ano_idx ON rede_bt.regulador_at (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS regulador_at_sub_gd_idx ON rede_bt.regulador_at (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- UNSEBT — Unidade Seccionadora BT (Geográfica, Ponto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.seccionadora_bt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT,
    uni_tr_d      TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    fas_con       TEXT,
    tip_eqp       TEXT,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.seccionadora_bt IS 'Unidade Seccionadora BT (UNSEBT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS seccionadora_bt_geom_idx ON rede_bt.seccionadora_bt USING GIST (geom);
CREATE INDEX IF NOT EXISTS seccionadora_bt_dist_ano_idx ON rede_bt.seccionadora_bt (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS seccionadora_bt_ctmt_idx ON rede_bt.seccionadora_bt (ctmt);


-- ─────────────────────────────────────────────────────────────
-- UNTRAT — Unidade Transformadora AT (Geográfica, Ponto)
-- Standalone entity (além do alias UNTRAT→UNTRS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.trafo_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT,
    pot_nom       NUMERIC,
    ten_pri       NUMERIC,
    ten_sec       NUMERIC,
    fas_con       TEXT,
    pac_1         TEXT,
    pac_2         TEXT,
    geom          GEOMETRY(Point, 4674)
);

COMMENT ON TABLE rede_bt.trafo_at IS 'Unidade Transformadora AT (UNTRAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS trafo_at_geom_idx ON rede_bt.trafo_at USING GIST (geom);
CREATE INDEX IF NOT EXISTS trafo_at_dist_ano_idx ON rede_bt.trafo_at (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS trafo_at_sub_gd_idx ON rede_bt.trafo_at (sub_gd);


-- ─────────────────────────────────────────────────────────────
-- EQTRAT — Equipamento Transformador AT (Não-Geográfica)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trafo_at (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uni_tr_at     TEXT
);

COMMENT ON TABLE rede_bt.eq_trafo_at IS 'Equipamento Transformador AT (EQTRAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trafo_at_uni_tr_at_idx ON rede_bt.eq_trafo_at (uni_tr_at);
CREATE INDEX IF NOT EXISTS eq_trafo_at_dist_ano_idx ON rede_bt.eq_trafo_at (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- EQTRMT — Equipamento Transformador MT (Não-Geográfica)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trafo_mt_dist (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uni_tr_mt     TEXT
);

COMMENT ON TABLE rede_bt.eq_trafo_mt_dist IS 'Equipamento Transformador MT (EQTRMT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trafo_mt_dist_uni_tr_mt_idx ON rede_bt.eq_trafo_mt_dist (uni_tr_mt);
CREATE INDEX IF NOT EXISTS eq_trafo_mt_dist_dist_ano_idx ON rede_bt.eq_trafo_mt_dist (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- CRVCRG — Curva de Carga (Não-Geográfica)
-- Tipologias de curva de carga associadas a consumidores/geradores
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.curva_carga (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    descr         TEXT,
    tip_dia       TEXT,       -- tipo de dia (útil, sábado, domingo/feriado)
    pot_01        NUMERIC,    -- potência normalizada hora 01
    pot_02        NUMERIC,
    pot_03        NUMERIC,
    pot_04        NUMERIC,
    pot_05        NUMERIC,
    pot_06        NUMERIC,
    pot_07        NUMERIC,
    pot_08        NUMERIC,
    pot_09        NUMERIC,
    pot_10        NUMERIC,
    pot_11        NUMERIC,
    pot_12        NUMERIC,
    pot_13        NUMERIC,
    pot_14        NUMERIC,
    pot_15        NUMERIC,
    pot_16        NUMERIC,
    pot_17        NUMERIC,
    pot_18        NUMERIC,
    pot_19        NUMERIC,
    pot_20        NUMERIC,
    pot_21        NUMERIC,
    pot_22        NUMERIC,
    pot_23        NUMERIC,
    pot_24        NUMERIC
);

COMMENT ON TABLE rede_bt.curva_carga IS 'Curva de Carga (CRVCRG) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS curva_carga_cod_id_idx ON rede_bt.curva_carga (cod_id);
CREATE INDEX IF NOT EXISTS curva_carga_dist_ano_idx ON rede_bt.curva_carga (distribuidora, ano_ref);
