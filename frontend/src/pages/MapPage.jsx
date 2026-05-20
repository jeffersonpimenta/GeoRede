import { useRef, useState, useCallback } from 'react'
import MapView from '../components/MapView'
import LayerPanel from '../components/LayerPanel'
import InfoPanel from '../components/InfoPanel'
import SearchBar from '../components/SearchBar'
import MapToolbar from '../components/MapToolbar'
import MeasureTool from '../components/MeasureTool'
import CoordinateTool from '../components/CoordinateTool'
import { haversineDistance, formatDistance } from '../utils/geomath'

export default function MapPage() {
  const mapRef = useRef(null)
  const [activeLayers, setActiveLayers] = useState([])
  const [panelTarget, setPanelTarget] = useState(null)

  // ── Estado das ferramentas ─────────────────────────────────
  const [activeToolMode, setActiveToolMode] = useState(null)
  const [measurePoints, setMeasurePoints] = useState([])
  const [measureMode, setMeasureMode] = useState('distance')
  const [coordTarget, setCoordTarget] = useState(null)

  // ── Handlers existentes ────────────────────────────────────
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
    setPanelTarget({
      layerId: item.layer_id,
      featureId: item.id,
      codId: item.cod_id,
    })
    if (activeLayers.includes(item.layer_id)) {
      mapRef.current?.highlightFeature(item.layer_id, item.cod_id)
    }
  }

  // ── Ferramenta: gestão de modo ─────────────────────────────
  function handleToolModeChange(mode) {
    // Limpa ferramenta anterior
    if (activeToolMode === 'measure') {
      mapRef.current?.clearMeasureGeometry()
      setMeasurePoints([])
    }
    if (activeToolMode === 'coordinate') {
      mapRef.current?.clearCoordinateMarker()
      setCoordTarget(null)
    }
    setActiveToolMode(mode)
  }

  // ── Ferramenta: clique no mapa ─────────────────────────────
  const handleToolClick = useCallback(({ lngLat }) => {
    if (activeToolMode === 'measure') {
      setMeasurePoints(prev => {
        const pts = [...prev, [lngLat.lng, lngLat.lat]]
        updateMeasureGeometry(pts, measureMode)
        return pts
      })
    } else if (activeToolMode === 'coordinate') {
      setCoordTarget({ lng: lngLat.lng, lat: lngLat.lat })
      mapRef.current?.drawCoordinateMarker(lngLat)
    }
  }, [activeToolMode, measureMode])

  // ── Medição: ações ─────────────────────────────────────────
  function handleMeasureUndo() {
    setMeasurePoints(prev => {
      const pts = prev.slice(0, -1)
      if (pts.length === 0) {
        mapRef.current?.clearMeasureGeometry()
      } else {
        updateMeasureGeometry(pts, measureMode)
      }
      return pts
    })
  }

  function handleMeasureClear() {
    setMeasurePoints([])
    mapRef.current?.clearMeasureGeometry()
  }

  function handleMeasureModeSwitch(newMode) {
    setMeasureMode(newMode)
    if (measurePoints.length >= 2) {
      updateMeasureGeometry(measurePoints, newMode)
    }
  }

  // ── Coordenada: input do usuário ───────────────────────────
  function handleCoordinateInput(lngLat) {
    setCoordTarget(lngLat)
    mapRef.current?.drawCoordinateMarker(lngLat)
    mapRef.current?.flyTo(lngLat, 14)
  }

  // ── Construção GeoJSON para medição ────────────────────────
  function updateMeasureGeometry(points, mode) {
    const features = []

    // Pontos (vértices)
    points.forEach(p => {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p },
        properties: {},
      })
    })

    if (points.length >= 2) {
      if (mode === 'area' && points.length >= 3) {
        // Polígono fechado
        const ring = [...points, points[0]]
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [ring] },
          properties: {},
        })
        // Labels nos segmentos do polígono
        for (let i = 0; i < ring.length - 1; i++) {
          const d = haversineDistance(ring[i][1], ring[i][0], ring[i + 1][1], ring[i + 1][0])
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [(ring[i][0] + ring[i + 1][0]) / 2, (ring[i][1] + ring[i + 1][1]) / 2],
            },
            properties: { label: formatDistance(d) },
          })
        }
      } else {
        // Linha
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: points },
          properties: {},
        })
        // Labels nos segmentos
        for (let i = 0; i < points.length - 1; i++) {
          const d = haversineDistance(points[i][1], points[i][0], points[i + 1][1], points[i + 1][0])
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2],
            },
            properties: { label: formatDistance(d) },
          })
        }
      }
    }

    mapRef.current?.drawMeasureGeometry({ type: 'FeatureCollection', features })
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        ref={mapRef}
        onFeatureClick={handleFeatureClick}
        activeToolMode={activeToolMode}
        onToolClick={handleToolClick}
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
      <MapToolbar
        activeMode={activeToolMode}
        onModeChange={handleToolModeChange}
      />
      {activeToolMode === 'measure' && (
        <MeasureTool
          points={measurePoints}
          mode={measureMode}
          onModeSwitch={handleMeasureModeSwitch}
          onUndo={handleMeasureUndo}
          onClear={handleMeasureClear}
          onClose={() => handleToolModeChange(null)}
        />
      )}
      {activeToolMode === 'coordinate' && (
        <CoordinateTool
          coordinate={coordTarget}
          onCoordinateChange={handleCoordinateInput}
          onClose={() => handleToolModeChange(null)}
        />
      )}
    </div>
  )
}
