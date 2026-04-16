/**
 * StudentApp — Login → Setup → Dashboard / Submit / Checkin
 *
 * Views:
 *   login    — email input → request-code
 *   verify   — 6-digit code input → verify-code → JWT
 *   setup    — alias + avatar picker (forced on first login, alias_set = false)
 *   dashboard — personal score chart, class average, rank
 *   submit   — text answer input (participate_mode = 'written')
 *   checkin  — auto-triggered on login if session open + window active
 */

import { useState, useEffect } from 'react'
import { useStudent } from '../hooks/useStudent'
import InstructorApp from './InstructorApp'

const AVATARS = ['🐶','🐱','🐸','🦊','🐼','🐻','🐨','🦁','🐯','🐺','🦋','🐙']

// ── Sub-views ─────────────────────────────────────────────────────────────────

function LoginView({ onRequestCode, loading, error }) {
  const [email, setEmail] = useState('')
  return (
    <div className="student-card">
      <h2 className="panel-title">ClassCall Login</h2>
      <p className="panel-sub">Enter your school email to receive a login code.</p>
      <input
        className="text-input"
        type="email"
        placeholder="you@school.edu"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onRequestCode(email)}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        disabled={loading || !email.includes('@')}
        onClick={() => onRequestCode(email)}
      >
        {loading ? 'Sending…' : 'Send code'}
      </button>
    </div>
  )
}

function VerifyView({ email, onVerify, onBack, loading, error }) {
  const [code, setCode] = useState('')
  return (
    <div className="student-card">
      <h2 className="panel-title">Enter your code</h2>
      <p className="panel-sub">A 6-digit code was sent to <strong>{email}</strong>. It expires in 3 minutes.</p>
      <input
        className="text-input text-input-code"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && code.length === 6 && onVerify(code)}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        disabled={loading || code.length !== 6}
        onClick={() => onVerify(code)}
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>
      <button className="btn btn-ghost" onClick={onBack}>← Back</button>
    </div>
  )
}

