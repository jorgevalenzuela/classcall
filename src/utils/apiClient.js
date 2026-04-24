/**
 * Authenticated fetch helper — adds Bearer token from sessionStorage.
 * All paths are relative to /api (proxied to http://localhost:3001 by Vite).
 */

const TOKEN_KEY = 'cc_token'

export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  // Default Content-Type for JSON bodies; CSV uploads set their own
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const res = await fetch(`/api${path}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}
