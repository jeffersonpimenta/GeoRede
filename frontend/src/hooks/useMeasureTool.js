import { useState, useEffect, useRef, useCallback } from 'react'
import {
  calcSegmentDistance,
  calcTotalDistance,
  calcArea,
  calcPerimeter,
  makeCircle,
  getMidpoint,
  formatDistance,
} from '../utils/measure'
import turfArea from '@turf/area'

const EMPTY_FC = { type: 'FeatureCollection', features: [] }

function cleanupMeasureLayers(map) {
  const ids = ['measure-labels', 'measure-fill', 'measure-line', 'measure-points']
  ids.forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id)
  })
  ids.forEach(id => {
    if (map.getSource(id)) map.removeSource(id)
  })
}

function addMeasureSources(map) {
  map.addSource('measure-points', { type: 'geojson', data: EMPTY_FC })
  map.addSource('measure-line', { type: 'geojson', data: EMPTY_FC })
  map.addSource('measure-fill', { type: 'geojson', data: EMPTY_FC })
  map.addSource('measure-labels', { type: 'geojson', data: EMPTY_FC })

  map.addLayer({
    id: 'measure-fill',
    type: 'fill',
    source: 'measure-fill',
    paint: {
      'fill-color': '#EF4444',
      'fill-opacity': 0.15,
    },
  })

  map.addLayer({
    id: 'measure-line',
    type: 'line',
    source: 'measure-line',
    paint: {
      'line-color': '#EF4444',
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  })

  map.addLayer({
    id: 'measure-points',
    type: 'circle',
    source: 'measure-points',
    paint: {
      'circle-radius': 5,
      'circle-color': '#EF4444',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  })

  map.addLayer({
    id: 'measure-labels',
    type: 'symbol',
    source: 'measure-labels',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 12,
      'text-offset': [0, -1.2],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#1F2937',
      'text-halo-color': '#fff',
      'text-halo-width': 2,
    },
  })
}

function updateMapLayers(map, pts, tool) {
  if (!map) return

  const pointFeatures = pts.map(c => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: c },
  }))

  const pointSrc = map.getSource('measure-points')
  if (pointSrc) pointSrc.setData({ type: 'FeatureCollection', features: pointFeatures })

  if (tool === 'distance' && pts.length >= 2) {
    const lineSrc = map.getSource('measure-line')
    if (lineSrc) lineSrc.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: pts } }],
    })

    const labelFeatures = []
    for (let i = 1; i < pts.length; i++) {
      const mid = getMidpoint(pts[i - 1], pts[i])
      const dist = calcSegmentDistance(pts[i - 1], pts[i])
      labelFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: mid },
        properties: { label: formatDistance(dist) },
      })
    }
    const labelSrc = map.getSource('measure-labels')
    if (labelSrc) labelSrc.setData({ type: 'FeatureCollection', features: labelFeatures })
  } else if (tool === 'area' && pts.length >= 3) {
    const ring = [...pts, pts[0]]
    const fillSrc = map.getSource('measure-fill')
    if (fillSrc) fillSrc.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] } }],
    })
    const lineSrc = map.getSource('measure-line')
    if (lineSrc) lineSrc.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: ring } }],
    })
  } else if (tool === 'area' && pts.length === 2) {
    const lineSrc = map.getSource('measure-line')
    if (lineSrc) lineSrc.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates: pts } }],
    })
  }
}

function computeMeas(pts, tool) {
  if (tool === 'distance') {
    if (pts.length < 2) return null
    const segments = []
    for (let i = 1; i < pts.length; i++) {
      segments.push(calcSegmentDistance(pts[i - 1], pts[i]))
    }
    return { segments, totalDistance: calcTotalDistance(pts) }
  } else if (tool === 'area') {
    if (pts.length < 3) return null
    return { area: calcArea(pts), perimeter: calcPerimeter(pts) }
  }
  return null
}

