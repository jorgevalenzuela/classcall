/**
 * InstructorApp — instructor shell, always in instructor mode.
 * Rendered when the JWT role is 'instructor'.
 * Grade tab is always visible; no mode toggle.
 *
 * Flow:
 *   1. ClassSelector → instructor picks or creates a class (classId)
 *   2. POST /api/sessions to open a session (sessionId)
 *   3. Main shell renders with classId + sessionId in useClassCall
 */

import { useState } from 'react'
import { useClassCall } from '../hooks/useClassCall'
import RosterManager  from '../components/RosterManager'
import CallPanel      from '../components/CallPanel'
import GradePanel     from '../components/GradePanel'
import Leaderboard    from '../components/Leaderboard'
import SettingsPanel  from '../components/SettingsPanel'
import ClassSelector  from './ClassSelector'
import { apiFetch }   from '../utils/apiClient'

const TABS = [
  { id: 'roster',      label: 'Roster'      },
  { id: 'call',        label: 'Call'        },
  { id: 'grade',       label: 'Grade'       },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'settings',    label: 'Settings'    },
]

export default function InstructorApp() {
  const [classId,   setClassId]   = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [tab,       setTab]       = useState('call')

  const state = useClassCall({ classId, sessionId })

  async function handleClassSelect(id) {
    try {
      const session = await apiFetch('/sessions', {
        method: 'POST',
        body: JSON.stringify({ class_id: id }),
      })
      setClassId(id)
      setSessionId(session.id)
    } catch {
      // API failed — still proceed without a session so the app works offline
      setClassId(id)
      setSessionId(null)
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
        {tab === 'roster'      && <RosterManager  {...state} classId={classId} />}
        {tab === 'call'        && <CallPanel       {...state} instructorMode={true} />}
        {tab === 'grade'       && <GradePanel      {...state} />}
        {tab === 'leaderboard' && <Leaderboard     {...state} instructorMode={true} />}
        {tab === 'settings'    && <SettingsPanel   {...state} />}
      </main>
    </div>
  )
}
