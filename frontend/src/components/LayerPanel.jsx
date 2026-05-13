import { useEffect, useState } from 'react'
import { getLayers } from '../services/api'

const LAYER_COLORS = {
  seg_bt:        '#3B82F6',
  seg_mt:        '#F59E0B',
  trafo:         '#8B5CF6',
  subestacao:    '#EF4444',
  consumidor_pj: '#10B981',
}

const s = {
  panel: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    width: 220,
    padding: '12px 14px',
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
  },
  heading: { fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  dot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }),
  label: { flex: 1, fontSize: 13 },
  count: { fontSize: 11, color: '#94a3b8' },
  divider: { borderTop: '1px solid #e2e8f0', margin: '10px 0' },
  select: { width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 6 },
}

export default function LayerPanel({ activeLayers, onToggle, onFilterChange }) {
  const [layers, setLayers] = useState([])
  const [distribuidora, setDistribuidora] = useState('')
  const [ano, setAno] = useState('')

  useEffect(() => {
    getLayers().then(setLayers).catch(console.error)
  }, [])

  const allDistribuidoras = [...new Set(layers.flatMap(l => l.distribuidoras))].sort()
  const allAnos = [...new Set(layers.flatMap(l => l.anos))].sort((a, b) => b - a)

  function handleDistribuidora(val) {
    setDistribuidora(val)
    onFilterChange?.({ distribuidora: val, ano })
  }

  function handleAno(val) {
    setAno(val)
    onFilterChange?.({ distribuidora, ano: val })
  }

  return (
    <div style={s.panel}>
      <div style={s.heading}>Layers</div>
      {layers.map(layer => (
        <div key={layer.id} style={s.row}>
          <input
            type="checkbox"
            checked={activeLayers.includes(layer.id)}
            onChange={() => onToggle(layer.id)}
          />
          <span style={s.dot(LAYER_COLORS[layer.id])} />
          <span style={s.label}>{layer.nome}</span>
          <span style={s.count}>{layer.n_registos > 0 ? layer.n_registos.toLocaleString('pt-BR') : '—'}</span>
        </div>
      ))}

      <div style={s.divider} />
      <div style={s.heading}>Filtros</div>

      <select style={s.select} value={distribuidora} onChange={e => handleDistribuidora(e.target.value)}>
        <option value="">Todas as distribuidoras</option>
        {allDistribuidoras.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <select style={s.select} value={ano} onChange={e => handleAno(e.target.value)}>
        <option value="">Todos os anos</option>
        {allAnos.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  )
}
