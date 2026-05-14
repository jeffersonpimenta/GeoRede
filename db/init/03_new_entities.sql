-- Novas entidades BDGD — Expansão Tier 1 + Tier 2
-- SRID: 4674 (SIRGAS 2000)

-- ─────────────────────────────────────────────────────────────
-- Equipamentos de Corte e Religamento (EQCR)
-- Chaves faca, disjuntores, religadores na rede MT
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.eq_corte (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    ctmt        TEXT,
    pac_1       TEXT,
    pac_2       TEXT,
    tip_eqp     TEXT,      -- tipo: CH (chave), RL (religador), DJ (disjuntor)
    fas_con     TEXT,
    ten_nom     NUMERIC,   -- tensão nominal (kV)
    cap_int     NUMERIC,   -- capacidade de interrupção (kA)
    class_cont  TEXT,
    geom        GEOMETRY(Point, 4674)
);

COMMENT ON TABLE  rede_bt.eq_corte          IS 'Equipamentos de Corte e Religamento (EQCR) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.eq_corte.tip_eqp  IS 'Tipo de equipamento: CH=chave, RL=religador, DJ=disjuntor';
COMMENT ON COLUMN rede_bt.eq_corte.ten_nom  IS 'Tensão nominal (kV)';
COMMENT ON COLUMN rede_bt.eq_corte.cap_int  IS 'Capacidade de interrupção (kA)';

CREATE INDEX ON rede_bt.eq_corte USING GIST (geom);
CREATE INDEX ON rede_bt.eq_corte (distribuidora, ano_ref);
CREATE INDEX ON rede_bt.eq_corte (ctmt);


-- ─────────────────────────────────────────────────────────────
-- Unidades Geradoras BT / MT / AT (UGBT, UGMT, UGAT)
-- Geração distribuída: solar, eólica, mini-hidro, etc.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.geracao_dist (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    ctmt        TEXT,
    uni_tr_d    TEXT,      -- transformador distribuição (FK → trafo.cod_id)
    pac         TEXT,
    ceg_gd      TEXT,      -- código de empreendimento ANEEL
    tip_gd      TEXT,      -- tipo: solar, eolica, hidro, termica, etc.
    pot_inst    NUMERIC,   -- potência instalada (kW)
    ene_01      NUMERIC,   -- geração mensal (MWh)
    ene_02      NUMERIC,
    ene_03      NUMERIC,
    ene_04      NUMERIC,
    ene_05      NUMERIC,
    ene_06      NUMERIC,
    ene_07      NUMERIC,
    ene_08      NUMERIC,
    ene_09      NUMERIC,
    ene_10      NUMERIC,
    ene_11      NUMERIC,
    ene_12      NUMERIC,
    nivel_tensao TEXT,     -- 'BT', 'MT', 'AT' (derivado da entidade BDGD)
    geom        GEOMETRY(Point, 4674)
);

COMMENT ON TABLE  rede_bt.geracao_dist              IS 'Unidades Geradoras Distribuídas (UGBT/UGMT/UGAT) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.geracao_dist.tip_gd       IS 'Tipo de geração: solar, eolica, hidro, termica, etc.';
COMMENT ON COLUMN rede_bt.geracao_dist.pot_inst     IS 'Potência instalada em kW';
COMMENT ON COLUMN rede_bt.geracao_dist.nivel_tensao IS 'Nível de tensão de conexão: BT, MT ou AT';

CREATE INDEX ON rede_bt.geracao_dist USING GIST (geom);
CREATE INDEX ON rede_bt.geracao_dist (distribuidora, ano_ref);
CREATE INDEX ON rede_bt.geracao_dist (nivel_tensao);
CREATE INDEX ON rede_bt.geracao_dist (ctmt);


-- ─────────────────────────────────────────────────────────────
-- Ramais de Ligação (RAMLIG)
-- Ligação da rede BT ao ponto de entrega do consumidor
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.ramal_lig (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    ctmt        TEXT,
    uni_tr_d    TEXT,      -- transformador (FK → trafo.cod_id)
    pac_1       TEXT,
    pac_2       TEXT,
    comp        NUMERIC,   -- comprimento (m)
    tipo_cabo   TEXT,
    geom        GEOMETRY(MultiLineString, 4674)
);

COMMENT ON TABLE  rede_bt.ramal_lig          IS 'Ramais de Ligação (RAMLIG) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.ramal_lig.comp     IS 'Comprimento do ramal em metros';

CREATE INDEX ON rede_bt.ramal_lig USING GIST (geom);
CREATE INDEX ON rede_bt.ramal_lig (distribuidora, ano_ref);
CREATE INDEX ON rede_bt.ramal_lig (uni_tr_d);


