import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty'

// Estilo visual por layer
const LAYER_STYLES = {
  // ── Rede ──────────────────────────────────────────────────
  seg_bt:        { type: 'line',   color: '#3B82F6', width: 1.5 },
  seg_mt:        { type: 'line',   color: '#F59E0B', width: 2 },
  seg_at:        { type: 'line',   color: '#DC2626', width: 2.5 },
  ramal_lig:     { type: 'line',   color: '#94A3B8', width: 1,   minzoom: 13 },
  // ── Equipamentos ─────────────────────────────────────────
  trafo:         { type: 'circle', color: '#8B5CF6', radius: 5 },
  trafo_sub:     { type: 'circle', color: '#7C3AED', radius: 7,  minzoom: 8 },
  eq_compensador_reativo: { type: 'circle', color: '#FBBF24', radius: 6, minzoom: 12 },
  compensador_reativo_bt: { type: 'circle', color: '#FCD34D', radius: 5, minzoom: 13 },
  compensador_reativo_at: { type: 'circle', color: '#F59E0B', radius: 5, minzoom: 11 },
  regulador_at:        { type: 'circle', color: '#D97706', radius: 6,  minzoom: 11 },
  seccionadora_bt:     { type: 'circle', color: '#92400E', radius: 4,  minzoom: 13 },
  trafo_at:            { type: 'circle', color: '#6D28D9', radius: 7,  minzoom: 8 },
  ponto_notavel: { type: 'circle', color: '#F472B6', radius: 3,  minzoom: 14 },
  // ── Instalações ──────────────────────────────────────────
  subestacao:        { type: 'circle', color: '#EF4444', radius: 7 },
  area_atendimento:  { type: 'fill',   color: '#6366F1', opacity: 0.15, outlineColor: '#6366F1' },
  conjunto:          { type: 'fill',   color: '#14B8A6', opacity: 0.15, outlineColor: '#14B8A6' },
  // ── Consumo / Geração ────────────────────────────────────
  consumidor_pj: { type: 'circle', color: '#10B981', radius: 4,  minzoom: 14 },
  geracao_dist:  { type: 'circle', color: '#84CC16', radius: 6,  minzoom: 11 },
  // ── Perdas ───────────────────────────────────────────────
  unidade_seg_mt:      { type: 'circle', color: '#F97316', radius: 4, minzoom: 12 },
  unidade_seg_at:      { type: 'circle', color: '#EF4444', radius: 4, minzoom: 10 },
  unidade_rede_mt:     { type: 'circle', color: '#FB923C', radius: 5, minzoom: 10 },
  unidade_rede_est_mt: { type: 'circle', color: '#FDBA74', radius: 5, minzoom: 10 },
}

const TILE_URL = import.meta.env.VITE_TILE_URL || 'http://localhost:3000'

const styles = {
  container: { width: '100%', height: '100%' },
}

