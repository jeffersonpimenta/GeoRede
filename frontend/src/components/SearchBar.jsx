import { useState } from 'react'
import { globalSearch } from '../services/api'

const s = {
  wrapper: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    display: 'flex',
    gap: 4,
  },
  input: {
    width: 260,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    outline: 'none',
  },
  btn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  },
  results: {
    position: 'absolute',
    top: 44,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    width: 340,
    maxHeight: 260,
    overflowY: 'auto',
    zIndex: 21,
  },
  resultRow: {
    padding: '8px 12px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    justifyContent: 'space-between',
  },
  resultLayer: { fontSize: 11, color: '#94a3b8' },
  noResult: { padding: '12px', color: '#94a3b8', textAlign: 'center', fontSize: 13 },
}

export default function SearchBar({ onResult }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [searching, setSearching] = useState(false)

  function handleSearch() {
    if (!query.trim() || query.trim().length < 2) return
    setSearching(true)
    globalSearch(query.trim())
      .then(r => setResults(r))
      .catch(() => setResults([]))
      .finally(() => setSearching(false))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch()
    if (e.key === 'Escape') setResults(null)
  }

  function handleClick(item) {
    setResults(null)
    onResult?.(item)
  }

  return (
    <>
      <div style={s.wrapper}>
        <input
          style={s.input}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por COD_ID…"
        />
        <button style={s.btn} onClick={handleSearch} disabled={searching}>
          {searching ? '…' : '🔍'}
        </button>
      </div>
      {results !== null && (
        <div style={s.results}>
          {results.length === 0 && <div style={s.noResult}>Nenhum resultado</div>}
          {results.map((item, i) => (
            <div key={i} style={s.resultRow} onClick={() => handleClick(item)}>
              <span>{item.cod_id}</span>
              <span style={s.resultLayer}>{item.layer_id}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
