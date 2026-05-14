import { useEffect, useState } from 'react'
import { getFeature, getFeatureByCodId, getSubestacaoEnergy } from '../services/api'

const LAYER_ICON = {
  seg_bt:        '〰️',
  seg_mt:        '⚡',
  trafo:         '🔌',
  subestacao:    '🏭',
  consumidor_pj: '🏢',
  eq_corte:      '🔀',
  geracao_dist:  '☀️',
  ramal_lig:     '〰️',
}

const LAYER_NOME = {
  seg_bt:        'Rede Baixa Tensão',
  seg_mt:        'Rede Média Tensão',
  trafo:         'Transformador',
  subestacao:    'Subestação',
  consumidor_pj: 'Consumidor PJ',
  eq_corte:      'Chave/Religador',
  geracao_dist:  'Geração Distribuída',
  ramal_lig:     'Ramal de Ligação',
}

// Campos navegáveis (FK): { [layerId]: { [fieldKey]: { layer, label } } }
const FK_LINKS = {
  seg_bt:        { uni_tr_d: { layer: 'trafo',      label: 'Transformador' } },
  seg_mt:        {},
  trafo:         { sub_gd:   { layer: 'subestacao', label: 'Subestação' } },
  subestacao:    {},
  consumidor_pj: { uni_tr_d: { layer: 'trafo',      label: 'Transformador' } },
  eq_corte:      {},
  geracao_dist:  { uni_tr_d: { layer: 'trafo',      label: 'Transformador' } },
  ramal_lig:     { uni_tr_d: { layer: 'trafo',      label: 'Transformador' } },
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
  eq_corte: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tip_eqp',      label: 'Tipo equip.' },
    { key: 'ten_nom',      label: 'Tensão nominal', unit: ' kV' },
    { key: 'fas_con',      label: 'Fases' },
    { key: 'cap_int',      label: 'Cap. interrupção', unit: ' kA' },
    { key: 'class_cont',   label: 'Classe cont.' },
    { key: 'ctmt',         label: 'Circuito MT' },
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
    width: 320,
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
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function EnergyChart({ energy }) {
  const values = MONTHS.map((_, i) => energy[`ene_0${i < 9 ? i + 1 : ''}${i >= 9 ? i + 1 : ''}`] ?? null)
    .map((v, i) => energy[`ene_${String(i + 1).padStart(2, '0')}`] ?? 0)
  const max = Math.max(...values, 1)
  return (
    <div style={s.energySection}>
      <div style={s.energyHeading}>Energia Mensal (MWh)</div>
      <div style={s.energyBars}>
        {values.map((v, i) => (
          <div key={i} style={s.energyBar(v / max, '#3B82F6')} title={`${MONTHS[i]}: ${v?.toFixed(1) ?? '—'} MWh`} />
        ))}
      </div>
      <div style={s.energyLabels}>
        {MONTHS.map(m => <div key={m} style={s.energyLabel}>{m[0]}</div>)}
      </div>
      <div style={s.energyStats}>
        {energy.dem_max != null && <span>Dem. máx: {Number(energy.dem_max).toFixed(2)} MVA</span>}
        {energy.fp_med != null && <span>FP médio: {Number(energy.fp_med).toFixed(3)}</span>}
      </div>
    </div>
  )
}

export default function InfoPanel({ target, onClose, onNavigate }) {
  // navStack: array of { layerId, featureId?, codId? }
  const [navStack, setNavStack] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [energy, setEnergy] = useState(null)

  // Reset stack when target changes from outside (new map click)
  useEffect(() => {
    if (!target) {
      setNavStack([])
      setData(null)
      setEnergy(null)
      return
    }
    setNavStack([{ layerId: target.layerId, featureId: target.featureId }])
  }, [target])

  // Fetch when navStack top changes
  useEffect(() => {
    if (navStack.length === 0) { setData(null); setEnergy(null); return }
    const top = navStack[navStack.length - 1]
    setLoading(true)
    setError(null)
    setData(null)
    setEnergy(null)

    const promise = top.codId
      ? getFeatureByCodId(top.layerId, top.codId)
      : getFeature(top.layerId, top.featureId)

    promise
      .then(result => {
        setData(result)
        // Fetch energy data for subestação
        if (top.layerId === 'subestacao' && result.cod_id) {
          getSubestacaoEnergy(result.cod_id).then(setEnergy).catch(() => null)
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
        {energy && <EnergyChart energy={energy} />}
      </div>
    </div>
  )
}
