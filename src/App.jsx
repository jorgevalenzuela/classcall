/**
 * App — tab shell with instructor/student mode toggle (FR-10).
 *
 * The Grade tab is only visible when instructorMode is true.
 * The Leaderboard tab is always visible (student-facing).
 * instructorMode lives in component state only (not persisted) for privacy.
 */

import { useState } from 'react'
import { useClassCall } from './hooks/useClassCall'
import RosterManager  from './components/RosterManager'
import CallPanel      from './components/CallPanel'
import GradePanel     from './components/GradePanel'
import Leaderboard    from './components/Leaderboard'
import SettingsPanel  from './components/SettingsPanel'

const ALL_TABS = [
  { id: 'roster',      label: 'Roster',      instructorOnly: false },
  { id: 'call',        label: 'Call',         instructorOnly: false },
  { id: 'grade',       label: 'Grade',        instructorOnly: true  },
  { id: 'leaderboard', label: 'Leaderboard',  instructorOnly: false },
  { id: 'settings',    label: 'Settings',     instructorOnly: false },
]

export default function App() {
  const state = useClassCall()
  const [tab, setTab] = useState('call')
  const [instructorMode, setInstructorMode] = useState(false)

  const visibleTabs = ALL_TABS.filter(t => !t.instructorOnly || instructorMode)

  // If Grade tab is hidden and we're on it, fall back to Call
  const activeTab = visibleTabs.find(t => t.id === tab) ? tab : 'call'

  function toggleInstructor() {
    const next = !instructorMode
    setInstructorMode(next)
    // If switching away from instructor, leave Grade tab
    if (!next && tab === 'grade') setTab('call')
  }

  return (
    <div className="app">
      {/* ── Header ──────────────────────────────────────────────────────── */}
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
            <span className="header-roster">
              {state.roster.length} students
            </span>
          )}
          <button
            className={`instructor-toggle ${instructorMode ? 'instructor-on' : ''}`}
            onClick={toggleInstructor}
            title={instructorMode ? 'Switch to student view' : 'Switch to instructor view'}
          >
            {instructorMode ? '🔓 Instructor' : '🔒 Student'}
          </button>
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <nav className="tab-bar">
        {visibleTabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'tab-active' : ''} ${t.instructorOnly ? 'tab-instructor' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'grade' && <span className="tab-badge">🔒</span>}
            {t.id === 'call' && state.selected && <span className="tab-dot" />}
          </button>
        ))}
      </nav>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      <main className="app-main">
        {activeTab === 'roster'      && <RosterManager  {...state} />}
        {activeTab === 'call'        && <CallPanel       {...state} instructorMode={instructorMode} />}
        {activeTab === 'grade'       && instructorMode && <GradePanel {...state} />}
        {activeTab === 'leaderboard' && <Leaderboard     {...state} />}
        {activeTab === 'settings'    && <SettingsPanel   {...state} />}
      </main>
    </div>
  )
}
