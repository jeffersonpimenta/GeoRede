import { useEffect, useRef, useState } from 'react'
import { getStatusIngestao } from '../services/api'

const s = {
  box: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 14, marginBottom: 16 },
  title: { fontWeight: 700, marginBottom: 8, color: '#0369a1' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 },
  barBg: { background: '#e0f2fe', borderRadius: 99, height: 10, marginTop: 6 },
  barFill: (pct) => ({ background: '#3b82f6', width: `${pct}%`, borderRadius: 99, height: 10, transition: 'width 0.4s' }),
  status: { fontSize: 12, marginTop: 4, color: '#64748b' },
  ok: { color: '#16a34a', fontWeight: 700 },
  erro: { color: '#dc2626', fontWeight: 700 },
}

function calcProgresso(entries) {
  if (!entries.length) return { pct: 0, etapa: '—', done: false }
  const total = entries.length
  const concluidas = entries.filter(e => e.status === 'ok' || e.status === 'erro').length
  const pct = Math.round((concluidas / total) * 100)
  const emProgresso = entries.find(e => e.status === 'em_progresso')
  const etapa = emProgresso
    ? `${emProgresso.entidade} (${concluidas + 1}/${total})`
    : concluidas === total ? 'Concluído' : '—'
  const done = concluidas === total
  return { pct, etapa, done }
}

export default function ProgressoIngestao({ jobId, onDone }) {
  const [entries, setEntries] = useState([])
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!jobId) return

    function poll() {
      getStatusIngestao(jobId)
        .then(data => {
          setEntries(data)
          const { done } = calcProgresso(data)
          if (done) {
            clearInterval(intervalRef.current)
            onDone?.()
          }
        })
        .catch(console.error)
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!jobId || !entries.length) return null

  const { pct, etapa, done } = calcProgresso(entries)
  const distribuidora = entries[0]?.distribuidora
  const ano = entries[0]?.ano_ref

  return (
    <div style={s.box}>
      <div style={s.title}>Em progresso: {distribuidora} / {ano}</div>
      <div style={s.row}>
        <span>Etapa: {etapa}</span>
        <span>{pct}%</span>
      </div>
      <div style={s.barBg}>
        <div style={s.barFill(pct)} />
      </div>
      <div style={s.status}>
        {entries.map(e => (
          <span key={e.entidade} style={{ marginRight: 8 }}>
            {e.entidade}:{' '}
            {e.status === 'ok' && <span style={s.ok}>✅</span>}
            {e.status === 'erro' && <span style={s.erro}>❌</span>}
            {e.status === 'em_progresso' && <span>⏳</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
