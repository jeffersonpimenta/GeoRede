import { useEffect, useState } from 'react'
import { getDistribuidoras } from '../services/api'

const ENTIDADES = [
  { codigo: 'SSDBT', descricao: 'Rede de Baixa Tensão (Segmentos BT)' },
  { codigo: 'SSDMT', descricao: 'Rede de Média Tensão (Segmentos MT)' },
  { codigo: 'UNTRD', descricao: 'Transformadores de Distribuição' },
  { codigo: 'SUB',   descricao: 'Subestações' },
  { codigo: 'UCBT',  descricao: 'Consumidores BT' },
  { codigo: 'UCMT',  descricao: 'Consumidores MT' },
  { codigo: 'UCAT',  descricao: 'Consumidores AT' },
]

const ANOS = [2024, 2023, 2022, 2021]

const s = {
  field: { marginBottom: 14 },
  label: { display: 'block', fontWeight: 600, marginBottom: 4, color: '#374151' },
  select: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  input: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  btn: {
    width: '100%', padding: '10px', borderRadius: 6, border: 'none',
    background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 8,
  },
  btnDisabled: { background: '#93c5fd' },
}

export default function IngestaoForm({ onSubmit, disabled }) {
  const [distribuidoras, setDistribuidoras] = useState([])
  const [sigla, setSigla] = useState('')
  const [urlGdb, setUrlGdb] = useState('')
  const [ano, setAno] = useState(2024)
  const [entidades, setEntidades] = useState(['SSDBT', 'SSDMT', 'UNTRD'])

  useEffect(() => {
    getDistribuidoras()
      .then(data => {
        setDistribuidoras(data)
        if (data.length) { setSigla(data[0].sigla); setUrlGdb(data[0].url_gdb) }
      })
      .catch(console.error)
  }, [])

  function handleDistribuidora(val) {
    setSigla(val)
    const found = distribuidoras.find(d => d.sigla === val)
    if (found) setUrlGdb(found.url_gdb)
  }

  function toggleEntidade(codigo) {
    setEntidades(prev =>
      prev.includes(codigo) ? prev.filter(e => e !== codigo) : [...prev, codigo]
    )
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!entidades.length) return alert('Seleccione pelo menos uma entidade.')
    onSubmit({ distribuidora: sigla, ano_ref: ano, url_gdb: urlGdb, entidades })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={s.field}>
        <label style={s.label}>Distribuidora</label>
        <select style={s.select} value={sigla} onChange={e => handleDistribuidora(e.target.value)} disabled={disabled}>
          {distribuidoras.map(d => (
            <option key={d.sigla} value={d.sigla}>{d.nome}</option>
          ))}
        </select>
      </div>

      <div style={s.field}>
        <label style={s.label}>URL do ficheiro .gdb</label>
        <input
          style={s.input}
          value={urlGdb}
          onChange={e => setUrlGdb(e.target.value)}
          disabled={disabled}
          placeholder="https://..."
        />
      </div>

      <div style={s.field}>
        <label style={s.label}>Ano de referência</label>
        <select style={s.select} value={ano} onChange={e => setAno(Number(e.target.value))} disabled={disabled}>
          {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div style={s.field}>
        <label style={s.label}>Entidades a ingerir</label>
        {ENTIDADES.map(ent => (
          <div key={ent.codigo} style={s.checkRow}>
            <input
              type="checkbox"
              id={ent.codigo}
              checked={entidades.includes(ent.codigo)}
              onChange={() => toggleEntidade(ent.codigo)}
              disabled={disabled}
            />
            <label htmlFor={ent.codigo}>
              <strong>{ent.codigo}</strong> — {ent.descricao}
            </label>
          </div>
        ))}
      </div>

      <button
        type="submit"
        style={{ ...s.btn, ...(disabled ? s.btnDisabled : {}) }}
        disabled={disabled}
      >
        {disabled ? '⏳ A ingerir…' : 'Iniciar Ingestão'}
      </button>
    </form>
  )
}
