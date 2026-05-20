const s = {
  wrap: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    zIndex: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  btn: (active) => ({
    width: 36,
    height: 36,
    borderRadius: 6,
    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
    background: active ? '#3b82f6' : '#fff',
    color: active ? '#fff' : '#475569',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    lineHeight: 1,
  }),
}

// SVG ícone régua
function RulerIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.7 6.7l-4.4-4.4a1 1 0 0 0-1.4 0L2.3 15.9a1 1 0 0 0 0 1.4l4.4 4.4a1 1 0 0 0 1.4 0L21.7 8.1a1 1 0 0 0 0-1.4z" />
      <line x1="8" y1="12" x2="10" y2="14" />
      <line x1="11" y1="9" x2="13" y2="11" />
      <line x1="14" y1="6" x2="16" y2="8" />
    </svg>
  )
}

// SVG ícone alvo/crosshair
function CrosshairIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
  )
}

export default function MapToolbar({ activeMode, onModeChange }) {
  function toggle(mode) {
    onModeChange(activeMode === mode ? null : mode)
  }

  return (
    <div style={s.wrap}>
      <button
        style={s.btn(activeMode === 'measure')}
        onClick={() => toggle('measure')}
        title="Medir distância / área"
      >
        <RulerIcon color={activeMode === 'measure' ? '#fff' : '#475569'} />
      </button>
      <button
        style={s.btn(activeMode === 'coordinate')}
        onClick={() => toggle('coordinate')}
        title="Localizar coordenada"
      >
        <CrosshairIcon color={activeMode === 'coordinate' ? '#fff' : '#475569'} />
      </button>
    </div>
  )
}
