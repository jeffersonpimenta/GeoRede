-- Expansão de campos FK/relacionamento conforme manual BDGD v1.0
-- Adiciona campos de referência ausentes para viabilizar rastreio topológico

-- ─── consumidor_pj (UCBT/UCMT/UCAT) ─────────────────────────────────────────
-- Campos de relacionamento definidos no manual BDGD:
--   SUB, CONJ, RAMAL, PN_CON, UNI_TR_AT
ALTER TABLE rede_bt.consumidor_pj
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,   -- FK → subestacao.cod_id
    ADD COLUMN IF NOT EXISTS conj      TEXT,   -- FK → conjunto.cod_id
    ADD COLUMN IF NOT EXISTS ramal     TEXT,   -- FK → ramal_lig.cod_id
    ADD COLUMN IF NOT EXISTS pn_con    TEXT,   -- FK → ponto_notavel.cod_id
    ADD COLUMN IF NOT EXISTS uni_tr_at TEXT,   -- FK → trafo_at.cod_id
    ADD COLUMN IF NOT EXISTS fas_con   TEXT,   -- Fases de conexão
    ADD COLUMN IF NOT EXISTS dat_con   TEXT,   -- Data de conexão
    ADD COLUMN IF NOT EXISTS car_inst  NUMERIC, -- Carga instalada (kW) — UCBT
    ADD COLUMN IF NOT EXISTS are_loc   TEXT;   -- Área de localização

CREATE INDEX IF NOT EXISTS consumidor_pj_sub_gd_idx ON rede_bt.consumidor_pj (sub_gd);
CREATE INDEX IF NOT EXISTS consumidor_pj_conj_idx ON rede_bt.consumidor_pj (conj);
CREATE INDEX IF NOT EXISTS consumidor_pj_pn_con_idx ON rede_bt.consumidor_pj (pn_con);


-- ─── seg_bt (SSDBT) ─────────────────────────────────────────────────────────
-- Campos de relacionamento: PN_CON_1, PN_CON_2, SUB, CONJ, ARE_LOC
ALTER TABLE rede_bt.seg_bt
    ADD COLUMN IF NOT EXISTS pn_con_1  TEXT,   -- FK → ponto_notavel.cod_id (extremo 1)
    ADD COLUMN IF NOT EXISTS pn_con_2  TEXT,   -- FK → ponto_notavel.cod_id (extremo 2)
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,   -- FK → subestacao.cod_id
    ADD COLUMN IF NOT EXISTS conj      TEXT,   -- FK → conjunto.cod_id
    ADD COLUMN IF NOT EXISTS are_loc   TEXT;   -- Área de localização

CREATE INDEX IF NOT EXISTS seg_bt_pn_con_1_idx ON rede_bt.seg_bt (pn_con_1);
CREATE INDEX IF NOT EXISTS seg_bt_pn_con_2_idx ON rede_bt.seg_bt (pn_con_2);
CREATE INDEX IF NOT EXISTS seg_bt_sub_gd_idx ON rede_bt.seg_bt (sub_gd);
CREATE INDEX IF NOT EXISTS seg_bt_conj_idx ON rede_bt.seg_bt (conj);


-- ─── seg_mt (SSDMT) ─────────────────────────────────────────────────────────
-- Mesmos campos topológicos que seg_bt
ALTER TABLE rede_bt.seg_mt
    ADD COLUMN IF NOT EXISTS pn_con_1  TEXT,
    ADD COLUMN IF NOT EXISTS pn_con_2  TEXT,
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,
    ADD COLUMN IF NOT EXISTS conj      TEXT,
    ADD COLUMN IF NOT EXISTS uni_tr_d  TEXT,   -- FK → trafo.cod_id (transformador associado)
    ADD COLUMN IF NOT EXISTS are_loc   TEXT;

