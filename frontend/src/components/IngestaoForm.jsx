import { useEffect, useState } from 'react'
import { getDistribuidoras } from '../services/api'

const ENTIDADE_GROUPS = [
  {
    label: 'Rede (geometria)',
    items: [
      { codigo: 'SSDBT',  descricao: 'Rede de Baixa Tensão' },
      { codigo: 'SSDMT',  descricao: 'Rede de Média Tensão' },
      { codigo: 'SSDAT',  descricao: 'Rede de Alta Tensão' },
      { codigo: 'RAMLIG', descricao: 'Ramais de Ligação' },
    ],
  },
  {
    label: 'Instalações / Equipamentos',
    items: [
      { codigo: 'SUB',    descricao: 'Subestações' },
      { codigo: 'UNTRD',  descricao: 'Transformadores Distribuição' },
      { codigo: 'UNTRS',  descricao: 'Transformadores Subestação' },
      { codigo: 'UNTRAT', descricao: 'Transformadores Alta Tensão' },
      { codigo: 'EQCR',   descricao: 'Compensadores de Reativo' },
      { codigo: 'UNCRBT', descricao: 'Compensador Reativo BT' },
      { codigo: 'UNCRAT', descricao: 'Compensador Reativo AT' },
      { codigo: 'UNREAT', descricao: 'Regulador de Tensão AT' },
      { codigo: 'UNSEBT', descricao: 'Seccionadora BT' },
      { codigo: 'PONNOT', descricao: 'Pontos Notáveis' },
      { codigo: 'ARAT',   descricao: 'Área de Atendimento' },
      { codigo: 'CONJ',   descricao: 'Conjuntos' },
    ],
  },
  {
    label: 'Consumidores / Geração',
    items: [
      { codigo: 'UCBT',  descricao: 'Consumidores BT' },
      { codigo: 'UCMT',  descricao: 'Consumidores MT' },
      { codigo: 'UCAT',  descricao: 'Consumidores AT' },
      { codigo: 'UGBT',  descricao: 'Geração BT' },
      { codigo: 'UGMT',  descricao: 'Geração MT' },
      { codigo: 'UGAT',  descricao: 'Geração AT' },
    ],
  },
  {
    label: 'Perdas',
    items: [
      { codigo: 'UNSEMT', descricao: 'Perdas Seg. MT' },
      { codigo: 'UNSEAT', descricao: 'Perdas Seg. AT' },
      { codigo: 'UNCRMT', descricao: 'Unid. Rede MT' },
      { codigo: 'UNREMT', descricao: 'Unid. Rede Est. MT' },
    ],
  },
  {
    label: 'Enriquecimento (sem geometria)',
    items: [
      { codigo: 'CTMT',   descricao: 'Circuitos MT' },
      { codigo: 'CTAT',   descricao: 'Circuitos AT' },
      { codigo: 'SEGCON', descricao: 'Catálogo de Condutores' },
      { codigo: 'BAR',    descricao: 'Barras de Subestação' },
      { codigo: 'BAY',    descricao: 'Bays de Subestação' },
      { codigo: 'EQTRD',  descricao: 'Equip. Trafo Distribuição' },
      { codigo: 'EQTRM',  descricao: 'Equip. Trafo MT' },
      { codigo: 'EQTRS',  descricao: 'Equip. Trafo Subestação' },
      { codigo: 'EQSIAT', descricao: 'Equip. SIA AT' },
      { codigo: 'EQTRSX', descricao: 'Trafo Auxiliar Sub.' },
      { codigo: 'EQTRAT', descricao: 'Equip. Trafo Alta Tensão' },
      { codigo: 'EQTRMT', descricao: 'Equip. Trafo Média Tensão' },
      { codigo: 'EQRE',   descricao: 'Reguladores de Tensão' },
      { codigo: 'EQSE',   descricao: 'Seccionamento' },
      { codigo: 'EQME',   descricao: 'Medidores' },
      { codigo: 'PIP',    descricao: 'Iluminação Pública' },
      { codigo: 'CRVCRG', descricao: 'Curvas de Carga' },
    ],
  },
  {
    label: 'Dashboard',
    items: [
      { codigo: 'BE',     descricao: 'Balanço Energético' },
      { codigo: 'EP',     descricao: 'Energia Própria' },
      { codigo: 'PT',     descricao: 'Perdas Técnicas' },
      { codigo: 'PNT',    descricao: 'Perdas Não Técnicas' },
      { codigo: 'INDGER', descricao: 'Indicadores de Gestão' },
      { codigo: 'BASE',   descricao: 'Metadados da Base' },
    ],
  },
]

const ALL_ENTIDADES = ENTIDADE_GROUPS.flatMap(g => g.items)

const ANOS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017]

const s = {
  field: { marginBottom: 14 },
  label: { display: 'block', fontWeight: 600, marginBottom: 4, color: '#374151' },
  select: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  input: { width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 },
  groupLabel: { fontWeight: 600, fontSize: 12, color: '#6b7280', margin: '8px 0 4px', borderTop: '1px solid #e5e7eb', paddingTop: 6 },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 },
  selectAll: { fontSize: 12, color: '#3b82f6', cursor: 'pointer', marginLeft: 8, border: 'none', background: 'none', textDecoration: 'underline' },
  btn: {
    width: '100%', padding: '10px', borderRadius: 6, border: 'none',
    background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 15, marginTop: 8,
    cursor: 'pointer',
  },
  btnDisabled: { background: '#93c5fd', cursor: 'default' },
}

export default function IngestaoForm({ onSubmit, disabled }) {
  const [distribuidoras, setDistribuidoras] = useState([])
  const [sigla, setSigla] = useState('')
  const [urlGdb, setUrlGdb] = useState('')
  const [ano, setAno] = useState(2024)
  const [entidades, setEntidades] = useState(['SSDBT', 'SSDMT', 'UNTRD', 'SUB'])

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

  function selectGroup(group) {
    const codes = group.items.map(i => i.codigo)
    const allSelected = codes.every(c => entidades.includes(c))
    if (allSelected) {
      setEntidades(prev => prev.filter(e => !codes.includes(e)))
    } else {
      setEntidades(prev => [...new Set([...prev, ...codes])])
    }
  }

  function selectAll() {
    if (entidades.length === ALL_ENTIDADES.length) {
      setEntidades([])
    } else {
      setEntidades(ALL_ENTIDADES.map(e => e.codigo))
    }
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
        <label style={s.label}>
          Entidades a ingerir
          <button type="button" style={s.selectAll} onClick={selectAll} disabled={disabled}>
            {entidades.length === ALL_ENTIDADES.length ? 'Desmarcar todas' : 'Selecionar todas'}
          </button>
        </label>
        {ENTIDADE_GROUPS.map(group => (
          <div key={group.label}>
            <div style={s.groupLabel}>
              {group.label}
              <button type="button" style={s.selectAll} onClick={() => selectGroup(group)} disabled={disabled}>
                grupo
              </button>
            </div>
            {group.items.map(ent => (
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
        ))}
      </div>

      <button
        type="submit"
        style={{ ...s.btn, ...(disabled ? s.btnDisabled : {}) }}
        disabled={disabled}
      >
        {disabled ? 'A ingerir…' : 'Iniciar Ingestão'}
      </button>
    </form>
  )
}
