const tools = [
  { id: 'distance', label: 'Distância', icon: '📏' },
  { id: 'area',     label: 'Área',      icon: '⬡' },
  { id: 'buffer',   label: 'Buffer',    icon: '◎' },
]

const styles = {
  container: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    zIndex: 15,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  button: {
    width: 36,
    height: 36,
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    transition: 'background 0.15s',
  },
  active: {
    background: '#DBEAFE',
    borderColor: '#3B82F6',
  },
}

export default function MapToolbar({ activeTool, onToolChange }) {
  return (
    <div style={styles.container}>
      {tools.map(t => (
        <button
          key={t.id}
          title={t.label}
          style={{
            ...styles.button,
            ...(activeTool === t.id ? styles.active : {}),
          }}
          onClick={() => onToolChange(activeTool === t.id ? null : t.id)}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
