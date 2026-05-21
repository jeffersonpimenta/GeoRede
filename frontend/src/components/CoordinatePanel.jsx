import { useState, useEffect, useRef } from 'react'
import {
  formatDD, formatDMS, formatDDM, formatUTM,
  parseDD, parseDMS, parseDDM, parseUTM,
} from '../utils/coordinates'

const FORMATS = [
  { key: 'dd',  label: 'DD',  format: formatDD,  parse: parseDD },
  { key: 'dms', label: 'DMS', format: formatDMS, parse: parseDMS },
  { key: 'ddm', label: 'DDM', format: formatDDM, parse: parseDDM },
  { key: 'utm', label: 'UTM', format: formatUTM, parse: parseUTM },
]

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
    minWidth: 300,
    maxWidth: 400,
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    width: 36,
    fontWeight: 600,
    fontSize: 12,
    color: '#374151',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '4px 6px',
    border: '1px solid #D1D5DB',
    borderRadius: 4,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: -4,
    marginBottom: 4,
    marginLeft: 44,
  },
  clearBtn: {
    marginTop: 4,
    padding: '4px 12px',
    border: '1px solid #ccc',
    borderRadius: 4,
    background: '#F9FAFB',
    cursor: 'pointer',
    fontSize: 12,
    width: '100%',
  },
}

export default function CoordinatePanel({ active, coords, onCoordsChange, onClear }) {
  if (!active) return null

  return (
    <div style={styles.card}>
      <div style={styles.title}>Coordenadas</div>
      {!coords ? (
        <div style={styles.hint}>Clique no mapa para obter coordenadas.</div>
      ) : (
        <CoordFields coords={coords} onCoordsChange={onCoordsChange} />
      )}
      <button style={styles.clearBtn} onClick={onClear}>Limpar</button>
    </div>
  )
}

function CoordFields({ coords, onCoordsChange }) {
  const [fields, setFields] = useState(() => buildFields(coords))
  const [editingKey, setEditingKey] = useState(null)
  const [error, setError] = useState(null)
  const prevCoords = useRef(coords)

  // Update fields when coords change externally (map click), but not while user editing
  useEffect(() => {
    if (coords !== prevCoords.current && !editingKey) {
      setFields(buildFields(coords))
      setError(null)
    }
    prevCoords.current = coords
  }, [coords, editingKey])

  function handleChange(key, value) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function handleFocus(key) {
    setEditingKey(key)
    setError(null)
  }

  function handleCommit(key) {
    setEditingKey(null)
    const fmt = FORMATS.find(f => f.key === key)
    const parsed = fmt.parse(fields[key])
    if (!parsed) {
      setError(key)
      return
    }
    setError(null)
    setFields(buildFields(parsed))
    onCoordsChange(parsed)
  }

  function handleKeyDown(e, key) {
    if (e.key === 'Enter') {
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setEditingKey(null)
      setFields(buildFields(coords))
      setError(null)
      e.target.blur()
    }
  }

  return (
    <div>
      {FORMATS.map(f => (
        <div key={f.key}>
          <div style={styles.row}>
            <span style={styles.label}>{f.label}</span>
            <input
              style={{
                ...styles.input,
                ...(error === f.key ? styles.inputError : {}),
              }}
              value={fields[f.key]}
              onChange={e => handleChange(f.key, e.target.value)}
              onFocus={() => handleFocus(f.key)}
              onBlur={() => handleCommit(f.key)}
              onKeyDown={e => handleKeyDown(e, f.key)}
              spellCheck={false}
            />
          </div>
          {error === f.key && (
            <div style={styles.error}>Formato inválido</div>
          )}
        </div>
      ))}
    </div>
  )
}

function buildFields(coords) {
  if (!coords) return { dd: '', dms: '', ddm: '', utm: '' }
  const { lng, lat } = coords
  return {
    dd: formatDD(lng, lat),
    dms: formatDMS(lng, lat),
    ddm: formatDDM(lng, lat),
    utm: formatUTM(lng, lat),
  }
}
