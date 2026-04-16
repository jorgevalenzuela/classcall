/**
 * useClassCall — all app state + localStorage persistence (FR-06).
 *
 * localStorage keys:
 *   cc_roster   → [{ id, name }]
 *   cc_grades   → { [studentId]: [{ score, ts }] }
 *   cc_pool     → [studentId, ...]
 *   cc_called   → [studentId, ...]
 *   cc_history  → [{ name, score, type, ts }]
 *   cc_settings → { poolMode, lbMode }
 */

import { useState, useEffect, useCallback } from 'react'
import { buildLeaderboard } from '../utils/scoring'

const KEYS = {
  roster:   'cc_roster',
  grades:   'cc_grades',
  pool:     'cc_pool',
  called:   'cc_called',
  history:  'cc_history',
  settings: 'cc_settings',
}

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded — silently ignore */ }
}

export function useClassCall() {
  const [roster,   setRosterRaw]   = useState(() => loadLS(KEYS.roster,   []))
  const [grades,   setGradesRaw]   = useState(() => loadLS(KEYS.grades,   {}))
  const [pool,     setPoolRaw]     = useState(() => loadLS(KEYS.pool,     []))
  const [called,   setCalledRaw]   = useState(() => loadLS(KEYS.called,   []))
  const [history,  setHistoryRaw]  = useState(() => loadLS(KEYS.history,  []))
  const [settings, setSettingsRaw] = useState(() =>
    loadLS(KEYS.settings, { poolMode: 'session', lbMode: 'named' })
  )
  const [selected,      setSelected]      = useState(null) // { id, name, type }
  const [volunteerMode, setVolunteerMode] = useState(false)

  // ── Sync to localStorage on every change ────────────────────────────────────
  useEffect(() => { saveLS(KEYS.roster,   roster)   }, [roster])
  useEffect(() => { saveLS(KEYS.grades,   grades)   }, [grades])
  useEffect(() => { saveLS(KEYS.pool,     pool)     }, [pool])
  useEffect(() => { saveLS(KEYS.called,   called)   }, [called])
  useEffect(() => { saveLS(KEYS.history,  history)  }, [history])
  useEffect(() => { saveLS(KEYS.settings, settings) }, [settings])

  // ── Roster ───────────────────────────────────────────────────────────────────
  /** Replace roster, reset pool to all students, clear session and grades. */
  const loadRoster = useCallback((students) => {
    setRosterRaw(students)
    setGradesRaw({})
    setPoolRaw(students.map(s => s.id))
    setCalledRaw([])
    setHistoryRaw([])
    setSelected(null)
    setVolunteerMode(false)
  }, [])

  // ── Internal helper ──────────────────────────────────────────────────────────
  function _pick(studentId, type, currentPool, currentRoster, currentSettings) {
    const student = currentRoster.find(s => s.id === studentId)
    if (!student) return null

    let newPool = currentPool.filter(id => id !== studentId)

    // Round-robin: refill pool (minus just-called) when exhausted
    if (newPool.length === 0 && currentSettings.poolMode === 'roundrobin') {
      newPool = currentRoster.map(s => s.id).filter(id => id !== studentId)
    }

    setPoolRaw(newPool)
    setCalledRaw(prev => [...prev, studentId])
    setSelected({ ...student, type })
    setVolunteerMode(false)
    return student
  }

  // ── Selection ────────────────────────────────────────────────────────────────
  /** Pick a random student from pool. Returns student object or null if pool is empty. */
  const pickRandom = useCallback(() => {
    if (pool.length === 0) return null
    const idx = Math.floor(Math.random() * pool.length)
    return _pick(pool[idx], 'random', pool, roster, settings)
  }, [pool, roster, settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const callVolunteer = useCallback((studentId) => {
    if (!pool.includes(studentId)) return null
    return _pick(studentId, 'volunteer', pool, roster, settings)
  }, [pool, roster, settings]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Grading ──────────────────────────────────────────────────────────────────
  /** Record a grade for a student by id. Appends to grades map and history. */
  const recordGrade = useCallback((studentId, score) => {
    const student = roster.find(s => s.id === studentId)
    if (!student) return
    const type = (selected && selected.id === studentId) ? selected.type : 'random'
    const entry = { score, ts: Date.now() }
    setGradesRaw(prev => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), entry],
    }))
    setHistoryRaw(prev => [
      { name: student.name, score, type, ts: Date.now() },
      ...prev,
    ])
    setSelected(null)
  }, [roster, selected])

  /** Dismiss selected student without grading. */
  const skipGrade = useCallback(() => {
    setSelected(null)
  }, [])

  // ── Pool management ──────────────────────────────────────────────────────────
  const resetPool = useCallback(() => {
    setPoolRaw(roster.map(s => s.id))
    setCalledRaw([])
    setSelected(null)
    setVolunteerMode(false)
  }, [roster])

  // ── Settings ─────────────────────────────────────────────────────────────────
  const setPoolMode = useCallback((mode) => {
    setSettingsRaw(prev => ({ ...prev, poolMode: mode }))
  }, [])

  const setLbMode = useCallback((mode) => {
    setSettingsRaw(prev => ({ ...prev, lbMode: mode }))
  }, [])

  /** Patch any settings keys — kept for internal component use. */
  const updateSettings = useCallback((patch) => {
    setSettingsRaw(prev => ({ ...prev, ...patch }))
  }, [])

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  /** Returns roster sorted by avg score % descending; ungraded at bottom. */
  const getLeaderboard = useCallback(() => {
    return buildLeaderboard(roster, grades)
  }, [roster, grades])

  // ── Data management ──────────────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
    setRosterRaw([])
    setGradesRaw({})
    setPoolRaw([])
    setCalledRaw([])
    setHistoryRaw([])
    setSettingsRaw({ poolMode: 'session', lbMode: 'named' })
    setSelected(null)
    setVolunteerMode(false)
  }, [])

  const clearGrades = useCallback(() => {
    localStorage.removeItem(KEYS.grades)
    localStorage.removeItem(KEYS.history)
    setGradesRaw({})
    setHistoryRaw([])
  }, [])

  return {
    // State
    roster,
    grades,
    pool,
    called,
    history,
    settings,
    selected,
    volunteerMode,
    // Actions — spec API
    loadRoster,
    pickRandom,
    resetPool,
    recordGrade,
    setPoolMode,
    setLbMode,
    getLeaderboard,
    clearAll,
    // Additional actions used by components
    callVolunteer,
    skipGrade,
    updateSettings,
    clearGrades,
    setVolunteerMode,
  }
}
