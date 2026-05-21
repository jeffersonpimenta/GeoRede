import proj4 from 'proj4'

// --- UTM helpers ---

function utmZone(lng) {
  return Math.floor((lng + 180) / 6) + 1
}

function utmBand(lat) {
  const bands = 'CDEFGHJKLMNPQRSTUVWX'
  if (lat < -80 || lat > 84) return ''
  return bands[Math.floor((lat + 80) / 8)]
}

function utmProj(zone, south) {
  return `+proj=utm +zone=${zone} ${south ? '+south' : ''} +datum=WGS84 +units=m +no_defs`
}

// --- Formatters (DD → display string) ---

export function formatDD(lng, lat) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export function formatDMS(lng, lat) {
  function toDMS(val, pos, neg) {
    const dir = val >= 0 ? pos : neg
    val = Math.abs(val)
    const d = Math.floor(val)
    const mFloat = (val - d) * 60
    const m = Math.floor(mFloat)
    const s = ((mFloat - m) * 60).toFixed(1)
    return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(4, '0')}"${dir}`
  }
  return `${toDMS(lat, 'N', 'S')}, ${toDMS(lng, 'E', 'W')}`
}

export function formatDDM(lng, lat) {
  function toDDM(val, pos, neg) {
    const dir = val >= 0 ? pos : neg
    val = Math.abs(val)
    const d = Math.floor(val)
    const m = ((val - d) * 60).toFixed(4)
    return `${d}°${m}'${dir}`
  }
  return `${toDDM(lat, 'N', 'S')}, ${toDDM(lng, 'E', 'W')}`
}

export function formatUTM(lng, lat) {
  const zone = utmZone(lng)
  const band = utmBand(lat)
  const south = lat < 0
  const [easting, northing] = proj4('EPSG:4326', utmProj(zone, south), [lng, lat])
  return `${zone}${band} ${easting.toFixed(2)} ${northing.toFixed(2)}`
}

// --- Parsers (user input → {lng, lat} or null) ---

function clamp(lat, lng) {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lng, lat }
}

export function parseDD(str) {
  str = str.trim()

  // Try: lat, lng with optional NSEW
  const re = /^([+-]?\d+\.?\d*)\s*([NSns])?\s*[,;\s]+\s*([+-]?\d+\.?\d*)\s*([EWew])?$/
  const m = str.match(re)
  if (m) {
    let lat = parseFloat(m[1])
    let lng = parseFloat(m[3])
    if (m[2] && /[sS]/.test(m[2])) lat = -Math.abs(lat)
    if (m[4] && /[wW]/.test(m[4])) lng = -Math.abs(lng)
    return clamp(lat, lng)
  }
  return null
}

export function parseDMS(str) {
  str = str.trim()
  const part = /(\d+)\s*°\s*(\d+)\s*[''′]\s*(\d+\.?\d*)\s*["″]?\s*([NSEWnsew])/g
  const parts = []
  let match
  while ((match = part.exec(str)) !== null) {
    const d = parseInt(match[1])
    const m = parseInt(match[2])
    const s = parseFloat(match[3])
    const dir = match[4].toUpperCase()
    let val = d + m / 60 + s / 3600
    if (dir === 'S' || dir === 'W') val = -val
    parts.push({ val, dir })
  }
  if (parts.length !== 2) return null

  let lat, lng
  if ('NS'.includes(parts[0].dir)) {
    lat = parts[0].val
    lng = parts[1].val
  } else {
    lng = parts[0].val
    lat = parts[1].val
  }
  return clamp(lat, lng)
}

export function parseDDM(str) {
  str = str.trim()
  const part = /(\d+)\s*°\s*(\d+\.?\d*)\s*[''′]?\s*([NSEWnsew])/g
  const parts = []
  let match
  while ((match = part.exec(str)) !== null) {
    const d = parseInt(match[1])
    const m = parseFloat(match[2])
    const dir = match[3].toUpperCase()
    let val = d + m / 60
    if (dir === 'S' || dir === 'W') val = -val
    parts.push({ val, dir })
  }
  if (parts.length !== 2) return null

  let lat, lng
  if ('NS'.includes(parts[0].dir)) {
    lat = parts[0].val
    lng = parts[1].val
  } else {
    lng = parts[0].val
    lat = parts[1].val
  }
  return clamp(lat, lng)
}

export function parseUTM(str) {
  str = str.trim()
  const re = /^(\d{1,2})\s*([C-Xc-x])\s+(\d+\.?\d*)\s+(\d+\.?\d*)$/
  const m = str.match(re)
  if (!m) return null

  const zone = parseInt(m[1])
  const band = m[2].toUpperCase()
  const easting = parseFloat(m[3])
  const northing = parseFloat(m[4])

  if (zone < 1 || zone > 60) return null

  const south = band < 'N'
  const [lng, lat] = proj4(utmProj(zone, south), 'EPSG:4326', [easting, northing])
  return clamp(lat, lng)
}
