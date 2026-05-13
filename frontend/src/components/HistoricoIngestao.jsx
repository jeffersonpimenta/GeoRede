const s = {
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '6px 8px', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: 600 },
  td: { padding: '6px 8px', borderBottom: '1px solid #f1f5f9' },
  ok: { color: '#16a34a', fontWeight: 700 },
  erro: { color: '#dc2626', fontWeight: 700 },
  progresso: { color: '#2563eb' },
  empty: { color: '#94a3b8', padding: 12, textAlign: 'center' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function StatusBadge({ status }) {
  if (status === 'ok') return <span style={s.ok}>✅ ok</span>
  if (status === 'erro') return <span style={s.erro}>❌ erro</span>
  return <span style={s.progresso}>⏳ em progresso</span>
}

export default function HistoricoIngestao({ items }) {
  if (!items?.length) return <div style={s.empty}>Nenhuma ingestão registada.</div>

  return (
    <table style={s.table}>
      <thead>
        <tr>
          <th style={s.th}>Distribuidora</th>
          <th style={s.th}>Entidade</th>
          <th style={s.th}>Ano</th>
          <th style={s.th}>Registos</th>
          <th style={s.th}>Status</th>
          <th style={s.th}>Data</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td style={s.td}>{item.distribuidora || '—'}</td>
            <td style={s.td}>{item.entidade || '—'}</td>
            <td style={s.td}>{item.ano_ref || '—'}</td>
            <td style={s.td}>{item.n_registos?.toLocaleString('pt-BR') ?? '—'}</td>
            <td style={s.td}><StatusBadge status={item.status} /></td>
            <td style={s.td}>{formatDate(item.iniciado_em)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
