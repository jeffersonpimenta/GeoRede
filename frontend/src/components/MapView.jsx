import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = import.meta.env.VITE_MAP_STYLE || 'https://tiles.openfreemap.org/styles/liberty'

// Estilo visual por layer
const LAYER_STYLES = {
  seg_bt:        { type: 'line',   color: '#3B82F6', width: 1.5 },
  seg_mt:        { type: 'line',   color: '#F59E0B', width: 2 },
  trafo:         { type: 'circle', color: '#8B5CF6', radius: 5 },
  subestacao:    { type: 'circle', color: '#EF4444', radius: 7 },
  consumidor_pj: { type: 'circle', color: '#10B981', radius: 4 },
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
          featureId: feature.id ?? feature.properties?.id,
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
      } else {
        map.setFilter(paintLayerId, null)
      }
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