function SetupView({ onSave, loading, error }) {
  const [alias,  setAlias]  = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  return (
    <div className="student-card">
      <h2 className="panel-title">Set up your profile</h2>
      <p className="panel-sub">Choose a display alias and avatar. This is what classmates see on the leaderboard.</p>

      <label className="form-label">Display alias</label>
      <input
        className="text-input"
        type="text"
        maxLength={30}
        placeholder="e.g. CosmicCoder"
        value={alias}
        onChange={e => setAlias(e.target.value)}
      />

      <label className="form-label" style={{ marginTop: '1rem' }}>Avatar</label>
      <div className="avatar-grid">
        {AVATARS.map(a => (
          <button
            key={a}
            className={`avatar-btn ${avatar === a ? 'avatar-selected' : ''}`}
            onClick={() => setAvatar(a)}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        disabled={loading || !alias.trim()}
        onClick={() => onSave({ display_alias: alias.trim(), display_avatar: avatar })}
        style={{ marginTop: '1rem' }}
      >
        {loading ? 'Saving…' : 'Save and continue'}
      </button>
    </div>
  )
}

function DashboardView({ profile, progress, onRefresh }) {
  useEffect(() => { onRefresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            {profile?.display_avatar} {profile?.display_alias}
          </h2>
          <p className="panel-sub">Your progress this semester</p>
        </div>
      </div>

      {progress ? (
        <>
          <div className="progress-stats">
            <div className="stat-card">
              <span className="stat-value">
                {progress.personal_avg != null ? progress.personal_avg.toFixed(2) : '—'}
              </span>
              <span className="stat-label">Your avg</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {progress.class_avg != null ? progress.class_avg.toFixed(2) : '—'}
              </span>
              <span className="stat-label">Class avg</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {progress.rank != null ? `#${progress.rank}` : '—'}
              </span>
              <span className="stat-label">
                Rank of {progress.total_students}
              </span>
            </div>
          </div>

          {progress.grades.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="section-title">Recent grades</h3>
              <div className="history-list">
                {progress.grades.slice(0, 10).map((g, i) => (
                  <div key={i} className="history-row">
                    <span className="hist-time">
                      {new Date(g.session_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="hist-score">{parseFloat(g.score).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">Loading your progress…</div>
      )}
    </div>
  )
}

function SubmitView({ onSubmit, loading, error }) {
  const [sessionId, setSessionId] = useState('')
  const [content,   setContent]   = useState('')
  const [done,      setDone]      = useState(false)

  if (done) {
    return (
      <div className="student-card">
        <p style={{ fontSize: '2rem', textAlign: 'center' }}>✅</p>
        <p className="panel-sub" style={{ textAlign: 'center' }}>Answer submitted!</p>
        <button className="btn btn-secondary" onClick={() => { setDone(false); setContent('') }}>
          Submit another
        </button>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2 className="panel-title">Submit Answer</h2>
      <p className="panel-sub">Type your written response below.</p>
      <input
        className="text-input"
        type="text"
        placeholder="Session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
        style={{ marginBottom: '0.5rem' }}
      />
      <textarea
        className="text-input"
        rows={5}
        placeholder="Your answer…"
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{ resize: 'vertical' }}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        disabled={loading || !content.trim() || !sessionId.trim()}
        onClick={async () => {
          await onSubmit(sessionId.trim(), content.trim())
          setDone(true)
        }}
      >
        {loading ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  )
}

function CheckinView({ onCheckin, loading, error }) {
  const [sessionId, setSessionId] = useState('')
  const [done,      setDone]      = useState(false)

  if (done) {
    return (
      <div className="student-card">
        <p style={{ fontSize: '2rem', textAlign: 'center' }}>✅</p>
        <p className="panel-sub" style={{ textAlign: 'center' }}>Attendance marked!</p>
      </div>
    )
  }

  return (
    <div className="student-card">
      <h2 className="panel-title">Check In</h2>
      <p className="panel-sub">Enter today's session ID to mark your attendance.</p>
      <input
        className="text-input"
        type="text"
        placeholder="Session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button
        className="btn btn-primary"
        disabled={loading || !sessionId.trim()}
        onClick={async () => {
          await onCheckin(sessionId.trim())
          setDone(true)
        }}
      >
        {loading ? 'Checking in…' : 'Check in'}
      </button>
    </div>
  )
}

// ── Main StudentApp ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'checkin',   label: '✅ Check In'  },
  { id: 'submit',    label: '✏️ Submit'    },
]

export default function StudentApp() {
  const {
    isLoggedIn, profile, progress, loading, error,
    requestCode, verifyCode, logout,
    updateProfile, fetchProgress,
    checkin, submit,
  } = useStudent()

  const [view,  setView]  = useState('login')   // login | verify | setup | app
  const [email, setEmail] = useState('')
  const [tab,   setTab]   = useState('dashboard')
  const [role,  setRole]  = useState(null)

  // Determine initial view after login (student path)
  useEffect(() => {
    if (isLoggedIn && profile && role === 'student') {
      setView(profile.alias_set ? 'app' : 'setup')
    }
  }, [isLoggedIn, profile, role])

  async function handleRequestCode(em) {
    await requestCode(em)
    setEmail(em)
    setView('verify')
  }

  async function handleVerify(code) {
    const { role: resolvedRole } = await verifyCode(email, code)
    setRole(resolvedRole)
    if (resolvedRole === 'instructor') setView('instructor')
    // student path: useEffect above handles view transition once profile loads
  }

  async function handleSetup(patch) {
    await updateProfile(patch)
    setView('app')
  }

  if (view === 'instructor') return <InstructorApp />
  if (view === 'verify') {
    return (
      <VerifyView
        email={email}
        onVerify={handleVerify}
        onBack={() => setView('login')}
        loading={loading}
        error={error}
      />
    )
  }
  if (view === 'setup') {
    return <SetupView onSave={handleSetup} loading={loading} error={error} />
  }
  if (!isLoggedIn || view === 'login') {
    return <LoginView onRequestCode={handleRequestCode} loading={loading} error={error} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-title">ClassCall</span>
        </div>
        <div className="header-right">
          {profile && (
            <span className="header-roster">
              {profile.display_avatar} {profile.display_alias}
            </span>
          )}
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <nav className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'dashboard' && (
          <DashboardView profile={profile} progress={progress} onRefresh={fetchProgress} />
        )}
        {tab === 'checkin' && (
          <CheckinView onCheckin={checkin} loading={loading} error={error} />
        )}
        {tab === 'submit' && (
          <SubmitView onSubmit={submit} loading={loading} error={error} />
        )}
      </main>
    </div>
  )
}
