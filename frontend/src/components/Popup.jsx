import { useEffect, useState } from 'react'
import { getFeature } from '../services/api'

const LAYER_ICON = {
  seg_bt:        '〰️',
  seg_mt:        '⚡',
  trafo:         '🔌',
  subestacao:    '🏭',
  consumidor_pj: '🏢',
}

const LAYER_NOME = {
  seg_bt:        'Rede Baixa Tensão',
  seg_mt:        'Rede Média Tensão',
  trafo:         'Transformador',
  subestacao:    'Subestação',
  consumidor_pj: 'Consumidor PJ',
}

// Campos a exibir por layer, com rótulo legível e formatação opcional
const FIELDS = {
  seg_bt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tensao_nom',   label: 'Tensão nominal', unit: ' kV' },
    { key: 'fases',        label: 'Fases' },
    { key: 'comprimento',  label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'condutor',     label: 'Condutor' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  seg_mt: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'tensao_nom',   label: 'Tensão nominal', unit: ' kV' },
    { key: 'fases',        label: 'Fases' },
    { key: 'comprimento',  label: 'Comprimento', unit: ' m', decimals: 1 },
    { key: 'condutor',     label: 'Condutor' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  trafo: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'potencia_kva', label: 'Potência', unit: ' kVA' },
    { key: 'tensao_prim',  label: 'Tensão Prim.', unit: ' kV' },
    { key: 'tensao_sec',   label: 'Tensão Sec.', unit: ' kV' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  subestacao: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'nome',         label: 'Nome' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'potencia_mva', label: 'Potência', unit: ' MVA' },
    { key: 'tensao_prim',  label: 'Tensão Prim.', unit: ' kV' },
    { key: 'tensao_sec',   label: 'Tensão Sec.', unit: ' kV' },
    { key: 'ano_ref',      label: 'Ano ref.' },
  ],
  consumidor_pj: [
    { key: 'cod_id',       label: 'Código' },
    { key: 'distribuidora',label: 'Distribuidora' },
    { key: 'nivel_tensao', label: 'Nível de tensão' },
    { key: 'classe',       label: 'Classe' },
    { key: 'demanda_kw',   label: 'Demanda', unit: ' kW' },
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
  overlay: (x, y) => ({
    position: 'absolute',
    top: y + 10,
    left: x + 10,
    zIndex: 20,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
    width: 260,
    maxHeight: 360,
    overflowY: 'auto',
    fontSize: 13,
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: 14,
  },
  closeBtn: {
    border: 'none', background: 'none', fontSize: 16, color: '#64748b', padding: '0 4px', lineHeight: 1,
  },
  body: { padding: '8px 12px 12px' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f1f5f9' },
  rowLabel: { color: '#64748b' },
  rowValue: { fontWeight: 500, textAlign: 'right' },
  loading: { padding: 16, color: '#94a3b8', textAlign: 'center' },
}

export default function Popup({ target, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!target) { setData(null); return }
    setLoading(true)
    setError(null)
    setData(null)
    getFeature(target.layerId, target.featureId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [target])

  if (!target) return null

  const fields = FIELDS[target.layerId] || []

  return (
    <div style={s.overlay(target.point.x, target.point.y)}>
      <div style={s.header}>
        <span>{LAYER_ICON[target.layerId]} {LAYER_NOME[target.layerId]}</span>
        <button style={s.closeBtn} onClick={onClose}>×</button>
      </div>
      <div style={s.body}>
        {loading && <div style={s.loading}>A carregar…</div>}
        {error && <div style={{ ...s.loading, color: '#ef4444' }}>Erro: {error}</div>}
        {data && fields.map(field => (
          <div key={field.key} style={s.row}>
            <span style={s.rowLabel}>{field.label}</span>
            <span style={s.rowValue}>{formatValue(data[field.key], field)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