export default function useMeasureTool(getMap) {
  const [activeTool, setActiveTool] = useState(null)
  const [points, setPoints] = useState([])
  const [measurement, setMeasurement] = useState(null)
  const [radius, setRadius] = useState(500)
  const [radiusUnit, setRadiusUnit] = useState('m')
  const [finished, setFinished] = useState(false)

  // All mutable state in refs — handlers read refs only, no deps needed
  const getMapRef = useRef(getMap)
  const pointsRef = useRef([])
  const finishedRef = useRef(false)
  const activeToolRef = useRef(null)

  // Keep refs in sync
  useEffect(() => { getMapRef.current = getMap }, [getMap])
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { finishedRef.current = finished }, [finished])

  // Stable click handler — reads everything from refs
  const handleClick = useCallback((e) => {
    const tool = activeToolRef.current
    if (!tool) return
    if (finishedRef.current) return

    const coord = [e.lngLat.lng, e.lngLat.lat]
    const map = getMapRef.current()

    if (tool === 'buffer') {
      pointsRef.current = [coord]
      setPoints([coord])
      return
    }

    const newPts = [...pointsRef.current, coord]
    pointsRef.current = newPts
    setPoints(newPts)
    setMeasurement(computeMeas(newPts, tool))
    updateMapLayers(map, newPts, tool)
  }, [])

  // Stable dblclick handler
  const handleDblClick = useCallback((e) => {
    const tool = activeToolRef.current
    if (!tool) return
    if (tool === 'buffer') return
    e.preventDefault()
    finishedRef.current = true
    setFinished(true)
  }, [])

  // Setup/cleanup — depends ONLY on activeTool
  useEffect(() => {
    const map = getMapRef.current()
    if (!map) return

    // Cleanup previous
    cleanupMeasureLayers(map)
    pointsRef.current = []
    finishedRef.current = false
    setPoints([])
    setMeasurement(null)
    setFinished(false)

    if (!activeTool) {
      map.doubleClickZoom.enable()
      map.getCanvas().style.cursor = ''
      return
    }

    // Setup
    map.doubleClickZoom.disable()
    map.getCanvas().style.cursor = 'crosshair'
    addMeasureSources(map)
    map.on('click', handleClick)
    map.on('dblclick', handleDblClick)

    return () => {
      map.off('click', handleClick)
      map.off('dblclick', handleDblClick)
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = ''
      }
      map.doubleClickZoom.enable()
      cleanupMeasureLayers(map)
    }
  }, [activeTool]) // eslint-disable-line react-hooks/exhaustive-deps

  // Buffer effect — redraw circle when radius/unit/points change
  useEffect(() => {
    if (activeTool !== 'buffer') return
    if (points.length === 0) return

    const map = getMapRef.current()
    if (!map) return

    const radiusMeters = radiusUnit === 'km' ? radius * 1000 : radius
    if (radiusMeters <= 0) return

    const center = points[0]
    const circle = makeCircle(center, radiusMeters)
    const circleArea = turfArea(circle)

    const fillSrc = map.getSource('measure-fill')
    if (fillSrc) fillSrc.setData({ type: 'FeatureCollection', features: [circle] })

    const lineSrc = map.getSource('measure-line')
    if (lineSrc) lineSrc.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: circle.geometry.coordinates[0] },
      }],
    })

    const pointSrc = map.getSource('measure-points')
    if (pointSrc) pointSrc.setData({
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: center } }],
    })

    setMeasurement({ center, circleArea })
  }, [activeTool, points, radius, radiusUnit])

  const clearMeasurement = useCallback(() => {
    const map = getMapRef.current()
    pointsRef.current = []
    finishedRef.current = false
    setPoints([])
    setMeasurement(null)
    setFinished(false)
    if (!map) return
    const ids = ['measure-points', 'measure-line', 'measure-fill', 'measure-labels']
    ids.forEach(id => {
      const src = map.getSource(id)
      if (src) src.setData(EMPTY_FC)
    })
  }, [])

  return {
    activeTool,
    setActiveTool,
    measurement,
    clearMeasurement,
    radius,
    radiusUnit,
    setRadius,
    setRadiusUnit,
  }
}
