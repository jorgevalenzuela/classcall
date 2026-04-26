/**
 * InstructorApp — instructor shell, always in instructor mode.
 * Rendered when the JWT role is 'instructor'.
 *
 * Flow:
 *   1. ClassSelector → instructor picks or creates a class
 *   2. POST /api/sessions to open a session
 *   3. Main shell renders — Attendance tab first, then Call, Grade, etc.
 */

import { useState, useCallback } from 'react'
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

export default function InstructorApp() {
  const [selectedClass, setSelectedClass] = useState(null)  // full class object
  const [session,       setSession]       = useState(null)   // full session object
  const [classId,       setClassId]       = useState(null)
  const [sessionId,     setSessionId]     = useState(null)
  const [absentIds,     setAbsentIds]     = useState(new Set())
  const [tab,           setTab]           = useState('attendance')

  const state = useClassCall({ classId, sessionId, absentIds })

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
      // API failed — still let the app run offline
      setSelectedClass(cls)
      setClassId(cls.id)
    }
  }

  const handleAbsenceChange = useCallback((newAbsentIds) => {
    setAbsentIds(newAbsentIds)
  }, [])

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
            sessionId={sessionId}
            session={session}
            attendWindowMinutes={selectedClass?.attend_window_minutes}
            onAbsenceChange={handleAbsenceChange}
          />
        )}
        {tab === 'roster'      && <RosterManager  {...state} classId={classId} />}
        {tab === 'call'        && <CallPanel       {...state} instructorMode={true} absentIds={absentIds} />}
        {tab === 'grade'       && <GradePanel      {...state} />}
        {tab === 'leaderboard' && <Leaderboard     {...state} instructorMode={true} />}
        {tab === 'settings'    && <SettingsPanel   {...state} />}
      </main>
    </div>
  )
}
