import { useEffect, useState } from 'react'
import {
  getFeature, getFeatureByCodId,
  getSubestacaoEnergy, getTrafoConsumers,
  getSubestacaoDetails, getTrafoDetails, getCtmtDetails,
} from '../services/api'

const LAYER_ICON = {
  seg_bt:              '〰️',
  seg_mt:              '⚡',
  seg_at:              '⚡',
  trafo:               '🔌',
  trafo_sub:           '🔌',
  subestacao:          '🏭',
  consumidor_pj:       '🏢',
  eq_compensador_reativo: '⚡',
  compensador_reativo_bt: '⚡',
  compensador_reativo_at: '⚡',
  regulador_at:        '🔧',
  seccionadora_bt:     '🔀',
  trafo_at:            '🔌',
  geracao_dist:        '☀️',
  ramal_lig:           '〰️',
  ponto_notavel:       '📍',
  area_atendimento:    '🗺️',
  conjunto:            '📐',
  unidade_seg_mt:      '📊',
  unidade_seg_at:      '📊',
  unidade_rede_mt:     '📊',
  unidade_rede_est_mt: '📊',
}

const LAYER_NOME = {
  seg_bt:              'Rede Baixa Tensão',
  seg_mt:              'Rede Média Tensão',
  seg_at:              'Rede Alta Tensão',
  trafo:               'Transformador',
  trafo_sub:           'Trafo Subestação',
  subestacao:          'Subestação',
  consumidor_pj:       'Consumidor PJ',
  eq_compensador_reativo: 'Compensador de Reativo',
  compensador_reativo_bt: 'Compensador Reativo BT',
  compensador_reativo_at: 'Compensador Reativo AT',
  regulador_at:        'Regulador de Tensão AT',
  seccionadora_bt:     'Seccionadora BT',
  trafo_at:            'Transformador AT',
  geracao_dist:        'Geração Distribuída',
  ramal_lig:           'Ramal de Ligação',
  ponto_notavel:       'Ponto Notável',
  area_atendimento:    'Área de Atendimento',
  conjunto:            'Conjunto',
  unidade_seg_mt:      'Perdas Seg. MT',
  unidade_seg_at:      'Perdas Seg. AT',
  unidade_rede_mt:     'Perdas Rede MT',
  unidade_rede_est_mt: 'Perdas Est. MT',
}

