import { useEffect, useState } from 'react'
import IngestaoForm from '../components/IngestaoForm'
import ProgressoIngestao from '../components/ProgressoIngestao'
import HistoricoIngestao from '../components/HistoricoIngestao'
import { iniciarIngestao, getHistoricoIngestao } from '../services/api'

const s = {
  page: { maxWidth: 800, margin: '0 auto', padding: 24, overflowY: 'auto', height: '100%' },
  heading: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  sub: { color: '#64748b', marginBottom: 20, fontSize: 14 },
  divider: { borderTop: '1px solid #e2e8f0', margin: '24px 0' },
  sectionTitle: { fontWeight: 700, fontSize: 15, marginBottom: 12 },
  alert: (type) => ({
    padding: '10px 14px', borderRadius: 6, marginBottom: 14, fontSize: 13,
    background: type === 'success' ? '#dcfce7' : '#fee2e2',
    color: type === 'success' ? '#166534' : '#991b1b',
    border: `1px solid ${type === 'success' ? '#86efac' : '#fca5a5'}`,
  }),
  info: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: 14, marginBottom: 20, fontSize: 13, color: '#475569', lineHeight: 1.6,
  },
}

export default function IngestaoPage() {
  const [activeJobId, setActiveJobId] = useState(null)
  const [historico, setHistorico] = useState([])
  const [alert, setAlert] = useState(null)

  function loadHistorico() {
    getHistoricoIngestao().then(setHistorico).catch(console.error)
  }

  useEffect(() => { loadHistorico() }, [])

  async function handleSubmit(body) {
    setAlert(null)
    try {
      const { job_id } = await iniciarIngestao(body)
      setActiveJobId(job_id)
    } catch (e) {
      setAlert({ type: 'error', msg: `Erro ao iniciar: ${e.message}` })
    }
  }

  function handleDone() {
    setActiveJobId(null)
    setAlert({ type: 'success', msg: 'Ingestão concluída. Verifique o histórico abaixo.' })
    loadHistorico()
  }

  return (
    <div style={s.page}>
      <div style={s.heading}>Ingestão de Dados — BDGD / ANEEL</div>
      <div style={s.sub}>
        Carregue os ficheiros de rede elétrica da Base de Dados Geográfica da Distribuidora (BDGD)
        publicados pela ANEEL no portal de dados abertos.
      </div>

      <div style={s.info}>
        <strong>O que é a BDGD?</strong> A BDGD é a base geográfica obrigatória que todas as
        distribuidoras submetem à ANEEL anualmente. Contém a localização exacta de cada segmento
        de rede, transformador e subestação. Os ficheiros estão disponíveis em formato .gdb
        (Esri File Geodatabase) no portal <em>dadosabertos.aneel.gov.br</em>.
      </div>

      {alert && (
        <div style={s.alert(alert.type)}>{alert.msg}</div>
      )}

      <IngestaoForm onSubmit={handleSubmit} disabled={!!activeJobId} />

      {activeJobId && (
        <>
          <div style={s.divider} />
          <ProgressoIngestao jobId={activeJobId} onDone={handleDone} />
        </>
      )}

      <div style={s.divider} />
      <div style={s.sectionTitle}>Histórico</div>
      <HistoricoIngestao items={historico} />
    </div>
  )
}
