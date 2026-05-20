-- Tabelas de dashboard — dados resumo sem geometria
-- Balanço energético, perdas, indicadores

-- ─────────────────────────────────────────────────────────────
-- Balanço Energético (BE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.balanco_energia (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER
);

COMMENT ON TABLE rede_bt.balanco_energia IS 'Balanço Energético (BE) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS balanco_energia_dist_ano_idx ON rede_bt.balanco_energia (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Energia Própria (EP)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.energia_propria (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER
);

COMMENT ON TABLE rede_bt.energia_propria IS 'Energia Própria (EP) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS energia_propria_dist_ano_idx ON rede_bt.energia_propria (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Perdas Técnicas (PT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.perda_tecnica (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER
);

COMMENT ON TABLE rede_bt.perda_tecnica IS 'Perdas Técnicas (PT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS perda_tecnica_dist_ano_idx ON rede_bt.perda_tecnica (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Perdas Não Técnicas (PNT)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.perda_nao_tecnica (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER
);

COMMENT ON TABLE rede_bt.perda_nao_tecnica IS 'Perdas Não Técnicas (PNT) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS perda_nao_tecnica_dist_ano_idx ON rede_bt.perda_nao_tecnica (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Indicadores de Gestão por Município (INDGER)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.indicador_gestao (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER,
    mun_id        TEXT
);

COMMENT ON TABLE rede_bt.indicador_gestao IS 'Indicadores de Gestão (INDGER) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS indicador_gestao_dist_ano_idx ON rede_bt.indicador_gestao (distribuidora, ano_ref);
CREATE INDEX IF NOT EXISTS indicador_gestao_mun_id_idx ON rede_bt.indicador_gestao (mun_id);


-- ─────────────────────────────────────────────────────────────
-- Metadados da Base (BASE)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rede_bt.base_metadata (
    id            SERIAL PRIMARY KEY,
    cod_id        TEXT,
    distribuidora TEXT,
    ano_ref       INTEGER
);

COMMENT ON TABLE rede_bt.base_metadata IS 'Metadados da Base (BASE) — BDGD/ANEEL';
CREATE INDEX IF NOT EXISTS base_metadata_dist_ano_idx ON rede_bt.base_metadata (distribuidora, ano_ref);
