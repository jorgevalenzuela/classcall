/**
 * InstructorApp — instructor shell, always in instructor mode.
 * Rendered when the JWT role is 'instructor'.
 *
 * Flow:
 *   1. ClassSelector → instructor picks or creates a class
 *   2. POST /api/sessions to open a session
 *   3. Main shell renders — Attendance tab first, then Call, Grade, etc.
 *
 * attendance Map lives here (not in AttendancePanel) so it survives tab
 * switches. absentIds is derived from attendance via useMemo.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useClassCall } from '../hooks/useClassCall'
import AttendancePanel from '../components/AttendancePanel'
import RosterManager   from '../components/RosterManager'
import CallPanel       from '../components/CallPanel'
import GradePanel      from '../components/GradePanel'
import Leaderboard     from '../components/Leaderboard'
import SettingsPanel   from '../components/SettingsPanel'
import ClassSelector   from './ClassSelector'
import { apiFetch }    from '../utils/apiClient'

const TABS = [
  { id: 'attendance',  label: 'Attendance' },
  { id: 'roster',      label: 'Roster'     },
  { id: 'call',        label: 'Call'       },
  { id: 'grade',       label: 'Grade'      },
  { id: 'leaderboard', label: 'Leaderboard'},
  { id: 'settings',    label: 'Settings'   },
]

function patchAttendance(sessionId, studentId, present) {
  apiFetch(`/attendance/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ student_id: studentId, present }),
  }).catch(() => { /* fail silently — local state is source of truth */ })
}

export default function InstructorApp() {
  const [selectedClass, setSelectedClass] = useState(null)
  const [session,       setSession]       = useState(null)
  const [classId,       setClassId]       = useState(null)
  const [sessionId,     setSessionId]     = useState(null)
  const [tab,           setTab]           = useState('attendance')

  // ── Attendance state — lives here so it survives tab switches ─────────────
  const [attendance, setAttendance] = useState(new Map())  // Map<studentId, boolean>
  const [attendLoadError, setAttendLoadError] = useState('')

  // Load attendance from API when session opens; then poll every 15s
  useEffect(() => {
    if (!sessionId) return

    function fetchAttendance() {
      apiFetch(`/attendance/${sessionId}`)
        .then(rows => {
          setAttendance(prev => {
            const next = new Map(prev)
            for (const row of rows) next.set(row.student_id, Boolean(row.present))
            return next
          })
        })
        .catch(e => setAttendLoadError(e.message))
    }

    fetchAttendance()
    const id = setInterval(fetchAttendance, 15_000)
    return () => clearInterval(id)
  }, [sessionId])

  // Derive absentIds from attendance Map — stable reference via useMemo
  const absentIds = useMemo(() =>
    new Set([...attendance.entries()].filter(([, p]) => !p).map(([id]) => id)),
    [attendance]
  )

  const state = useClassCall({ classId, sessionId, absentIds })

  // Sync roster into attendance map when roster loads (new students default absent)
  useEffect(() => {
    if (state.roster.length === 0) return
    setAttendance(prev => {
      const next = new Map(prev)
      for (const s of state.roster) {
        if (!next.has(s.id)) next.set(s.id, false)
      }
      return next
    })
  }, [state.roster])

  // ── Attendance actions ─────────────────────────────────────────────────────
  const handleOverride = useCallback((studentId, present) => {
    setAttendance(prev => {
      const next = new Map(prev)
      next.set(studentId, present)
      if (sessionId) patchAttendance(sessionId, studentId, present)
      return next
    })
  }, [sessionId])

  const handleMarkAllPresent = useCallback(() => {
    setAttendance(prev => {
      const next = new Map(prev)
      for (const id of next.keys()) {
        next.set(id, true)
        if (sessionId) patchAttendance(sessionId, id, true)
      }
      return next
    })
  }, [sessionId])

  const handleClearAll = useCallback(() => {
    setAttendance(prev => {
      const next = new Map(prev)
      for (const id of next.keys()) {
        next.set(id, false)
        if (sessionId) patchAttendance(sessionId, id, false)
      }
      return next
    })
  }, [sessionId])

  // ── Class / session setup ──────────────────────────────────────────────────
  async function handleClassSelect(cls) {
    try {
      const sess = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({ class_id: cls.id }),
      })
      setSelectedClass(cls)
      setSession(sess)
      setClassId(cls.id)
      setSessionId(sess.id)
    } catch {
      setSelectedClass(cls)
      setClassId(cls.id)
    }
  }

  if (!classId) return <ClassSelector onSelect={handleClassSelect} />

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <svg width="28" height="28" viewBox="0 0 100 100" style={{ borderRadius: 6, flexShrink: 0 }}>
            <rect width="100" height="100" rx="18" fill="#2563eb"/>
            <rect x="28" y="22" width="44" height="56" rx="5" fill="white" opacity="0.95"/>
            <rect x="35" y="32" width="30" height="4" rx="2" fill="#2563eb"/>
            <rect x="35" y="42" width="30" height="4" rx="2" fill="#2563eb"/>
            <rect x="35" y="52" width="20" height="4" rx="2" fill="#2563eb"/>
          </svg>
          <span className="header-title">ClassCall</span>
          {selectedClass && (
            <span className="header-roster">{selectedClass.name}</span>
          )}
        </div>
        <div className="header-right">
          {state.roster.length > 0 && (
            <span className="header-roster">{state.roster.length} students</span>
          )}
          <span className="instructor-toggle instructor-on">🔓 Instructor</span>
        </div>
      </header>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button key={t.id}
            className={`tab-btn ${tab === t.id ? 'tab-active' : ''} ${t.id === 'grade' ? 'tab-instructor' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'grade' && <span className="tab-badge">🔓</span>}
            {t.id === 'call' && state.selected && <span className="tab-dot" />}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'attendance'  && (
          <AttendancePanel
            roster={state.roster}
            session={session}
            attendWindowMinutes={selectedClass?.attend_window_minutes}
            attendance={attendance}
            loadError={attendLoadError}
            onOverride={handleOverride}
            onMarkAllPresent={handleMarkAllPresent}
            onClearAll={handleClearAll}
          />
        )}
        {tab === 'roster'      && <RosterManager  {...state} classId={classId} />}
        {tab === 'call'        && <CallPanel       {...state} instructorMode={true} absentIds={absentIds} />}
        {tab === 'grade'       && <GradePanel      {...state} />}
        {tab === 'leaderboard' && <Leaderboard     {...state} instructorMode={true} />}
        {tab === 'settings'    && <SettingsPanel   {...state} classId={classId} />}
      </main>
    </div>
  )
}
