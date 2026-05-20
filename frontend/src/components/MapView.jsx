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
  eq_corte:      { type: 'circle', color: '#FBBF24', radius: 6,  minzoom: 12 },
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
const MapView = forwardRef(function MapView({ onFeatureClick }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

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

      // Click → popup
      map.on('click', paintLayerId, (e) => {
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

    // Click em área vazia fecha popup
    map.on('click', (e) => {
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
