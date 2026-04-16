import { useState } from 'react'
import { useStudent } from '../hooks/useStudent'
import InstructorApp from './InstructorApp'

const AVATARS = ['🐶','🐱','🐸','🦊','🐼','🐻','🐨','🦁','🐯','🐺','🦋','🐙']

export default function StudentApp() {
  const { requestCode, verifyCode, updateProfile, fetchProgress,
          checkin, submit, logout, profile, progress, loading, error } = useStudent()

  const [step,   setStep]   = useState('email')  // email | code | setup | student | instructor
  const [email,  setEmail]  = useState('')
  const [code,   setCode]   = useState('')
  const [tab,    setTab]    = useState('dashboard')
  const [alias,  setAlias]  = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])

  async function handleEmail() {
    await requestCode(email)
    setStep('code')
  }

  async function handleCode() {
    const { role } = await verifyCode(email, code)
    if (role === 'instructor') { setStep('instructor'); return }
    const p = await fetch('/api/student/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('cc_student_token') || sessionStorage.getItem('cc_student_token')}` }
    }).then(r => r.json())
    setStep(p.alias_set ? 'student' : 'setup')
  }

  async function handleSetup() {
    await updateProfile({ display_alias: alias.trim(), display_avatar: avatar })
    setStep('student')
  }

  if (step === 'instructor') return <InstructorApp />

  if (step === 'email') return (
    <div className="student-card">
      <h2 className="panel-title">ClassCall Login</h2>
      <p className="panel-sub">Enter your school email to receive a login code.</p>
      <input className="text-input" type="email" placeholder="you@school.edu"
        value={email} onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleEmail()} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || !email.includes('@')} onClick={handleEmail}>
        {loading ? 'Sending…' : 'Send code'}
      </button>
    </div>
  )

  if (step === 'code') return (
    <div className="student-card">
      <h2 className="panel-title">Enter your code</h2>
      <p className="panel-sub">Sent to <strong>{email}</strong> — expires in 3 minutes.</p>
      <input className="text-input text-input-code" type="text" inputMode="numeric"
        maxLength={6} placeholder="123456" value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleCode()} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || code.length !== 6} onClick={handleCode}>
        {loading ? 'Verifying…' : 'Verify'}
      </button>
      <button className="btn btn-ghost" onClick={() => { setStep('email'); setCode('') }}>← Back</button>
    </div>
  )

  if (step === 'setup') return (
    <div className="student-card">
      <h2 className="panel-title">Set up your profile</h2>
      <p className="panel-sub">Choose an alias and avatar for the leaderboard.</p>
      <input className="text-input" type="text" maxLength={30} placeholder="e.g. CosmicCoder"
        value={alias} onChange={e => setAlias(e.target.value)} />
      <div className="avatar-grid">
        {AVATARS.map(a => (
          <button key={a} className={`avatar-btn ${avatar === a ? 'avatar-selected' : ''}`}
            onClick={() => setAvatar(a)}>{a}</button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || !alias.trim()} onClick={handleSetup}
        style={{ marginTop: '1rem' }}>
        {loading ? 'Saving…' : 'Continue'}
      </button>
    </div>
  )

  // Student dashboard
  return (
    <div className="app">
      <header className="app-header">
        <span className="header-title">ClassCall</span>
        <div className="header-right">
          {profile && <span className="header-roster">{profile.display_avatar} {profile.display_alias}</span>}
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      <nav className="tab-bar">
        {['dashboard','checkin','submit'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'tab-active' : ''}`}
            onClick={() => { setTab(t); if (t === 'dashboard') fetchProgress() }}>
            {t === 'dashboard' ? '📊 Dashboard' : t === 'checkin' ? '✅ Check In' : '✏️ Submit'}
          </button>
        ))}
      </nav>
      <main className="app-main">
        {tab === 'dashboard' && <Dashboard progress={progress} profile={profile} onMount={fetchProgress} />}
        {tab === 'checkin'   && <Checkin onCheckin={checkin} loading={loading} error={error} />}
        {tab === 'submit'    && <Submit  onSubmit={submit}   loading={loading} error={error} />}
      </main>
    </div>
  )
}

function Dashboard({ progress, profile, onMount }) {
  useState(() => { onMount() }) // run once on mount
  return (
    <div className="panel">
      <h2 className="panel-title">{profile?.display_avatar} {profile?.display_alias}</h2>
      {progress ? (
        <>
          <div className="progress-stats">
            <div className="stat-card">
              <span className="stat-value">{progress.personal_avg?.toFixed(2) ?? '—'}</span>
              <span className="stat-label">Your avg</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{progress.class_avg?.toFixed(2) ?? '—'}</span>
              <span className="stat-label">Class avg</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{progress.rank != null ? `#${progress.rank}` : '—'}</span>
              <span className="stat-label">Rank of {progress.total_students}</span>
            </div>
          </div>
          {progress.grades?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className="section-title">Recent grades</h3>
              <div className="history-list">
                {progress.grades.slice(0, 10).map((g, i) => (
                  <div key={i} className="history-row">
                    <span className="hist-time">{new Date(g.session_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span className="hist-score">{parseFloat(g.score).toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : <div className="empty-state">Loading…</div>}
    </div>
  )
}

function Checkin({ onCheckin, loading, error }) {
  const [sessionId, setSessionId] = useState('')
  const [done, setDone] = useState(false)
  if (done) return <div className="student-card"><p style={{textAlign:'center',fontSize:'2rem'}}>✅</p><p className="panel-sub" style={{textAlign:'center'}}>Attendance marked!</p></div>
  return (
    <div className="student-card">
      <h2 className="panel-title">Check In</h2>
      <input className="text-input" placeholder="Session ID" value={sessionId} onChange={e => setSessionId(e.target.value)} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || !sessionId.trim()}
        onClick={async () => { await onCheckin(sessionId.trim()); setDone(true) }}>
        {loading ? 'Checking in…' : 'Check in'}
      </button>
    </div>
  )
}

function Submit({ onSubmit, loading, error }) {
  const [sessionId, setSessionId] = useState('')
  const [content,   setContent]   = useState('')
  const [done, setDone] = useState(false)
  if (done) return <div className="student-card"><p style={{textAlign:'center',fontSize:'2rem'}}>✅</p><p className="panel-sub" style={{textAlign:'center'}}>Submitted!</p><button className="btn btn-secondary" onClick={() => { setDone(false); setContent('') }}>Submit another</button></div>
  return (
    <div className="panel">
      <h2 className="panel-title">Submit Answer</h2>
      <input className="text-input" placeholder="Session ID" value={sessionId}
        onChange={e => setSessionId(e.target.value)} style={{ marginBottom: '0.5rem' }} />
      <textarea className="text-input" rows={5} placeholder="Your answer…"
        value={content} onChange={e => setContent(e.target.value)} style={{ resize: 'vertical' }} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || !content.trim() || !sessionId.trim()}
        onClick={async () => { await onSubmit(sessionId.trim(), content.trim()); setDone(true) }}>
        {loading ? 'Submitting…' : 'Submit'}
      </button>
    </div>
  )
}
