/**
 * useStudent — student session, profile, and progress state.
 *
 * Manages JWT storage, profile fetch, and progress polling.
 * Token is stored in sessionStorage (cleared on tab close) for security.
 */

import { useState, useEffect, useCallback } from 'react'

const API = '/api'
const TOKEN_KEY = 'cc_student_token'

function getStoredToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}
function storeToken(token) {
  try { sessionStorage.setItem(TOKEN_KEY, token) } catch {}
}
function clearToken() {
  try { sessionStorage.removeItem(TOKEN_KEY) } catch {}
}

async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export function useStudent() {
  const [token,    setToken]    = useState(getStoredToken)
  const [profile,  setProfile]  = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const isLoggedIn = Boolean(token)

  // ── Auth ─────────────────────────────────────────────────────────────────────
  const requestCode = useCallback(async (email) => {
    setLoading(true); setError(null)
    try {
      await apiFetch('/auth/request-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyCode = useCallback(async (email, code) => {
    setLoading(true); setError(null)
    try {
      const { token: jwt, role } = await apiFetch('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })
      storeToken(jwt)
      setToken(jwt)
      return { role }
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setProfile(null)
    setProgress(null)
  }, [])

  // ── Profile ──────────────────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiFetch('/student/profile', {}, token)
      setProfile(data)
      return data
    } catch (e) {
      if (e.message.includes('401') || e.message.includes('Token')) logout()
      setError(e.message)
    }
  }, [token, logout])

  const updateProfile = useCallback(async (patch) => {
    setLoading(true); setError(null)
    try {
      const data = await apiFetch('/student/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }, token)
      setProfile(prev => ({ ...prev, ...data }))
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [token])

  // ── Progress ─────────────────────────────────────────────────────────────────
  const fetchProgress = useCallback(async () => {
    if (!token) return
    try {
      const data = await apiFetch('/student/progress', {}, token)
      setProgress(data)
      return data
    } catch (e) {
      setError(e.message)
    }
  }, [token])

  // ── Attendance ────────────────────────────────────────────────────────────────
  const checkin = useCallback(async (session_id) => {
    setLoading(true); setError(null)
    try {
      return await apiFetch('/student/checkin', {
        method: 'POST',
        body: JSON.stringify({ session_id }),
      }, token)
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [token])

  // ── Submission ────────────────────────────────────────────────────────────────
  const submit = useCallback(async (session_id, content) => {
    setLoading(true); setError(null)
    try {
      return await apiFetch('/student/submit', {
        method: 'POST',
        body: JSON.stringify({ session_id, content }),
      }, token)
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [token])

  // Load profile on token change
  useEffect(() => {
    if (token) fetchProfile()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoggedIn,
    token,
    profile,
    progress,
    loading,
    error,
    requestCode,
    verifyCode,
    logout,
    fetchProfile,
    updateProfile,
    fetchProgress,
    checkin,
    submit,
  }
}
