import { useState, useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'

export default function useCoordinateTool(getMap) {
  const [coordToolActive, setCoordToolActive] = useState(false)
  const [coords, setCoords] = useState(null) // {lng, lat}

  const getMapRef = useRef(getMap)
  const markerRef = useRef(null)
  const coordsRef = useRef(null)

  useEffect(() => { getMapRef.current = getMap }, [getMap])
  useEffect(() => { coordsRef.current = coords }, [coords])

  function updateMarker(map, lng, lat) {
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat])
    } else {
      markerRef.current = new maplibregl.Marker({ color: '#3B82F6' })
        .setLngLat([lng, lat])
        .addTo(map)
    }
  }

  function removeMarker() {
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }
  }

  const handleClick = useCallback((e) => {
    const map = getMapRef.current()
    if (!map) return
    const { lng, lat } = e.lngLat
    const c = { lng, lat }
    coordsRef.current = c
    setCoords(c)
    updateMarker(map, lng, lat)
  }, [])

  // Exposed setter for panel edits
  const setCoordsFromPanel = useCallback((c) => {
    const map = getMapRef.current()
    if (!c || !map) return
    coordsRef.current = c
    setCoords(c)
    updateMarker(map, c.lng, c.lat)
    map.flyTo({ center: [c.lng, c.lat], duration: 600 })
  }, [])

  const clearCoords = useCallback(() => {
    coordsRef.current = null
    setCoords(null)
    removeMarker()
  }, [])

  // Setup/cleanup on activate/deactivate
  useEffect(() => {
    const map = getMapRef.current()
    if (!map) return

    // Reset state
    coordsRef.current = null
    setCoords(null)
    removeMarker()

    if (!coordToolActive) {
      map.getCanvas().style.cursor = ''
      return
    }

    map.getCanvas().style.cursor = 'crosshair'
    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = ''
      }
      removeMarker()
    }
  }, [coordToolActive]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    coordToolActive,
    setCoordToolActive,
    coords,
    setCoordsFromPanel,
    clearCoords,
  }
}
