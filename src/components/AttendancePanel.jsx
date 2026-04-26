/**
 * AttendancePanel — present/absent toggle per student.
 *
 * - Loads existing attendance via GET /api/attendance/:sessionId on mount.
 * - Toggles via PATCH /api/attendance/:sessionId (fire-and-forget; local state is source of truth).
 * - Shows countdown timer for the attendance window.
 * - Calls onAbsenceChange(absentIds: Set) whenever attendance changes.
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../utils/apiClient'

function groupByLetter(students) {
  const groups = []
  let current = null
  for (const s of students) {
    const letter = s.name[0]?.toUpperCase() || '#'
    if (letter !== current) {
      current = letter
      groups.push({ letter, students: [] })
    }
    groups[groups.length - 1].students.push(s)
  }
  return groups
}

function useWindowCountdown(openedAt, windowMinutes) {
  const [minsLeft, setMinsLeft] = useState(null)

  useEffect(() => {
    if (!openedAt || !windowMinutes) return
    const deadline = new Date(openedAt).getTime() + windowMinutes * 60 * 1000

    function tick() {
      const diff = deadline - Date.now()
      setMinsLeft(diff > 0 ? Math.ceil(diff / 60000) : 0)
    }
    tick()
    const id = setInterval(tick, 10_000)
    return () => clearInterval(id)
  }, [openedAt, windowMinutes])

  return minsLeft
}

function patchAttendance(sessionId, studentId, present) {
  apiFetch(`/attendance/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ student_id: studentId, present }),
  }).catch(() => { /* fail silently — local state is source of truth */ })
}

export default function AttendancePanel({
  roster,
  sessionId,
  session,
  attendWindowMinutes,
  onAbsenceChange,
}) {
  // attendance: Map<studentId, boolean>  (true = present)
  const [attendance, setAttendance] = useState(() =>
    new Map(roster.map(s => [s.id, false]))
  )
  const [loadError, setLoadError] = useState('')

  const minsLeft = useWindowCountdown(session?.opened_at, attendWindowMinutes)
  const windowOpen = minsLeft !== null && minsLeft > 0

  // Load existing attendance from API
  useEffect(() => {
    if (!sessionId) return
    apiFetch(`/attendance/${sessionId}`)
      .then(rows => {
        setAttendance(prev => {
          const next = new Map(prev)
          for (const row of rows) next.set(row.student_id, Boolean(row.present))
          return next
        })
      })
      .catch(e => setLoadError(e.message))
  }, [sessionId])

  // Notify parent whenever attendance map changes
  useEffect(() => {
    const absent = new Set(
      [...attendance.entries()].filter(([, present]) => !present).map(([id]) => id)
    )
    onAbsenceChange(absent)
  }, [attendance, onAbsenceChange])

  const toggle = useCallback((studentId) => {
    setAttendance(prev => {
      const next = new Map(prev)
      const nowPresent = !prev.get(studentId)
      next.set(studentId, nowPresent)
      if (sessionId) patchAttendance(sessionId, studentId, nowPresent)
      return next
    })
  }, [sessionId])

  function markAllPresent() {
    setAttendance(prev => {
      const next = new Map(prev)
      for (const id of next.keys()) {
        next.set(id, true)
        if (sessionId) patchAttendance(sessionId, id, true)
      }
      return next
    })
  }

  function clearAll() {
    setAttendance(prev => {
      const next = new Map(prev)
      for (const id of next.keys()) {
        next.set(id, false)
        if (sessionId) patchAttendance(sessionId, id, false)
      }
      return next
    })
  }

  const presentCount = [...attendance.values()].filter(Boolean).length

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Attendance</h2>
          <p className="panel-sub">
            {presentCount} of {roster.length} present
          </p>
        </div>

        {/* Window indicator */}
        {minsLeft !== null && (
          <span className={`badge ${windowOpen ? 'badge-success' : 'badge-secondary'}`}>
            {windowOpen ? `Window open — ${minsLeft} min remaining` : 'Window closed'}
          </span>
        )}
        {minsLeft === null && attendWindowMinutes && (
          <span className="badge badge-secondary">Window — {attendWindowMinutes} min</span>
        )}
      </div>

      {loadError && <p className="form-error" style={{ marginBottom: '0.75rem' }}>{loadError}</p>}

      {/* Quick actions */}
      <div className="attendance-actions">
        <button className="btn btn-secondary" onClick={markAllPresent}>✅ Mark all present</button>
        <button className="btn btn-ghost" onClick={clearAll}>⚪ Clear all</button>
      </div>

      {roster.length === 0 ? (
        <div className="empty-state">Upload a roster first.</div>
      ) : (
        groupByLetter(roster).map(({ letter, students }) => (
          <div key={letter} className="alpha-row">
            <span className="alpha-label">{letter}</span>
            <div className="roster-grid">
              {students.map(student => {
                const present = attendance.get(student.id) ?? false
                return (
                  <button
                    key={student.id}
                    className={`chip ${present ? 'chip-present' : 'chip-absent'}`}
                    title={present ? 'Mark absent' : 'Mark present'}
                    onClick={() => toggle(student.id)}
                  >
                    <span className="chip-status">{present ? '✅' : '⚪'}</span>
                    {student.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
