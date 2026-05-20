const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, options)
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail || res.statusText)
  }
  return res.json()
}

// ─── Layers ──────────────────────────────────────────────────────────────────
export function getLayers() {
  return apiFetch('/layers')
}

export function getFeature(layerId, featureId) {
  return apiFetch(`/layers/${layerId}/feature/${featureId}`)
}

export function getFeatureByCodId(layerId, codId) {
  return apiFetch(`/layers/${layerId}/feature/by-cod-id/${encodeURIComponent(codId)}`)
}

export function getSubestacaoEnergy(codId) {
  return apiFetch(`/layers/subestacao/energy/${encodeURIComponent(codId)}`)
}

export function getTrafoConsumers(codId) {
  return apiFetch(`/layers/trafo/consumers/${encodeURIComponent(codId)}`)
}

// ─── Enriquecimento (Fase 3) ────────────────────────────────────────────────
export function getSubestacaoDetails(codId) {
  return apiFetch(`/layers/subestacao/details/${encodeURIComponent(codId)}`)
}

export function getTrafoDetails(codId) {
  return apiFetch(`/layers/trafo/details/${encodeURIComponent(codId)}`)
}

export function getCtmtDetails(codId) {
  return apiFetch(`/layers/ctmt/details/${encodeURIComponent(codId)}`)
}

export function getSegconLookup(codId) {
  return apiFetch(`/layers/segcon/lookup/${encodeURIComponent(codId)}`)
}

// ─── Busca global (Fase 5) ──────────────────────────────────────────────────
export function globalSearch(q) {
  return apiFetch(`/search?q=${encodeURIComponent(q)}`)
}

// ─── Dashboard (Fase 4) ─────────────────────────────────────────────────────
export function getDashboardSummary() {
  return apiFetch('/dashboard/summary')
}

export function getEnergyBalance(distribuidora) {
  return apiFetch(`/dashboard/energy-balance/${encodeURIComponent(distribuidora)}`)
}

export function getIndicators(distribuidora) {
  return apiFetch(`/dashboard/indicators/${encodeURIComponent(distribuidora)}`)
}

// ─── Ingestão ─────────────────────────────────────────────────────────────────
export function getDistribuidoras() {
  return apiFetch('/ingestao/distribuidoras')
}

export function iniciarIngestao(body) {
  return apiFetch('/ingestao/iniciar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getStatusIngestao(jobId) {
  return apiFetch(`/ingestao/status/${jobId}`)
}

export function getHistoricoIngestao() {
  return apiFetch('/ingestao/historico')
}