-- ─────────────────────────────────────────────────────────────
-- Pontos Notáveis (PONNOT)
-- Postes ou pontos topológicos da rede — tipo a confirmar no GDB
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.ponto_notavel (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    ctmt        TEXT,
    pac         TEXT,
    tip_pnt     TEXT,
    geom        GEOMETRY(Geometry, 4674)   -- tipo incerto; aceita ponto ou linha
);

COMMENT ON TABLE rede_bt.ponto_notavel IS 'Pontos Notáveis (PONNOT) — BDGD/ANEEL';

CREATE INDEX ON rede_bt.ponto_notavel USING GIST (geom);
CREATE INDEX ON rede_bt.ponto_notavel (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Dados energéticos de subestação — SSDAT (sem geometria)
-- ENE_01..12: energia mensal (MWh); DEM_MAX: demanda máxima (MVA)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.ssdat (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    sub_gd      TEXT,      -- FK → subestacao.cod_id
    ene_01      NUMERIC,
    ene_02      NUMERIC,
    ene_03      NUMERIC,
    ene_04      NUMERIC,
    ene_05      NUMERIC,
    ene_06      NUMERIC,
    ene_07      NUMERIC,
    ene_08      NUMERIC,
    ene_09      NUMERIC,
    ene_10      NUMERIC,
    ene_11      NUMERIC,
    ene_12      NUMERIC,
    dem_max     NUMERIC,   -- demanda máxima (MVA)
    fp_med      NUMERIC    -- fator de potência médio
);

COMMENT ON TABLE  rede_bt.ssdat       IS 'Dados energéticos de subestação (SSDAT) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.ssdat.sub_gd IS 'FK → rede_bt.subestacao.cod_id';
COMMENT ON COLUMN rede_bt.ssdat.dem_max IS 'Demanda máxima em MVA';
COMMENT ON COLUMN rede_bt.ssdat.fp_med  IS 'Fator de potência médio';

CREATE INDEX ON rede_bt.ssdat (sub_gd);
CREATE INDEX ON rede_bt.ssdat (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Dados energéticos de circuito MT — CTMT (sem geometria)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.ctmt_dados (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,      -- código do circuito MT
    distribuidora TEXT,
    ano_ref     INTEGER,
    des_circ    TEXT,      -- descrição do circuito
    ten_nom     NUMERIC,   -- tensão nominal (kV)
    ene_01      NUMERIC,
    ene_02      NUMERIC,
    ene_03      NUMERIC,
    ene_04      NUMERIC,
    ene_05      NUMERIC,
    ene_06      NUMERIC,
    ene_07      NUMERIC,
    ene_08      NUMERIC,
    ene_09      NUMERIC,
    ene_10      NUMERIC,
    ene_11      NUMERIC,
    ene_12      NUMERIC,
    dem_max_p   NUMERIC,   -- demanda máxima ativa (kW)
    dem_max_fp  NUMERIC    -- fator de potência na demanda máxima
);

COMMENT ON TABLE rede_bt.ctmt_dados IS 'Dados energéticos de circuito MT (CTMT) — BDGD/ANEEL';

CREATE INDEX ON rede_bt.ctmt_dados (cod_id);
CREATE INDEX ON rede_bt.ctmt_dados (distribuidora, ano_ref);


-- ─────────────────────────────────────────────────────────────
-- Catálogo de condutores — SEGCON (sem geometria)
-- Parâmetros elétricos dos cabos
-- ─────────────────────────────────────────────────────────────
CREATE TABLE rede_bt.segcon (
    id          SERIAL PRIMARY KEY,
    cod_id      TEXT,
    distribuidora TEXT,
    ano_ref     INTEGER,
    descr       TEXT,      -- descrição do condutor
    res_pos     NUMERIC,   -- resistência positiva (Ω/km)
    rea_pos     NUMERIC,   -- reatância positiva (Ω/km)
    cap_amp     NUMERIC,   -- capacidade de corrente (A)
    tip_cnd     TEXT,      -- tipo de condutor (AL, CU, etc.)
    bit_cnd     NUMERIC    -- bitola (mm²)
);

COMMENT ON TABLE  rede_bt.segcon         IS 'Catálogo de condutores (SEGCON) — BDGD/ANEEL';
COMMENT ON COLUMN rede_bt.segcon.res_pos IS 'Resistência positiva em Ω/km';
COMMENT ON COLUMN rede_bt.segcon.rea_pos IS 'Reatância positiva em Ω/km';
COMMENT ON COLUMN rede_bt.segcon.cap_amp IS 'Capacidade de corrente em A';
COMMENT ON COLUMN rede_bt.segcon.bit_cnd IS 'Bitola em mm²';

CREATE INDEX ON rede_bt.segcon (cod_id);
CREATE INDEX ON rede_bt.segcon (distribuidora, ano_ref);
