import { useRef, useState } from 'react'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import InfoPanel from '../components/InfoPanel'

export default function MapPage() {
  const mapRef = useRef(null)
  const [activeLayers, setActiveLayers] = useState([])
  const [panelTarget, setPanelTarget] = useState(null)

  function handleToggle(layerId) {
    if (activeLayers.includes(layerId)) {
      mapRef.current?.removeLayer(layerId)
      setActiveLayers(prev => prev.filter(id => id !== layerId))
    } else {
      mapRef.current?.addLayer(layerId)
      setActiveLayers(prev => [...prev, layerId])
    }
  }

  function handleFilterChange({ distribuidora }) {
    activeLayers.forEach(layerId => {
      mapRef.current?.setFilter(layerId, distribuidora || null)
    })
  }

  function handleFeatureClick(target) {
    mapRef.current?.clearHighlight()
    setPanelTarget(target)
  }

  function handleNavigate(layerId, codId) {
    if (!codId) {
      mapRef.current?.clearHighlight()
      return
    }
    if (activeLayers.includes(layerId)) {
      mapRef.current?.highlightFeature(layerId, codId)
    } else {
      mapRef.current?.clearHighlight()
    }
  }

  function handleClose() {
    mapRef.current?.clearHighlight()
    setPanelTarget(null)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        ref={mapRef}
        onFeatureClick={handleFeatureClick}
      />
      <LayerPanel
        activeLayers={activeLayers}
        onToggle={handleToggle}
        onFilterChange={handleFilterChange}
      />
      <InfoPanel
        target={panelTarget}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
