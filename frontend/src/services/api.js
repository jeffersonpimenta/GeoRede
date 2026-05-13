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
