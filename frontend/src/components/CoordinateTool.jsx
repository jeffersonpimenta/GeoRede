import { useState, useEffect } from 'react'
import { toDD, toDMS, formatUTM, parseDD, parseDMS, parseUTM } from '../utils/geomath'

const TABS = ['DD', 'GMS', 'UTM']

const s = {
  panel: {
    position: 'absolute',
    bottom: 110,
    left: 10,
    zIndex: 15,
    width: 270,
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
  title: { fontWeight: 600, fontSize: 13, color: '#1e293b' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18,
    color: '#64748b', cursor: 'pointer', padding: 0, lineHeight: 1,
  },
  tabs: {
    display: 'flex', gap: 0, marginBottom: 8,
    borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0',
  },
  tab: (active) => ({
    flex: 1, padding: '5px 0', fontSize: 12, fontWeight: 500,
    textAlign: 'center', cursor: 'pointer', border: 'none',
    background: active ? '#3b82f6' : '#f8fafc',
    color: active ? '#fff' : '#64748b',
  }),
  inputRow: {
    display: 'flex', gap: 4, marginBottom: 6,
  },
  input: {
    flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 5,
    border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit',
  },
  locateBtn: {
    padding: '6px 10px', fontSize: 12, fontWeight: 500, borderRadius: 5,
    border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  divider: {
    height: 1, background: '#e2e8f0', margin: '8px 0',
  },
  outputLabel: {
    fontSize: 11, color: '#94a3b8', fontWeight: 500, marginBottom: 2,
  },
  outputRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '4px 0', fontSize: 12, color: '#1e293b', wordBreak: 'break-all',
  },
  copyBtn: {
    background: 'none', border: 'none', fontSize: 13,
    color: '#94a3b8', cursor: 'pointer', padding: '0 0 0 6px', lineHeight: 1,
    flexShrink: 0,
  },
  error: {
    color: '#ef4444', fontSize: 12, padding: '4px 0',
  },
  hint: {
    color: '#94a3b8', fontSize: 12, textAlign: 'center', padding: '8px 0',
  },
}

export default function CoordinateTool({ coordinate, onCoordinateChange, onClose }) {
  const [inputTab, setInputTab] = useState('DD')
  const [ddVal, setDdVal] = useState('')
  const [dmsLatVal, setDmsLatVal] = useState('')
  const [dmsLngVal, setDmsLngVal] = useState('')
  const [utmVal, setUtmVal] = useState('')
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(null)

  // Quando coordenada vem do clique no mapa, preenche inputs
  useEffect(() => {
    if (!coordinate) return
    setDdVal(toDD(coordinate.lat, coordinate.lng))
    const dms = toDMS(coordinate.lat, coordinate.lng)
    setDmsLatVal(dms.lat)
    setDmsLngVal(dms.lng)
    setUtmVal(formatUTM(coordinate.lat, coordinate.lng))
    setError(null)
  }, [coordinate])

  function handleLocate() {
    setError(null)
    let result = null
    if (inputTab === 'DD') {
      result = parseDD(ddVal)
    } else if (inputTab === 'GMS') {
      result = parseDMS(`${dmsLatVal}, ${dmsLngVal}`)
    } else {
      result = parseUTM(utmVal)
    }
    if (!result) {
      setError('Coordenada inválida')
      return
    }
    onCoordinateChange({ lat: result.lat, lng: result.lng })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLocate()
  }

  function copyText(text) {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1500)
  }

  // Valores de output
  const ddOut = coordinate ? toDD(coordinate.lat, coordinate.lng) : null
  const dmsOut = coordinate ? toDMS(coordinate.lat, coordinate.lng) : null
  const utmOut = coordinate ? formatUTM(coordinate.lat, coordinate.lng) : null

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>Coordenadas</span>
        <button style={s.closeBtn} onClick={onClose} title="Fechar">×</button>
      </div>

      {/* Tabs formato de entrada */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} style={s.tab(inputTab === t)} onClick={() => { setInputTab(t); setError(null) }}>
            {t}
          </button>
        ))}
      </div>

      {/* Inputs conforme tab */}
      {inputTab === 'DD' && (
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={ddVal}
            onChange={e => setDdVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="-15.780100, -47.929200"
          />
          <button style={s.locateBtn} onClick={handleLocate}>Ir</button>
        </div>
      )}

      {inputTab === 'GMS' && (
        <>
          <div style={s.inputRow}>
            <input
              style={s.input}
              value={dmsLatVal}
              onChange={e => setDmsLatVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="15°46'48.36&quot;S"
            />
          </div>
          <div style={s.inputRow}>
            <input
              style={s.input}
              value={dmsLngVal}
              onChange={e => setDmsLngVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="47°55'45.12&quot;W"
            />
            <button style={s.locateBtn} onClick={handleLocate}>Ir</button>
          </div>
        </>
      )}

      {inputTab === 'UTM' && (
        <div style={s.inputRow}>
          <input
            style={s.input}
            value={utmVal}
            onChange={e => setUtmVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="23S 186754E 8254321N"
          />
          <button style={s.locateBtn} onClick={handleLocate}>Ir</button>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      {/* Divider */}
      <div style={s.divider} />

      {/* Output: todos os formatos */}
      {!coordinate && <div style={s.hint}>Clique no mapa ou insira coordenadas</div>}

      {coordinate && (
        <>
          <OutputRow label="Graus Decimais (DD)" value={ddOut} copied={copied} onCopy={copyText} />
          <OutputRow
            label="Graus Min. Seg. (GMS)"
            value={`${dmsOut.lat}, ${dmsOut.lng}`}
            copied={copied}
            onCopy={copyText}
          />
          <OutputRow label="UTM" value={utmOut} copied={copied} onCopy={copyText} />
        </>
      )}
    </div>
  )
}

function OutputRow({ label, value, copied, onCopy }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={s.outputLabel}>{label}</div>
      <div style={s.outputRow}>
        <span>{value}</span>
        <button
          style={s.copyBtn}
          onClick={() => onCopy(value)}
          title="Copiar"
        >
          {copied === value ? '✓' : '⧉'}
        </button>
      </div>
    </div>
  )
}
