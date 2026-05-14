-- Migração: adiciona colunas FK/contexto BDGD às tabelas existentes
-- Seguro executar múltiplas vezes (ADD COLUMN IF NOT EXISTS)

-- ─── seg_bt ──────────────────────────────────────────────────────────────────
ALTER TABLE rede_bt.seg_bt
    ADD COLUMN IF NOT EXISTS ctmt     TEXT,
    ADD COLUMN IF NOT EXISTS uni_tr_d TEXT,
    ADD COLUMN IF NOT EXISTS pac_1    TEXT,
    ADD COLUMN IF NOT EXISTS pac_2    TEXT,
    ADD COLUMN IF NOT EXISTS tipo_cabo TEXT,
    ADD COLUMN IF NOT EXISTS fas_con  TEXT,
    ADD COLUMN IF NOT EXISTS tip_rede TEXT;

CREATE INDEX IF NOT EXISTS seg_bt_uni_tr_d_idx ON rede_bt.seg_bt (uni_tr_d);

-- ─── seg_mt ──────────────────────────────────────────────────────────────────
ALTER TABLE rede_bt.seg_mt
    ADD COLUMN IF NOT EXISTS ctmt     TEXT,
    ADD COLUMN IF NOT EXISTS pac_1    TEXT,
    ADD COLUMN IF NOT EXISTS pac_2    TEXT,
    ADD COLUMN IF NOT EXISTS tipo_cabo TEXT,
    ADD COLUMN IF NOT EXISTS fas_con  TEXT,
    ADD COLUMN IF NOT EXISTS tip_rede TEXT;

-- ─── trafo ───────────────────────────────────────────────────────────────────
ALTER TABLE rede_bt.trafo
    ADD COLUMN IF NOT EXISTS ctmt   TEXT,
    ADD COLUMN IF NOT EXISTS pac_1  TEXT,
    ADD COLUMN IF NOT EXISTS pac_2  TEXT,
    ADD COLUMN IF NOT EXISTS sub_gd TEXT,
    ADD COLUMN IF NOT EXISTS fas_con TEXT,
    ADD COLUMN IF NOT EXISTS tip_trf TEXT,
    ADD COLUMN IF NOT EXISTS mun_id TEXT;

CREATE INDEX IF NOT EXISTS trafo_sub_gd_idx ON rede_bt.trafo (sub_gd);

-- ─── subestacao ───────────────────────────────────────────────────────────────
ALTER TABLE rede_bt.subestacao
    ADD COLUMN IF NOT EXISTS pac     TEXT,
    ADD COLUMN IF NOT EXISTS tip_sub TEXT,
    ADD COLUMN IF NOT EXISTS dem_med NUMERIC;

-- ─── consumidor_pj ────────────────────────────────────────────────────────────
ALTER TABLE rede_bt.consumidor_pj
    ADD COLUMN IF NOT EXISTS ctmt     TEXT,
    ADD COLUMN IF NOT EXISTS uni_tr_d TEXT,
    ADD COLUMN IF NOT EXISTS pac      TEXT,
    ADD COLUMN IF NOT EXISTS mun_id   TEXT,
    ADD COLUMN IF NOT EXISTS tip_cc   TEXT,
    ADD COLUMN IF NOT EXISTS gru_ten  TEXT,
    ADD COLUMN IF NOT EXISTS dmcr     NUMERIC;

CREATE INDEX IF NOT EXISTS consumidor_pj_uni_tr_d_idx ON rede_bt.consumidor_pj (uni_tr_d);
