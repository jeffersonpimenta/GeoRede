import { useState } from 'react'
import MapPage from './pages/MapPage'
import IngestaoPage from './pages/IngestaoPage'

const TABS = [
  { id: 'mapa', label: 'Mapa' },
  { id: 'ingestao', label: 'Ingestão' },
]

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    background: '#1e293b',
    flexShrink: 0,
  },
  tab: {
    padding: '10px 24px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontWeight: 500,
    fontSize: 14,
    transition: 'color 0.15s, background 0.15s',
  },
  tabActive: {
    color: '#f8fafc',
    background: '#0f172a',
    borderBottom: '2px solid #3b82f6',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
}

export default function App() {
  const [activeTab, setActiveTab] = useState('mapa')

  return (
    <div style={styles.app}>
      <div style={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={styles.content}>
        {activeTab === 'mapa' && <MapPage />}
        {activeTab === 'ingestao' && <IngestaoPage />}
      </div>
    </div>
  )
}