// Campos navegáveis (FK): { [layerId]: { [fieldKey]: { layer, label } } }
const FK_LINKS = {
  seg_bt:        { uni_tr_d: { layer: 'trafo', label: 'Transformador' } },
  seg_mt:        {},
  seg_at:        {},
  trafo:         { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  trafo_sub:     { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  subestacao:    {},
  consumidor_pj: { uni_tr_d: { layer: 'trafo', label: 'Transformador' } },
  eq_compensador_reativo: { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  compensador_reativo_bt: { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  compensador_reativo_at: { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  regulador_at:  { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  seccionadora_bt: { uni_tr_d: { layer: 'trafo', label: 'Transformador' } },
  trafo_at:      { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  geracao_dist:  { uni_tr_d: { layer: 'trafo', label: 'Transformador' } },
  ramal_lig:     { uni_tr_d: { layer: 'trafo', label: 'Transformador' } },
  ponto_notavel: {},
  area_atendimento: {},
  conjunto:      {},
  unidade_seg_mt:      { seg_id: { layer: 'seg_mt', label: 'Segmento MT' } },
  unidade_seg_at:      { seg_id: { layer: 'seg_at', label: 'Segmento AT' } },
  unidade_rede_mt:     { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
  unidade_rede_est_mt: { sub_gd: { layer: 'subestacao', label: 'Subestação' } },
}

const FIELDS = {
  seg_bt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tensao_nom',   label: 'Tensão nominal', unit: ' kV' },
    { key: 'fases',        label: 'Fases' },
    { key: 'comprimento',  label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'condutor',     label: 'Condutor' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'tipo_cabo',    label: 'Tipo cabo' },
    { key: 'fas_con',      label: 'Fases con.' },
    { key: 'tip_rede',     label: 'Tipo rede' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  seg_mt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tensao_nom',   label: 'Tensão nominal', unit: ' kV' },
    { key: 'fases',        label: 'Fases' },
    { key: 'comprimento',  label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'condutor',     label: 'Condutor' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'tipo_cabo',    label: 'Tipo cabo' },
    { key: 'fas_con',      label: 'Fases con.' },
    { key: 'tip_rede',     label: 'Tipo rede' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  seg_at: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'ctmt',         label: 'Circuito' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'fas_con',      label: 'Fases con.' },
    { key: 'tipo_cabo',    label: 'Tipo cabo' },
    { key: 'comp',         label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'tip_rede',     label: 'Tipo rede' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  trafo: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'potencia_kva', label: 'Potência', unit: ' kVA' },
    { key: 'tensao_prim',  label: 'Tensão Prim.', unit: ' kV' },
    { key: 'tensao_sec',   label: 'Tensão Sec.', unit: ' kV' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'fas_con',      label: 'Fases con.' },
    { key: 'tip_trf',      label: 'Tipo trafo' },
    { key: 'mun_id',       label: 'Município' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  trafo_sub: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVA' },
    { key: 'ten_pri',      label: 'Tensão Prim.', unit: ' kV' },
    { key: 'ten_sec',      label: 'Tensão Sec.', unit: ' kV' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'fas_con',      label: 'Fases con.' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  subestacao: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'nome',         label: 'Nome' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'potencia_mva', label: 'Potência', unit: ' MVA' },
    { key: 'tensao_prim',  label: 'Tensão Prim.', unit: ' kV' },
    { key: 'tensao_sec',   label: 'Tensão Sec.', unit: ' kV' },
    { key: 'pac',          label: 'PAC' },
    { key: 'tip_sub',      label: 'Tipo sub.' },
    { key: 'dem_med',      label: 'Demanda média', unit: ' MVA', decimals: 2 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  consumidor_pj: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'nivel_tensao', label: 'Nível de tensão' },
    { key: 'classe',       label: 'Classe' },
    { key: 'demanda_kw',   label: 'Demanda', unit: ' kW' },
    { key: 'consumo_mwh',  label: 'Consumo', unit: ' MWh', decimals: 1 },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'pac',          label: 'PAC' },
    { key: 'mun_id',       label: 'Município' },
    { key: 'tip_cc',       label: 'Tipo conexão' },
    { key: 'gru_ten',      label: 'Grupo tensão' },
    { key: 'dmcr',         label: 'Dem. média calc.', unit: ' kW', decimals: 1 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  eq_compensador_reativo: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVAr' },
    { key: 'tip_unid',     label: 'Tipo unidade' },
    { key: 'ten_nom',      label: 'Tensão nominal', unit: ' kV' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  compensador_reativo_bt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVAr' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  compensador_reativo_at: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVAr' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'ctat',         label: 'Circuito AT' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  regulador_at: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVA' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'ctat',         label: 'Circuito AT' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  seccionadora_bt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tip_eqp',      label: 'Tipo equip.' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  trafo_at: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'pot_nom',      label: 'Potência', unit: ' kVA' },
    { key: 'ten_pri',      label: 'Tensão Prim.', unit: ' kV' },
    { key: 'ten_sec',      label: 'Tensão Sec.', unit: ' kV' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  geracao_dist: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tip_gd',       label: 'Tipo geração' },
    { key: 'pot_inst',     label: 'Pot. instalada', unit: ' kW', decimals: 1 },
    { key: 'nivel_tensao', label: 'Nível tensão' },
    { key: 'ceg_gd',       label: 'CEG' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'pac',          label: 'PAC' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  ramal_lig: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'comp',         label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'tipo_cabo',    label: 'Tipo cabo' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'uni_tr_d',     label: 'Transformador' },
    { key: 'pac_1',        label: 'PAC 1' },
    { key: 'pac_2',        label: 'PAC 2' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  ponto_notavel: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tip_pnt',      label: 'Tipo' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'pac',          label: 'PAC' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  area_atendimento: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  conjunto: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'nom',          label: 'Nome' },
    { key: 'des_conj',     label: 'Descrição' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  unidade_seg_mt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'seg_id',       label: 'Segmento' },
    { key: 'ene_per',      label: 'Energia perdas', unit: ' MWh', decimals: 2 },
    { key: 'ene_sup',      label: 'Energia suprida', unit: ' MWh', decimals: 2 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  unidade_seg_at: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'seg_id',       label: 'Segmento' },
    { key: 'ene_per',      label: 'Energia perdas', unit: ' MWh', decimals: 2 },
    { key: 'ene_sup',      label: 'Energia suprida', unit: ' MWh', decimals: 2 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  unidade_rede_mt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'ctmt',         label: 'Circuito MT' },
    { key: 'ene_per',      label: 'Energia perdas', unit: ' MWh', decimals: 2 },
    { key: 'ene_sup',      label: 'Energia suprida', unit: ' MWh', decimals: 2 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  unidade_rede_est_mt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'sub_gd',       label: 'Subestação' },
    { key: 'ene_per_est',  label: 'Energia perdas est.', unit: ' MWh', decimals: 2 },
    { key: 'ene_sup',      label: 'Energia suprida', unit: ' MWh', decimals: 2 },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
}

function formatValue(val, field) {
  if (val === null || val === undefined) return '—'
  if (field.decimals !== undefined) return Number(val).toFixed(field.decimals) + (field.unit || '')
  if (field.unit) return `${val}${field.unit}`
  return String(val)
}

const s = {
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 340,
    height: '100vh',
    zIndex: 30,
    background: '#fff',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 13,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  backBtn: {
    border: 'none', background: 'none', fontSize: 16, color: '#3b82f6',
    padding: '0 4px', lineHeight: 1, cursor: 'pointer',
  },
  title: { flex: 1 },
  closeBtn: {
    border: 'none', background: 'none', fontSize: 18, color: '#64748b',
    padding: '0 4px', lineHeight: 1, cursor: 'pointer',
  },
  body: { padding: '8px 12px 16px', overflowY: 'auto', flex: 1 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f1f5f9' },
  rowLabel: { color: '#64748b', flexShrink: 0, marginRight: 8 },
  rowValue: { fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' },
  fkBtn: {
    background: 'none', border: 'none', padding: 0, fontWeight: 600,
    color: '#2563eb', cursor: 'pointer', textDecoration: 'underline',
    fontSize: 'inherit', textAlign: 'right', wordBreak: 'break-all',
  },
  loading: { padding: 16, color: '#94a3b8', textAlign: 'center' },
  error: { padding: 16, color: '#ef4444', textAlign: 'center' },
  energySection: { marginTop: 12, padding: '8px 0 0' },
  energyHeading: { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 },
  energyBars: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 },
  energyBar: (pct, color) => ({
    flex: 1, background: color || '#3B82F6', borderRadius: 2,
    height: `${Math.max(pct * 100, 4)}%`, minHeight: 3,
  }),
  energyLabels: { display: 'flex', gap: 2, marginTop: 3 },
  energyLabel: { flex: 1, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
  energyStats: { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#64748b' },
  consumersSection: { marginTop: 12, padding: '8px 0 0', borderTop: '1px solid #e2e8f0' },
  consumersHeading: { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 },
  consumersGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  consumersCard: { background: '#f8fafc', borderRadius: 6, padding: '6px 8px', textAlign: 'center' },
  consumersNum: { fontWeight: 700, fontSize: 16, color: '#1e293b' },
  consumersLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  consumersClasses: { marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 },
  consumersTag: { background: '#e0e7ff', color: '#3730a3', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 },
  detailSection: { marginTop: 12, padding: '8px 0 0', borderTop: '1px solid #e2e8f0' },
  detailHeading: {
    fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    color: '#64748b', marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
  },
  detailTable: { width: '100%', fontSize: 11, borderCollapse: 'collapse' },
  detailTh: { textAlign: 'left', padding: '2px 4px', borderBottom: '1px solid #e2e8f0', color: '#94a3b8', fontWeight: 600 },
  detailTd: { padding: '2px 4px', borderBottom: '1px solid #f8fafc' },
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function EnergyChart({ energy, title, color }) {
  const values = MONTHS.map((_, i) => energy[`ene_${String(i + 1).padStart(2, '0')}`] ?? 0)
  const max = Math.max(...values, 1)
  return (
    <div style={s.energySection}>
      <div style={s.energyHeading}>{title || 'Energia Mensal (MWh)'}</div>
      <div style={s.energyBars}>
        {values.map((v, i) => (
          <div key={i} style={s.energyBar(v / max, color || '#3B82F6')} title={`${MONTHS[i]}: ${v?.toFixed(1) ?? '—'} MWh`} />
        ))}
      </div>
      <div style={s.energyLabels}>
        {MONTHS.map(m => <div key={m} style={s.energyLabel}>{m[0]}</div>)}
      </div>
      <div style={s.energyStats}>
        {energy.dem_max != null && <span>Dem. máx: {Number(energy.dem_max).toFixed(2)} MVA</span>}
        {energy.fp_med != null && <span>FP médio: {Number(energy.fp_med).toFixed(3)}</span>}
        {energy.dem_max_p != null && <span>Dem. máx: {Number(energy.dem_max_p).toFixed(1)} kW</span>}
      </div>
    </div>
  )
}

function TrafoConsumersSection({ data }) {
  return (
    <div style={s.consumersSection}>
      <div style={s.consumersHeading}>Consumidores / Ramais</div>
      <div style={s.consumersGrid}>
        <div style={s.consumersCard}>
          <div style={s.consumersNum}>{data.total_consumidores}</div>
          <div style={s.consumersLabel}>Consumidores</div>
        </div>
        <div style={s.consumersCard}>
          <div style={s.consumersNum}>{data.total_ramais}</div>
          <div style={s.consumersLabel}>Ramais</div>
        </div>
        <div style={s.consumersCard}>
          <div style={s.consumersNum}>{data.demanda_total_kw.toFixed(1)}</div>
          <div style={s.consumersLabel}>kW demanda</div>
        </div>
        <div style={s.consumersCard}>
          <div style={s.consumersNum}>{data.consumo_total_mwh.toFixed(1)}</div>
          <div style={s.consumersLabel}>MWh consumo</div>
        </div>
      </div>
      {data.classes.length > 0 && (
        <div style={s.consumersClasses}>
          {data.classes.map(c => <span key={c} style={s.consumersTag}>{c}</span>)}
        </div>
      )}
    </div>
  )
}

function CollapsibleSection({ title, count, children }) {
  const [open, setOpen] = useState(false)
  if (!count) return null
  return (
    <div style={s.detailSection}>
      <div style={s.detailHeading} onClick={() => setOpen(!open)}>
        <span>{title} ({count})</span>
        <span>{open ? '▾' : '▸'}</span>
      </div>
      {open && children}
    </div>
  )
}

function DetailTable({ rows, columns }) {
  if (!rows || !rows.length) return null
  return (
    <table style={s.detailTable}>
      <thead>
        <tr>{columns.map(c => <th key={c.key} style={s.detailTh}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map(c => <td key={c.key} style={s.detailTd}>{row[c.key] ?? '—'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SubestacaoDetailsSection({ details }) {
  if (!details) return null
  return (
    <>
      <CollapsibleSection title="Barras" count={details.barras?.length}>
        <DetailTable rows={details.barras} columns={[{ key: 'cod_id', label: 'Código' }]} />
      </CollapsibleSection>
      <CollapsibleSection title="Bays" count={details.bays?.length}>
        <DetailTable rows={details.bays} columns={[{ key: 'cod_id', label: 'Código' }]} />
      </CollapsibleSection>
      <CollapsibleSection title="Equip. SIA AT" count={details.eq_siat?.length}>
        <DetailTable rows={details.eq_siat} columns={[{ key: 'cod_id', label: 'Código' }]} />
      </CollapsibleSection>
      <CollapsibleSection title="Trafos Auxiliares" count={details.eq_trsx?.length}>
        <DetailTable rows={details.eq_trsx} columns={[{ key: 'cod_id', label: 'Código' }]} />
      </CollapsibleSection>
      <CollapsibleSection title="Circuitos AT" count={details.circuitos_at?.length}>
        <DetailTable rows={details.circuitos_at} columns={[
          { key: 'cod_id', label: 'Código' },
          { key: 'des_circ', label: 'Descrição' },
          { key: 'ten_nom', label: 'Tensão' },
        ]} />
      </CollapsibleSection>
    </>
  )
}

function TrafoDetailsSection({ details }) {
  if (!details) return null
  return (
    <>
      <CollapsibleSection title="Equipamentos" count={details.equipamentos?.length}>
        <DetailTable rows={details.equipamentos} columns={[{ key: 'cod_id', label: 'Código' }]} />
      </CollapsibleSection>
      {details.iluminacao?.total > 0 && (
        <div style={s.detailSection}>
          <div style={s.detailHeading}>
            <span>Iluminação Pública</span>
          </div>
          <div style={s.consumersGrid}>
            <div style={s.consumersCard}>
              <div style={s.consumersNum}>{details.iluminacao.total}</div>
              <div style={s.consumersLabel}>Pontos</div>
            </div>
            <div style={s.consumersCard}>
              <div style={s.consumersNum}>{Number(details.iluminacao.pot_total).toFixed(1)}</div>
              <div style={s.consumersLabel}>kW total</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CtmtDetailsSection({ details }) {
  if (!details) return null
  return (
    <>
      {details.dados && (
        <>
          <EnergyChart energy={details.dados} title="Energia Circuito MT (MWh)" color="#F59E0B" />
          <div style={s.consumersGrid}>
            <div style={s.consumersCard}>
              <div style={s.consumersNum}>{details.n_reguladores || 0}</div>
              <div style={s.consumersLabel}>Reguladores</div>
            </div>
            <div style={s.consumersCard}>
              <div style={s.consumersNum}>{details.n_seccionamento || 0}</div>
              <div style={s.consumersLabel}>Seccionamentos</div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default function InfoPanel({ target, onClose, onNavigate }) {
  // navStack: array of { layerId, featureId?, codId? }
  const [navStack, setNavStack] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [trafoConsumers, setTrafoConsumers] = useState(null)
  const [subDetails, setSubDetails] = useState(null)
  const [trafoDetails, setTrafoDetails] = useState(null)
  const [ctmtDetails, setCtmtDetails] = useState(null)

  // Reset stack when target changes from outside (new map click)
  useEffect(() => {
    if (!target) {
      setNavStack([])
      setData(null)
      setEnergy(null)
      setTrafoConsumers(null)
      setSubDetails(null)
      setTrafoDetails(null)
      setCtmtDetails(null)
      return
    }
    setNavStack([{ layerId: target.layerId, featureId: target.featureId, codId: target.codId ?? null }])
  }, [target])

  // Fetch when navStack top changes
  useEffect(() => {
    if (navStack.length === 0) {
      setData(null); setEnergy(null); setTrafoConsumers(null)
      setSubDetails(null); setTrafoDetails(null); setCtmtDetails(null)
      return
    }
    const top = navStack[navStack.length - 1]
    setLoading(true)
    setError(null)
    setData(null)
    setEnergy(null)
    setTrafoConsumers(null)
    setSubDetails(null)
    setTrafoDetails(null)
    setCtmtDetails(null)

    const promise = top.codId
      ? getFeatureByCodId(top.layerId, top.codId)
      : getFeature(top.layerId, top.featureId)

    promise
      .then(result => {
        setData(result)

        // Fetch energy data for subestação
        if (top.layerId === 'subestacao' && result.cod_id) {
          getSubestacaoEnergy(result.cod_id).then(setEnergy).catch(() => null)
          getSubestacaoDetails(result.cod_id).then(setSubDetails).catch(() => null)
        }

        // Fetch consumers + details for trafo
        const trafoCodId = top.codId || result.cod_id
        if (top.layerId === 'trafo' && trafoCodId) {
          getTrafoConsumers(trafoCodId).then(setTrafoConsumers).catch(() => null)
          getTrafoDetails(trafoCodId).then(setTrafoDetails).catch(() => null)
        }

        // Fetch CTMT details when ctmt field present
        if (result.ctmt) {
          getCtmtDetails(result.ctmt).then(setCtmtDetails).catch(() => null)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navStack])

  if (!target) return null

  const currentEntry = navStack[navStack.length - 1]
  const currentLayerId = currentEntry?.layerId
  const fields = FIELDS[currentLayerId] || []
  const fkConfig = FK_LINKS[currentLayerId] || {}

  function handleNavigate(fieldKey) {
    if (!data) return
    const codId = data[fieldKey]
    if (!codId) return
    const { layer } = fkConfig[fieldKey]
    setNavStack(prev => [...prev, { layerId: layer, codId }])
    onNavigate?.(layer, codId)
  }

  function handleBack() {
    setNavStack(prev => {
      const next = prev.slice(0, -1)
      if (next.length > 0) {
        const top = next[next.length - 1]
        // Tell parent to highlight the previous item
        onNavigate?.(top.layerId, top.codId ?? null)
      }
      return next
    })
  }

  // Energy chart for geracao_dist (has ene_01..12)
  const showGeracaoEnergy = currentLayerId === 'geracao_dist' && data?.pot_inst != null

  return (
    <div style={s.panel}>
      <div style={s.header}>
        {navStack.length > 1 && (
          <button style={s.backBtn} onClick={handleBack} title="Voltar">‹</button>
        )}
        <span style={s.title}>
          {LAYER_ICON[currentLayerId]} {LAYER_NOME[currentLayerId]}
        </span>
        <button style={s.closeBtn} onClick={onClose} title="Fechar">×</button>
      </div>
      <div style={s.body}>
        {loading && <div style={s.loading}>A carregar…</div>}
        {error && <div style={s.error}>Erro: {error}</div>}
        {data && fields.map(field => {
          const val = data[field.key]
          const fk = fkConfig[field.key]
          const isEmpty = val === null || val === undefined
          return (
            <div key={field.key} style={s.row}>
              <span style={s.rowLabel}>{field.label}</span>
              {fk && !isEmpty ? (
                <button style={s.fkBtn} onClick={() => handleNavigate(field.key)}>
                  {String(val)}
                </button>
              ) : (
                <span style={s.rowValue}>{formatValue(val, field)}</span>
              )}
            </div>
          )
        })}
        {trafoConsumers && <TrafoConsumersSection data={trafoConsumers} />}
        {energy && <EnergyChart energy={energy} />}
        {showGeracaoEnergy && data && <EnergyChart energy={data} title="Geração Mensal (MWh)" color="#84CC16" />}
        {subDetails && <SubestacaoDetailsSection details={subDetails} />}
        {trafoDetails && <TrafoDetailsSection details={trafoDetails} />}
        {ctmtDetails && <CtmtDetailsSection details={ctmtDetails} />}
      </div>
    </div>
  )
}
