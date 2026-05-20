-- Tabelas de enriquecimento — sem geometria
-- Dados associados a features geográficas via FK

-- ─────────────────────────────────────────────────────────────
-- Barras de subestação (BAR)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.barra (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT
);

COMMENT ON TABLE rede_bt.barra IS 'Barras de subestação (BAR) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS barra_sub_gd_idx ON rede_bt.barra (sub_gd);
CREATE INDEX IF NOT EXISTS barra_dist_ano_idx ON rede_bt.barra (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Bays de subestação (BAY)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.bay (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT
);

COMMENT ON TABLE rede_bt.bay IS 'Bays de subestação (BAY) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS bay_sub_gd_idx ON rede_bt.bay (sub_gd);
CREATE INDEX IF NOT EXISTS bay_dist_ano_idx ON rede_bt.bay (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Circuitos AT (CTAT) — dados energéticos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.ctat_dados (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT,
    des_circ      TEXT,
    ten_nom       NUMERIC,
    ene_01 NUMERIC, ene_02 NUMERIC, ene_03 NUMERIC, ene_04 NUMERIC,
    ene_05 NUMERIC, ene_06 NUMERIC, ene_07 NUMERIC, ene_08 NUMERIC,
    ene_09 NUMERIC, ene_10 NUMERIC, ene_11 NUMERIC, ene_12 NUMERIC
);

COMMENT ON TABLE rede_bt.ctat_dados IS 'Circuitos AT (CTAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS ctat_dados_sub_gd_idx ON rede_bt.ctat_dados (sub_gd);
CREATE INDEX IF NOT EXISTS ctat_dados_dist_ano_idx ON rede_bt.ctat_dados (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Equipamento de Trafo Distribuição (EQTRD)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trafo_dist (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uni_tr_d      TEXT
);

COMMENT ON TABLE rede_bt.eq_trafo_dist IS 'Equipamento de Trafo Distribuição (EQTRD) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trafo_dist_uni_tr_d_idx ON rede_bt.eq_trafo_dist (uni_tr_d);
CREATE INDEX IF NOT EXISTS eq_trafo_dist_dist_ano_idx ON rede_bt.eq_trafo_dist (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Equipamento de Trafo MT (EQTRM)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trafo_mt (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uni_tr_d      TEXT
);

COMMENT ON TABLE rede_bt.eq_trafo_mt IS 'Equipamento de Trafo MT (EQTRM) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trafo_mt_uni_tr_d_idx ON rede_bt.eq_trafo_mt (uni_tr_d);
CREATE INDEX IF NOT EXISTS eq_trafo_mt_dist_ano_idx ON rede_bt.eq_trafo_mt (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Equipamento de Trafo Sub (EQTRS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trafo_sub (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uni_tr_s      TEXT
);

COMMENT ON TABLE rede_bt.eq_trafo_sub IS 'Equipamento de Trafo Sub (EQTRS) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trafo_sub_uni_tr_s_idx ON rede_bt.eq_trafo_sub (uni_tr_s);
CREATE INDEX IF NOT EXISTS eq_trafo_sub_dist_ano_idx ON rede_bt.eq_trafo_sub (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Equipamento SIA AT (EQSIAT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_siat (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT
);

COMMENT ON TABLE rede_bt.eq_siat IS 'Equipamento SIA AT (EQSIAT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_siat_sub_gd_idx ON rede_bt.eq_siat (sub_gd);
CREATE INDEX IF NOT EXISTS eq_siat_dist_ano_idx ON rede_bt.eq_siat (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Trafo Auxiliar Sub (EQTRSX)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_trsx (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    sub_gd        TEXT
);

COMMENT ON TABLE rede_bt.eq_trsx IS 'Trafo Auxiliar Sub (EQTRSX) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_trsx_sub_gd_idx ON rede_bt.eq_trsx (sub_gd);
CREATE INDEX IF NOT EXISTS eq_trsx_dist_ano_idx ON rede_bt.eq_trsx (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Reguladores de Tensão (EQRE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_regulador (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT
);

COMMENT ON TABLE rede_bt.eq_regulador IS 'Reguladores de Tensão (EQRE) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_regulador_ctmt_idx ON rede_bt.eq_regulador (ctmt);
CREATE INDEX IF NOT EXISTS eq_regulador_dist_ano_idx ON rede_bt.eq_regulador (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Equipamento de Seccionamento (EQSE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_seccionamento (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT
);

COMMENT ON TABLE rede_bt.eq_seccionamento IS 'Equipamento de Seccionamento (EQSE) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_seccionamento_ctmt_idx ON rede_bt.eq_seccionamento (ctmt);
CREATE INDEX IF NOT EXISTS eq_seccionamento_dist_ano_idx ON rede_bt.eq_seccionamento (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Medidores (EQME)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.eq_medidor (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    uc_ug         TEXT
);

COMMENT ON TABLE rede_bt.eq_medidor IS 'Medidores (EQME) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS eq_medidor_uc_ug_idx ON rede_bt.eq_medidor (uc_ug);
CREATE INDEX IF NOT EXISTS eq_medidor_dist_ano_idx ON rede_bt.eq_medidor (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Pontos de Iluminação Pública (PIP)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.pip (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    ctmt          TEXT,
    uni_tr_d      TEXT,
    pot_lamp      NUMERIC
);

COMMENT ON TABLE rede_bt.pip IS 'Pontos de Iluminação Pública (PIP) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS pip_ctmt_idx ON rede_bt.pip (ctmt);
CREATE INDEX IF NOT EXISTS pip_uni_tr_d_idx ON rede_bt.pip (uni_tr_d);
CREATE INDEX IF NOT EXISTS pip_dist_ano_idx ON rede_bt.pip (distribuidora, ano_ref);
