import { useRef, useState } from 'react'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import Popup from '../components/Popup'

export default function MapPage() {
  const mapRef = useRef(null)
  const [activeLayers, setActiveLayers] = useState([])
  const [popupTarget, setPopupTarget] = useState(null)

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
    // Aplica filtro de distribuidora em todas as layers activas
    activeLayers.forEach(layerId => {
      mapRef.current?.setFilter(layerId, distribuidora || null)
    })
  }

  function handleFeatureClick(target) {
    setPopupTarget(target)
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
      <Popup
        target={popupTarget}
        onClose={() => setPopupTarget(null)}
      />
    </div>
  )
}
