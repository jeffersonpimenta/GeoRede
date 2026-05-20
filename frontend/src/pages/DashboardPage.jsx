import { useEffect, useState } from 'react'
import { getDashboardSummary, getEnergyBalance, getIndicators } from '../services/api'

const s = {
  page: { padding: 24, maxWidth: 1100, margin: '0 auto', overflowY: 'auto', height: '100%' },
  heading: { fontSize: 20, fontWeight: 700, marginBottom: 16 },
  subheading: { fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '20px 0 8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 16 },
  card: { background: '#f8fafc', borderRadius: 8, padding: '12px 16px', textAlign: 'center' },
  num: { fontWeight: 700, fontSize: 22, color: '#1e293b' },
  label: { fontSize: 11, color: '#64748b', marginTop: 4 },
  select: { padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600 },
  td: { padding: '4px 8px', borderBottom: '1px solid #f1f5f9' },
  loading: { padding: 24, color: '#94a3b8', textAlign: 'center' },
  barsSection: { marginTop: 12 },
  bars: { display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 },
  bar: (pct, color) => ({
    flex: 1, background: color || '#3B82F6', borderRadius: 2,
    height: `${Math.max(pct * 100, 4)}%`, minHeight: 3,
  }),
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const LAYER_LABELS = {
  seg_bt: 'Seg. BT', seg_mt: 'Seg. MT', seg_at: 'Seg. AT',
  trafo: 'Trafos', trafo_sub: 'Trafos Sub', subestacao: 'Subestações',
  consumidor_pj: 'Consumidores', geracao_dist: 'Geração',
  eq_compensador_reativo: 'Comp. Reativo', compensador_reativo_bt: 'Comp. BT',
  compensador_reativo_at: 'Comp. AT', regulador_at: 'Regulador AT',
  seccionadora_bt: 'Seccionadora BT', trafo_at: 'Trafo AT',
  ramal_lig: 'Ramais', ponto_notavel: 'Pontos Not.',
}

function EnergyBars({ data, title, color }) {
  if (!data) return null
  const values = MONTHS.map((_, i) => data[`ene_${String(i + 1).padStart(2, '0')}`] ?? 0)
  const max = Math.max(...values, 1)
  return (
    <div style={s.barsSection}>
      <div style={{ ...s.subheading, fontSize: 11 }}>{title}</div>
      <div style={s.bars}>
        {values.map((v, i) => (
          <div key={i} style={s.bar(v / max, color)} title={`${MONTHS[i]}: ${v?.toFixed(1)}`} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [distribuidora, setDistribuidora] = useState('')
  const [energyBalance, setEnergyBalance] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!distribuidora) { setEnergyBalance(null); setIndicators(null); return }
    getEnergyBalance(distribuidora).then(setEnergyBalance).catch(console.error)
    getIndicators(distribuidora).then(setIndicators).catch(console.error)
  }, [distribuidora])

  if (loading) return <div style={s.loading}>A carregar dashboard…</div>

  const distribuidoras = summary?.base
    ? [summary.base.distribuidora]
    : [...new Set(Object.keys(summary?.counts || {}))]

  return (
    <div style={s.page}>
      <div style={s.heading}>Dashboard BDGD</div>

      {/* Summary cards */}
      {summary?.counts && (
        <>
          <div style={s.subheading}>Contagens por Tabela</div>
          <div style={s.grid}>
            {Object.entries(summary.counts).map(([key, count]) => (
              <div key={key} style={s.card}>
                <div style={s.num}>{count.toLocaleString('pt-BR')}</div>
                <div style={s.label}>{LAYER_LABELS[key] || key}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Base metadata */}
      {summary?.base && (
        <div style={{ ...s.card, textAlign: 'left', marginBottom: 16 }}>
          <div style={s.subheading}>Metadados da Base</div>
          {Object.entries(summary.base).filter(([k]) => k !== 'id').map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Distribuidora selector for energy */}
      <div style={s.subheading}>Balanço Energético</div>
      <select style={s.select} value={distribuidora} onChange={e => setDistribuidora(e.target.value)}>
        <option value="">Selecione distribuidora…</option>
        {distribuidoras.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      {/* Energy balance */}
      {energyBalance && (
        <>
          {energyBalance.balanco?.length > 0 && (
            <>
              <div style={s.subheading}>Balanço ({energyBalance.balanco.length} registos)</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Código</th>
                    <th style={s.th}>Ano</th>
                    {Object.keys(energyBalance.balanco[0]).filter(k => !['id','cod_id','distribuidora','ano_ref'].includes(k)).slice(0, 5).map(k => (
                      <th key={k} style={s.th}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {energyBalance.balanco.slice(0, 20).map((row, i) => (
                    <tr key={i}>
                      <td style={s.td}>{row.cod_id}</td>
                      <td style={s.td}>{row.ano_ref}</td>
                      {Object.keys(row).filter(k => !['id','cod_id','distribuidora','ano_ref'].includes(k)).slice(0, 5).map(k => (
                        <td key={k} style={s.td}>{row[k] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {energyBalance.perda_tecnica?.length > 0 && (
            <>
              <div style={s.subheading}>Perdas Técnicas ({energyBalance.perda_tecnica.length})</div>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Código</th>
                    {Object.keys(energyBalance.perda_tecnica[0]).filter(k => !['id','cod_id','distribuidora','ano_ref'].includes(k)).slice(0, 6).map(k => (
                      <th key={k} style={s.th}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {energyBalance.perda_tecnica.map((row, i) => (
                    <tr key={i}>
                      <td style={s.td}>{row.cod_id}</td>
                      {Object.keys(row).filter(k => !['id','cod_id','distribuidora','ano_ref'].includes(k)).slice(0, 6).map(k => (
                        <td key={k} style={s.td}>{row[k] ?? '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {/* Indicators */}
      {indicators && indicators.length > 0 && (
        <>
          <div style={s.subheading}>Indicadores por Município ({indicators.length})</div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Município</th>
                <th style={s.th}>Código</th>
                {Object.keys(indicators[0]).filter(k => !['id','cod_id','distribuidora','ano_ref','mun_id'].includes(k)).slice(0, 5).map(k => (
                  <th key={k} style={s.th}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indicators.slice(0, 50).map((row, i) => (
                <tr key={i}>
                  <td style={s.td}>{row.mun_id}</td>
                  <td style={s.td}>{row.cod_id}</td>
                  {Object.keys(row).filter(k => !['id','cod_id','distribuidora','ano_ref','mun_id'].includes(k)).slice(0, 5).map(k => (
                    <td key={k} style={s.td}>{row[k] ?? '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
