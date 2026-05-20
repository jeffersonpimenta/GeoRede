import { polylineLength, sphericalArea, formatDistance, formatArea } from '../utils/geomath'

const s = {
  panel: {
    position: 'absolute',
    bottom: 110,
    left: 10,
    zIndex: 15,
    width: 230,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    padding: '10px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: 600,
    fontSize: 13,
    color: '#1e293b',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  tab: (active) => ({
    flex: 1,
    padding: '5px 0',
    fontSize: 12,
    fontWeight: 500,
    textAlign: 'center',
    cursor: 'pointer',
    border: 'none',
    background: active ? '#3b82f6' : '#f8fafc',
    color: active ? '#fff' : '#64748b',
  }),
  segList: {
    maxHeight: 160,
    overflowY: 'auto',
    marginBottom: 6,
  },
  segRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 12,
    color: '#475569',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0 4px',
    fontWeight: 600,
    fontSize: 13,
    color: '#1e293b',
    borderTop: '1px solid #e2e8f0',
  },
  actions: {
    display: 'flex',
    gap: 6,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    padding: '5px 0',
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 5,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#475569',
    cursor: 'pointer',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    padding: '8px 0',
  },
}

export default function MeasureTool({ points, mode, onModeSwitch, onUndo, onClear, onClose }) {
  const { total, segments } = polylineLength(points)

  // Calcula área quando modo área e 3+ pontos
  let area = 0
  let perimeter = 0
  if (mode === 'area' && points.length >= 3) {
    const ring = [...points, points[0]]
    area = sphericalArea(ring)
    perimeter = polylineLength(ring).total
  }

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>Medição</span>
        <button style={s.closeBtn} onClick={onClose} title="Fechar">×</button>
      </div>

      {/* Tabs distância / área */}
      <div style={s.tabs}>
        <button style={s.tab(mode === 'distance')} onClick={() => onModeSwitch('distance')}>
          Distância
        </button>
        <button style={s.tab(mode === 'area')} onClick={() => onModeSwitch('area')}>
          Área
        </button>
      </div>

      {/* Conteúdo */}
      {points.length === 0 && (
        <div style={s.hint}>Clique no mapa para iniciar</div>
      )}

      {points.length === 1 && (
        <div style={s.hint}>Clique para adicionar mais pontos</div>
      )}

      {points.length >= 2 && (
        <>
          <div style={s.segList}>
            {segments.map((d, i) => (
              <div key={i} style={s.segRow}>
                <span>Seg. {i + 1}</span>
                <span>{formatDistance(d)}</span>
              </div>
            ))}
          </div>

          {mode === 'distance' && (
            <div style={s.totalRow}>
              <span>Total</span>
              <span>{formatDistance(total)}</span>
            </div>
          )}

          {mode === 'area' && points.length >= 3 && (
            <>
              <div style={s.totalRow}>
                <span>Área</span>
                <span>{formatArea(area)}</span>
              </div>
              <div style={{ ...s.segRow, borderBottom: 'none', paddingTop: 2 }}>
                <span>Perímetro</span>
                <span>{formatDistance(perimeter)}</span>
              </div>
            </>
          )}

          {mode === 'area' && points.length < 3 && (
            <div style={s.hint}>Mínimo 3 pontos para área</div>
          )}
        </>
      )}

      {/* Ações */}
      {points.length > 0 && (
        <div style={s.actions}>
          <button style={s.actionBtn} onClick={onUndo}>Desfazer</button>
          <button style={s.actionBtn} onClick={onClear}>Limpar</button>
        </div>
      )}
    </div>
  )
}
