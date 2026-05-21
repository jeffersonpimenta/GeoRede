import { formatDistance, formatArea } from '../utils/measure'

const styles = {
  card: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 15,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    padding: '12px 16px',
    minWidth: 220,
    maxWidth: 340,
    fontSize: 13,
  },
  title: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 14,
  },
  hint: {
    color: '#6B7280',
    fontStyle: 'italic',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
  },
  total: {
    fontWeight: 600,
    borderTop: '1px solid #E5E7EB',
    marginTop: 4,
    paddingTop: 4,
  },
  clearBtn: {
    marginTop: 8,
    padding: '4px 12px',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#F9FAFB',
    cursor: 'pointer',
    fontSize: 12,
    width: '100%',
  },
  input: {
    width: 60,
    padding: '2px 4px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
  },
  select: {
    padding: '2px 4px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: 13,
    marginLeft: 4,
  },
  bufferRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
}

const toolLabels = {
  distance: 'Distância',
  area: 'Área',
  buffer: 'Buffer / Raio',
}

export default function MeasureResultCard({
  activeTool,
  measurement,
  radius,
  radiusUnit,
  onSetRadius,
  onSetRadiusUnit,
  onClear,
}) {
  if (!activeTool) return null

  return (
    <div style={styles.card}>
      <div style={styles.title}>{toolLabels[activeTool]}</div>

      {activeTool === 'distance' && (
        <DistanceContent measurement={measurement} />
      )}
      {activeTool === 'area' && (
        <AreaContent measurement={measurement} />
      )}
      {activeTool === 'buffer' && (
        <BufferContent
          measurement={measurement}
          radius={radius}
          radiusUnit={radiusUnit}
          onSetRadius={onSetRadius}
          onSetRadiusUnit={onSetRadiusUnit}
        />
      )}

      <button style={styles.clearBtn} onClick={onClear}>Limpar</button>
    </div>
  )
}

function DistanceContent({ measurement }) {
  if (!measurement || !measurement.segments?.length) {
    return <div style={styles.hint}>Clique no mapa para adicionar pontos. Duplo-clique finaliza.</div>
  }
  return (
    <div>
      {measurement.segments.map((seg, i) => (
        <div key={i} style={styles.row}>
          <span>Seg {i + 1}</span>
          <span>{formatDistance(seg)}</span>
        </div>
      ))}
      <div style={{ ...styles.row, ...styles.total }}>
        <span>Total</span>
        <span>{formatDistance(measurement.totalDistance)}</span>
      </div>
    </div>
  )
}

function AreaContent({ measurement }) {
  if (!measurement || !measurement.area) {
    return <div style={styles.hint}>Clique no mapa para adicionar vértices (mín. 3). Duplo-clique fecha.</div>
  }
  return (
    <div>
      <div style={styles.row}>
        <span>Área</span>
        <span>{formatArea(measurement.area)}</span>
      </div>
      <div style={styles.row}>
        <span>Perímetro</span>
        <span>{formatDistance(measurement.perimeter)}</span>
      </div>
    </div>
  )
}

function BufferContent({ measurement, radius, radiusUnit, onSetRadius, onSetRadiusUnit }) {
  const hasCenter = measurement?.center != null
  return (
    <div>
      {!hasCenter && (
        <div style={styles.hint}>Clique no mapa para definir o centro do buffer.</div>
      )}
      {hasCenter && (
        <div style={styles.row}>
          <span>Centro</span>
          <span>{measurement.center[0].toFixed(5)}, {measurement.center[1].toFixed(5)}</span>
        </div>
      )}
      <div style={styles.bufferRow}>
        <span>Raio:</span>
        <input
          type="number"
          min="0"
          style={styles.input}
          value={radius}
          onChange={e => onSetRadius(Number(e.target.value))}
        />
        <select style={styles.select} value={radiusUnit} onChange={e => onSetRadiusUnit(e.target.value)}>
          <option value="m">m</option>
          <option value="km">km</option>
        </select>
      </div>
      {measurement?.circleArea != null && (
        <div style={{ ...styles.row, marginTop: 6 }}>
          <span>Área</span>
          <span>{formatArea(measurement.circleArea)}</span>
        </div>
      )}
    </div>
  )
}
