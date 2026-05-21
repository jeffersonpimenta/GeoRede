import { useRef, useState } from 'react'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import InfoPanel from '../components/InfoPanel'
import SearchBar from '../components/SearchBar'
import MapToolbar from '../components/MapToolbar'
import MeasureResultCard from '../components/MeasureResultCard'
import CoordinatePanel from '../components/CoordinatePanel'
import useMeasureTool from '../hooks/useMeasureTool'
import useCoordinateTool from '../hooks/useCoordinateTool'

export default function MapPage() {
  const mapRef = useRef(null)
  const [activeLayers, setActiveLayers] = useState([])
  const [panelTarget, setPanelTarget] = useState(null)

  const {
    activeTool, setActiveTool,
    measurement, clearMeasurement,
    radius, radiusUnit, setRadius, setRadiusUnit,
  } = useMeasureTool(() => mapRef.current?.getMap())

  const {
    coordToolActive, setCoordToolActive,
    coords, setCoordsFromPanel, clearCoords,
  } = useCoordinateTool(() => mapRef.current?.getMap())

  function handleToolChange(tool) {
    if (tool) {
      mapRef.current?.clearHighlight()
      setPanelTarget(null)
    }
    if (tool === 'coords') {
      setActiveTool(null)
      setCoordToolActive(prev => !prev)
    } else {
      setCoordToolActive(false)
      setActiveTool(tool)
    }
  }

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

  function handleSearchResult(item) {
    // Open InfoPanel for search result
    setPanelTarget({
      layerId: item.layer_id,
      featureId: item.id,
      codId: item.cod_id,
    })
    // Highlight if layer active
    if (activeLayers.includes(item.layer_id)) {
      mapRef.current?.highlightFeature(item.layer_id, item.cod_id)
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        ref={mapRef}
        onFeatureClick={handleFeatureClick}
        activeTool={coordToolActive ? 'coords' : activeTool}
      />
      <MapToolbar activeTool={coordToolActive ? 'coords' : activeTool} onToolChange={handleToolChange} />
      <MeasureResultCard
        activeTool={activeTool}
        measurement={measurement}
        radius={radius}
        radiusUnit={radiusUnit}
        onSetRadius={setRadius}
        onSetRadiusUnit={setRadiusUnit}
        onClear={clearMeasurement}
      />
      <CoordinatePanel
        active={coordToolActive}
        coords={coords}
        onCoordsChange={setCoordsFromPanel}
        onClear={clearCoords}
      />
      <LayerPanel
        activeLayers={activeLayers}
        onToggle={handleToggle}
        onFilterChange={handleFilterChange}
      />
      <SearchBar onResult={handleSearchResult} />
      <InfoPanel
        target={panelTarget}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    </div>
  )
}