// Expõe addLayer / removeLayer / setFilter ao MapPage via ref
const MapView = forwardRef(function MapView({ onFeatureClick, activeToolMode, onToolClick }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const activeToolModeRef = useRef(null)
  const onToolClickRef = useRef(null)

  // Sync refs (evita re-registrar eventos do mapa)
  useEffect(() => { activeToolModeRef.current = activeToolMode }, [activeToolMode])
  useEffect(() => { onToolClickRef.current = onToolClick }, [onToolClick])

  // Cursor crosshair quando ferramenta ativa
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getCanvas().style.cursor = activeToolMode ? 'crosshair' : ''
  }, [activeToolMode])

  useImperativeHandle(ref, () => ({
    addLayer(layerId) {
      const map = mapRef.current
      if (!map) return

      const tileUrl = `${TILE_URL}/${layerId}/{z}/{x}/{y}`
      const style = LAYER_STYLES[layerId]
      const sourceId = `src-${layerId}`
      const paintLayerId = `layer-${layerId}`

      if (map.getSource(sourceId)) return // já adicionado

      map.addSource(sourceId, {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 0,
        maxzoom: 22,
      })

      if (style.type === 'line') {
        map.addLayer({
          id: paintLayerId,
          type: 'line',
          source: sourceId,
          'source-layer': layerId,
          paint: {
            'line-color': style.color,
            'line-width': style.width,
          },
          minzoom: style.minzoom || 0,
        })
      } else if (style.type === 'fill') {
        // Polygon fill + outline
        map.addLayer({
          id: paintLayerId,
          type: 'fill',
          source: sourceId,
          'source-layer': layerId,
          paint: {
            'fill-color': style.color,
            'fill-opacity': style.opacity || 0.2,
          },
          minzoom: style.minzoom || 0,
        })
        map.addLayer({
          id: `${paintLayerId}-outline`,
          type: 'line',
          source: sourceId,
          'source-layer': layerId,
          paint: {
            'line-color': style.outlineColor || style.color,
            'line-width': 2,
          },
          minzoom: style.minzoom || 0,
        })
      } else {
        map.addLayer({
          id: paintLayerId,
          type: 'circle',
          source: sourceId,
          'source-layer': layerId,
          paint: {
            'circle-color': style.color,
            'circle-radius': style.radius,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
          minzoom: style.minzoom || 0,
        })
      }

      // Click → popup (desativado quando ferramenta ativa)
      map.on('click', paintLayerId, (e) => {
        if (activeToolModeRef.current) return
        const feature = e.features?.[0]
        if (!feature) return
        onFeatureClick?.({
          layerId,
          featureId: feature.properties?.id ?? feature.id,
          codId: feature.properties?.cod_id ?? null,
          point: e.point,
          lngLat: e.lngLat,
        })
      })

      // Cursor pointer no hover
      map.on('mouseenter', paintLayerId, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', paintLayerId, () => {
        map.getCanvas().style.cursor = ''
      })
    },

    removeLayer(layerId) {
      const map = mapRef.current
      if (!map) return
      const paintLayerId = `layer-${layerId}`
      const sourceId = `src-${layerId}`
      // Remove outline layer for fill types
      if (map.getLayer(`${paintLayerId}-outline`)) map.removeLayer(`${paintLayerId}-outline`)
      if (map.getLayer(paintLayerId)) map.removeLayer(paintLayerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    },

    setFilter(layerId, distribuidora) {
      const map = mapRef.current
      if (!map) return
      const paintLayerId = `layer-${layerId}`
      if (!map.getLayer(paintLayerId)) return
      if (distribuidora) {
        map.setFilter(paintLayerId, ['==', ['get', 'distribuidora'], distribuidora])
        // Also filter outline layer if exists
        if (map.getLayer(`${paintLayerId}-outline`)) {
          map.setFilter(`${paintLayerId}-outline`, ['==', ['get', 'distribuidora'], distribuidora])
        }
      } else {
        map.setFilter(paintLayerId, null)
        if (map.getLayer(`${paintLayerId}-outline`)) {
          map.setFilter(`${paintLayerId}-outline`, null)
        }
      }
    },

    highlightFeature(layerId, codId) {
      const map = mapRef.current
      if (!map) return

      // Remove previous highlight
      if (map.getLayer('highlight-layer')) map.removeLayer('highlight-layer')
      if (map.getSource('highlight-source')) map.removeSource('highlight-source')

      const sourceId = `src-${layerId}`
      if (!map.getSource(sourceId)) return  // layer not active on map

      // Query vector tiles for matching feature
      const features = map.querySourceFeatures(sourceId, {
        sourceLayer: layerId,
        filter: ['==', ['get', 'cod_id'], codId],
      })

      if (!features.length) return

      const geomType = features[0].geometry.type
      const isLine = geomType.includes('Line')
      const isPoint = geomType.includes('Point')
      const isPoly = geomType.includes('Polygon')

      map.addSource('highlight-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      })

      if (isLine) {
        map.addLayer({
          id: 'highlight-layer',
          type: 'line',
          source: 'highlight-source',
          paint: {
            'line-color': '#FACC15',
            'line-width': 4,
            'line-opacity': 0.9,
          },
        })
      } else if (isPoly) {
        map.addLayer({
          id: 'highlight-layer',
          type: 'line',
          source: 'highlight-source',
          paint: {
            'line-color': '#FACC15',
            'line-width': 3,
            'line-opacity': 0.9,
          },
        })
      } else if (isPoint) {
        map.addLayer({
          id: 'highlight-layer',
          type: 'circle',
          source: 'highlight-source',
          paint: {
            'circle-radius': 10,
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#FACC15',
          },
        })
      }
    },

    clearHighlight() {
      const map = mapRef.current
      if (!map) return
      if (map.getLayer('highlight-layer')) map.removeLayer('highlight-layer')
      if (map.getSource('highlight-source')) map.removeSource('highlight-source')
    },

    // ── Medição ──────────────────────────────────────────────
    drawMeasureGeometry(geojson) {
      const map = mapRef.current
      if (!map) return
      if (map.getSource('measure-source')) {
        map.getSource('measure-source').setData(geojson)
      } else {
        map.addSource('measure-source', { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'measure-fill', type: 'fill', source: 'measure-source',
          filter: ['==', '$type', 'Polygon'],
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 },
        })
        map.addLayer({
          id: 'measure-line', type: 'line', source: 'measure-source',
          filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']],
          paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [4, 2] },
        })
        map.addLayer({
          id: 'measure-points', type: 'circle', source: 'measure-source',
          filter: ['==', '$type', 'Point'],
          paint: {
            'circle-radius': 5, 'circle-color': '#fff',
            'circle-stroke-width': 2, 'circle-stroke-color': '#3b82f6',
          },
        })
        map.addLayer({
          id: 'measure-labels', type: 'symbol', source: 'measure-source',
          filter: ['has', 'label'],
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-offset': [0, -1.2],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#1e293b',
            'text-halo-color': '#fff',
            'text-halo-width': 2,
          },
        })
      }
    },

    clearMeasureGeometry() {
      const map = mapRef.current
      if (!map) return
      ;['measure-labels', 'measure-points', 'measure-line', 'measure-fill'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource('measure-source')) map.removeSource('measure-source')
    },

    // ── Marcador de coordenada ───────────────────────────────
    drawCoordinateMarker(lngLat) {
      const map = mapRef.current
      if (!map) return
      const data = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] },
          properties: {},
        }],
      }
      if (map.getSource('coord-marker-source')) {
        map.getSource('coord-marker-source').setData(data)
      } else {
        map.addSource('coord-marker-source', { type: 'geojson', data })
        map.addLayer({
          id: 'coord-marker-outer', type: 'circle', source: 'coord-marker-source',
          paint: { 'circle-radius': 12, 'circle-color': 'rgba(239,68,68,0.2)', 'circle-stroke-width': 0 },
        })
        map.addLayer({
          id: 'coord-marker-inner', type: 'circle', source: 'coord-marker-source',
          paint: {
            'circle-radius': 5, 'circle-color': '#ef4444',
            'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
          },
        })
      }
    },

    clearCoordinateMarker() {
      const map = mapRef.current
      if (!map) return
      ;['coord-marker-inner', 'coord-marker-outer'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      if (map.getSource('coord-marker-source')) map.removeSource('coord-marker-source')
    },

    flyTo(lngLat, zoom) {
      const map = mapRef.current
      if (!map) return
      map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: zoom || map.getZoom() })
    },
  }))

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [-47.9292, -15.7801], // Brasília
      zoom: 5,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
      'top-right'
    )

    // Click: despacha para ferramenta ativa ou fecha popup em área vazia
    map.on('click', (e) => {
      if (activeToolModeRef.current) {
        onToolClickRef.current?.({ lngLat: e.lngLat, point: e.point })
        return
      }
      const features = map.queryRenderedFeatures(e.point)
      const hitLayer = features.some(f => f.layer.id.startsWith('layer-'))
      if (!hitLayer) onFeatureClick?.(null)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} style={styles.container} />
})

export default MapView
