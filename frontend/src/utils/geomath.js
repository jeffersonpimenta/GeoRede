// ── Constantes WGS84 (≈ SIRGAS 2000) ──────────────────────────
const R = 6371008.8            // raio médio da Terra (m)
const A = 6378137              // semi-eixo maior
const F = 1 / 298.257223563   // achatamento
const E2 = 2 * F - F * F      // excentricidade²
const E_PRIME2 = E2 / (1 - E2)
const K0 = 0.9996             // fator de escala UTM

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

// ── Distância (Haversine) ──────────────────────────────────────
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * RAD
  const dLng = (lng2 - lng1) * RAD
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// points: [[lng, lat], ...]
export function polylineLength(points) {
  const segments = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const d = haversineDistance(points[i - 1][1], points[i - 1][0], points[i][1], points[i][0])
    segments.push(d)
    total += d
  }
  return { total, segments }
}

// ── Área esférica (excesso esférico) ──────────────────────────
// ring: [[lng, lat], ...] anel fechado (primeiro == último)
export function sphericalArea(ring) {
  const n = ring.length
  if (n < 4) return 0 // precisa 3 vértices + fechamento
  let sum = 0
  for (let i = 0; i < n - 1; i++) {
    const lng1 = ring[i][0] * RAD
    const lat1 = ring[i][1] * RAD
    const lng2 = ring[(i + 1) % (n - 1)][0] * RAD
    const lat2 = ring[(i + 1) % (n - 1)][1] * RAD
    sum += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }
  return Math.abs(sum * R * R / 2)
}

// ── Formatação ─────────────────────────────────────────────────
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

export function formatArea(m2) {
  if (m2 < 10000) return `${Math.round(m2)} m²`
  if (m2 < 1000000) return `${(m2 / 10000).toFixed(2)} ha`
  return `${(m2 / 1000000).toFixed(2)} km²`
}

// ── DD (Graus Decimais) ────────────────────────────────────────
export function toDD(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function parseDD(str) {
  const parts = str.split(/[,;\s]+/).filter(Boolean).map(Number)
  if (parts.length < 2 || parts.some(isNaN)) return null
  const [lat, lng] = parts
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

// ── DMS (Graus Minutos Segundos) ───────────────────────────────
function decToDMS(dec, pos, neg) {
  const sign = dec >= 0 ? pos : neg
  const abs = Math.abs(dec)
  const d = Math.floor(abs)
  const mFull = (abs - d) * 60
  const m = Math.floor(mFull)
  const s = ((mFull - m) * 60).toFixed(2)
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(5, '0')}"${sign}`
}

export function toDMS(lat, lng) {
  return {
    lat: decToDMS(lat, 'N', 'S'),
    lng: decToDMS(lng, 'E', 'W'),
  }
}

export function parseDMS(str) {
  // Aceita: "15°46'48.36"S, 47°55'45.12"W" ou "15 46 48.36 S 47 55 45.12 W"
  const re = /(-?\d+)[°d\s]+(\d+)['\s]+(\d+\.?\d*)["\s]*([NSns]?)[,;\s]+(-?\d+)[°d\s]+(\d+)['\s]+(\d+\.?\d*)["\s]*([EWew]?)/
  const m = str.match(re)
  if (!m) return null
  let lat = parseInt(m[1]) + parseInt(m[2]) / 60 + parseFloat(m[3]) / 3600
  let lng = parseInt(m[5]) + parseInt(m[6]) / 60 + parseFloat(m[7]) / 3600
  if (m[4].toUpperCase() === 'S') lat = -lat
  if (m[8].toUpperCase() === 'W') lng = -lng
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

// ── UTM ────────────────────────────────────────────────────────
export function toUTM(lat, lng) {
  const zone = Math.floor((lng + 180) / 6) + 1
  const hemisphere = lat >= 0 ? 'N' : 'S'
  const lngOrigin = (zone - 1) * 6 - 180 + 3

  const latRad = lat * RAD
  const lngRad = (lng - lngOrigin) * RAD

  const sinLat = Math.sin(latRad)
  const cosLat = Math.cos(latRad)
  const tanLat = Math.tan(latRad)

  const N = A / Math.sqrt(1 - E2 * sinLat * sinLat)
  const T = tanLat * tanLat
  const C = E_PRIME2 * cosLat * cosLat
  const Av = lngRad * cosLat

  const M =
    A *
    ((1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256) * latRad -
      (3 * E2 / 8 + 3 * E2 * E2 / 32 + 45 * E2 * E2 * E2 / 1024) * Math.sin(2 * latRad) +
      (15 * E2 * E2 / 256 + 45 * E2 * E2 * E2 / 1024) * Math.sin(4 * latRad) -
      (35 * E2 * E2 * E2 / 3072) * Math.sin(6 * latRad))

  const easting =
    K0 * N * (Av + (1 - T + C) * Av ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_PRIME2) * Av ** 5 / 120) +
    500000

  let northing =
    K0 *
    (M +
      N * tanLat * (Av ** 2 / 2 + (5 - T + 9 * C + 4 * C * C) * Av ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * E_PRIME2) * Av ** 6 / 720))

  if (lat < 0) northing += 10000000

  return {
    zone,
    hemisphere,
    easting: Math.round(easting),
    northing: Math.round(northing),
  }
}

export function formatUTM(lat, lng) {
  const u = toUTM(lat, lng)
  return `${u.zone}${u.hemisphere} ${u.easting}E ${u.northing}N`
}

export function parseUTM(str) {
  // Aceita: "23S 186754E 8254321N" ou "23S 186754 8254321"
  const m = str.match(/(\d{1,2})\s*([NSns])\s+(\d+)\s*E?\s+(\d+)\s*N?/i)
  if (!m) return null

  const zone = parseInt(m[1])
  const south = m[2].toUpperCase() === 'S'
  const easting = parseFloat(m[3])
  let northing = parseFloat(m[4])

  if (zone < 1 || zone > 60) return null
  if (easting < 100000 || easting > 900000) return null

  if (south) northing -= 10000000

  const lngOrigin = (zone - 1) * 6 - 180 + 3

  const M0 = northing / K0
  const mu = M0 / (A * (1 - E2 / 4 - 3 * E2 * E2 / 64 - 5 * E2 * E2 * E2 / 256))

  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2))

  const phi1 =
    mu +
    (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
    (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
    (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
    (1097 * e1 ** 4 / 512) * Math.sin(8 * mu)

  const sinPhi = Math.sin(phi1)
  const cosPhi = Math.cos(phi1)
  const tanPhi = Math.tan(phi1)

  const N1 = A / Math.sqrt(1 - E2 * sinPhi * sinPhi)
  const T1 = tanPhi * tanPhi
  const C1 = E_PRIME2 * cosPhi * cosPhi
  const R1 = (A * (1 - E2)) / (1 - E2 * sinPhi * sinPhi) ** 1.5
  const D = (easting - 500000) / (N1 * K0)

  const lat =
    (phi1 -
      (N1 * tanPhi / R1) *
        (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * E_PRIME2) * D ** 4 / 24 +
          (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * E_PRIME2 - 3 * C1 * C1) * D ** 6 / 720)) *
    DEG

  const lng =
    lngOrigin +
    ((D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * E_PRIME2 + 24 * T1 * T1) * D ** 5 / 120) / cosPhi) *
      DEG

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}