CREATE INDEX IF NOT EXISTS seg_mt_pn_con_1_idx ON rede_bt.seg_mt (pn_con_1);
CREATE INDEX IF NOT EXISTS seg_mt_pn_con_2_idx ON rede_bt.seg_mt (pn_con_2);
CREATE INDEX IF NOT EXISTS seg_mt_sub_gd_idx ON rede_bt.seg_mt (sub_gd);
CREATE INDEX IF NOT EXISTS seg_mt_uni_tr_d_idx ON rede_bt.seg_mt (uni_tr_d);


-- ─── seg_at (SSDAT) ─────────────────────────────────────────────────────────
ALTER TABLE rede_bt.seg_at
    ADD COLUMN IF NOT EXISTS pn_con_1  TEXT,
    ADD COLUMN IF NOT EXISTS pn_con_2  TEXT,
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,
    ADD COLUMN IF NOT EXISTS ctat      TEXT;   -- FK → ctat_dados.cod_id

CREATE INDEX IF NOT EXISTS seg_at_pn_con_1_idx ON rede_bt.seg_at (pn_con_1);
CREATE INDEX IF NOT EXISTS seg_at_sub_gd_idx ON rede_bt.seg_at (sub_gd);
CREATE INDEX IF NOT EXISTS seg_at_ctat_idx ON rede_bt.seg_at (ctat);


-- ─── geracao_dist (UGBT/UGMT/UGAT) ──────────────────────────────────────────
ALTER TABLE rede_bt.geracao_dist
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,   -- FK → subestacao.cod_id
    ADD COLUMN IF NOT EXISTS conj      TEXT,   -- FK → conjunto.cod_id
    ADD COLUMN IF NOT EXISTS uni_tr_at TEXT,   -- FK → trafo_at.cod_id
    ADD COLUMN IF NOT EXISTS pn_con    TEXT,   -- FK → ponto_notavel.cod_id
    ADD COLUMN IF NOT EXISTS mun_id    TEXT;   -- Município IBGE

CREATE INDEX IF NOT EXISTS geracao_dist_sub_gd_idx ON rede_bt.geracao_dist (sub_gd);
CREATE INDEX IF NOT EXISTS geracao_dist_conj_idx ON rede_bt.geracao_dist (conj);
CREATE INDEX IF NOT EXISTS geracao_dist_pn_con_idx ON rede_bt.geracao_dist (pn_con);


-- ─── ramal_lig (RAMLIG) ─────────────────────────────────────────────────────
ALTER TABLE rede_bt.ramal_lig
    ADD COLUMN IF NOT EXISTS pn_con_1  TEXT,   -- FK → ponto_notavel.cod_id
    ADD COLUMN IF NOT EXISTS pn_con_2  TEXT,
    ADD COLUMN IF NOT EXISTS fas_con   TEXT,
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT;

CREATE INDEX IF NOT EXISTS ramal_lig_pn_con_1_idx ON rede_bt.ramal_lig (pn_con_1);


-- ─── ponto_notavel (PONNOT) ─────────────────────────────────────────────────
ALTER TABLE rede_bt.ponto_notavel
    ADD COLUMN IF NOT EXISTS conj      TEXT,
    ADD COLUMN IF NOT EXISTS sub_gd    TEXT,
    ADD COLUMN IF NOT EXISTS uni_tr_d  TEXT;

CREATE INDEX IF NOT EXISTS ponto_notavel_conj_idx ON rede_bt.ponto_notavel (conj);
CREATE INDEX IF NOT EXISTS ponto_notavel_uni_tr_d_idx ON rede_bt.ponto_notavel (uni_tr_d);


-- ─── eq_compensador_reativo (EQCR) ──────────────────────────────────────────
-- ctmt já existe; adicionar pn_con
ALTER TABLE rede_bt.eq_compensador_reativo
    ADD COLUMN IF NOT EXISTS pn_con_1  TEXT,
    ADD COLUMN IF NOT EXISTS pn_con_2  TEXT;
