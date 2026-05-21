import { point, lineString, polygon } from '@turf/helpers'
import turfDistance from '@turf/distance'
import turfArea from '@turf/area'
import turfCircle from '@turf/circle'
import turfMidpoint from '@turf/midpoint'
import turfLength from '@turf/length'

export function calcSegmentDistance(a, b) {
  return turfDistance(point(a), point(b), { units: 'meters' })
}

export function calcTotalDistance(coords) {
  if (coords.length < 2) return 0
  return turfLength(lineString(coords), { units: 'meters' })
}

export function calcArea(coords) {
  if (coords.length < 3) return 0
  const ring = [...coords, coords[0]]
  return turfArea(polygon([ring]))
}

export function calcPerimeter(coords) {
  if (coords.length < 3) return 0
  const ring = [...coords, coords[0]]
  return turfLength(lineString(ring), { units: 'meters' })
}

export function makeCircle(center, radiusMeters) {
  return turfCircle(point(center), radiusMeters / 1000, { units: 'kilometers', steps: 64 })
}

export function getMidpoint(a, b) {
  const mid = turfMidpoint(point(a), point(b))
  return mid.geometry.coordinates
}

export function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

export function formatArea(sqMeters) {
  if (sqMeters >= 1_000_000) return `${(sqMeters / 1_000_000).toFixed(2)} km²`
  if (sqMeters >= 10_000) return `${(sqMeters / 10_000).toFixed(2)} ha`
  return `${Math.round(sqMeters)} m²`
}
