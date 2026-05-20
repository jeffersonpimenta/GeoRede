import { useEffect, useState } from 'react'
import { getLayers } from '../services/api'

const LAYER_COLORS = {
  seg_bt:              '#3B82F6',
  seg_mt:              '#F59E0B',
  seg_at:              '#DC2626',
  ramal_lig:           '#94A3B8',
  trafo:               '#8B5CF6',
  trafo_sub:           '#7C3AED',
  trafo_at:            '#6D28D9',
  eq_compensador_reativo: '#FBBF24',
  compensador_reativo_bt: '#FCD34D',
  compensador_reativo_at: '#F59E0B',
  regulador_at:        '#D97706',
  seccionadora_bt:     '#92400E',
  ponto_notavel:       '#F472B6',
  subestacao:          '#EF4444',
  area_atendimento:    '#6366F1',
  conjunto:            '#14B8A6',
  consumidor_pj:       '#10B981',
  geracao_dist:        '#84CC16',
  unidade_seg_mt:      '#F97316',
  unidade_seg_at:      '#EF4444',
  unidade_rede_mt:     '#FB923C',
  unidade_rede_est_mt: '#FDBA74',
}

// Agrupamento de layers por categoria
const LAYER_GROUPS = [
  { label: 'Rede',              ids: ['seg_bt', 'seg_mt', 'seg_at', 'ramal_lig'] },
  { label: 'Equipamentos',      ids: ['trafo', 'trafo_sub', 'trafo_at', 'eq_compensador_reativo', 'compensador_reativo_bt', 'compensador_reativo_at', 'regulador_at', 'seccionadora_bt', 'ponto_notavel'] },
  { label: 'Instalações',       ids: ['subestacao', 'area_atendimento', 'conjunto'] },
  { label: 'Consumo / Geração', ids: ['consumidor_pj', 'geracao_dist'] },
  { label: 'Perdas',            ids: ['unidade_seg_mt', 'unidade_seg_at', 'unidade_rede_mt', 'unidade_rede_est_mt'] },
]

const s = {
  panel: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    width: 240,
    padding: '12px 14px',
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
  },
  heading: { fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 },
  groupLabel: { fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, margin: '8px 0 4px', paddingTop: 4, borderTop: '1px solid #f1f5f9' },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
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

  const layerMap = Object.fromEntries(layers.map(l => [l.id, l]))
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
      {LAYER_GROUPS.map(group => {
        // Only show group if at least one layer exists in data
        const groupLayers = group.ids.filter(id => layerMap[id])
        if (groupLayers.length === 0) return null
        return (
          <div key={group.label}>
            <div style={s.groupLabel}>{group.label}</div>
            {groupLayers.map(id => {
              const layer = layerMap[id]
              return (
                <div key={id} style={s.row}>
                  <input
                    type="checkbox"
                    checked={activeLayers.includes(id)}
                    onChange={() => onToggle(id)}
                  />
                  <span style={s.dot(LAYER_COLORS[id])} />
                  <span style={s.label}>{layer.nome}</span>
                  <span style={s.count}>{layer.n_registos > 0 ? layer.n_registos.toLocaleString('pt-BR') : '—'}</span>
                </div>
              )
            })}
          </div>
        )
      })}

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
