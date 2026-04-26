import { useState, useEffect } from 'react'
import InstructorApp from './InstructorApp'

const TOKEN_KEY = 'cc_token'

function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  return fetch(`/api${path}`, { ...options, headers }).then(async res => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status })
    return data
  })
}

function StudentDashboard() {
  const [status, setStatus] = useState('loading')  // loading | checked-in | window-closed | ip-rejected | no-session | error

  useEffect(() => {
    apiFetch('/student/session')
      .then(session => {
        if (!session) { setStatus('no-session'); return }
        return apiFetch('/student/checkin', {
          method: 'POST',
          body: JSON.stringify({ session_id: session.id }),
        }).then(() => setStatus('checked-in'))
      })
      .catch(err => {
        const msg = err.message || ''
        if (msg.includes('window')) setStatus('window-closed')
        else if (msg.includes('network') || msg.includes('classroom')) setStatus('ip-rejected')
        else setStatus('error')
      })
  }, [])

  const messages = {
    'loading':      { icon: '⏳', text: 'Checking for open session…' },
    'checked-in':   { icon: '✅', text: "You're checked in!" },
    'window-closed':{ icon: '🕐', text: 'Attendance window is closed.' },
    'ip-rejected':  { icon: '🔒', text: 'You must be on the classroom network to check in.' },
    'no-session':   { icon: '📭', text: 'No active class session.' },
    'error':        { icon: '⚠️', text: 'Could not reach the server. Try again.' },
  }

  const { icon, text } = messages[status] ?? messages['error']

  return (
    <div className="student-card">
      <h2 className="panel-title">ClassCall</h2>
      <p style={{ fontSize: '2rem', margin: '1rem 0 0.5rem' }}>{icon}</p>
      <p className="panel-sub">{text}</p>
    </div>
  )
}

export default function StudentApp() {
  const [step,    setStep]    = useState('email')  // email | code | student | instructor
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmail() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setStep('code')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleCode() {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      sessionStorage.setItem(TOKEN_KEY, data.token)
      setStep(data.role === 'instructor' ? 'instructor' : 'student')
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  if (step === 'instructor') return <InstructorApp />
  if (step === 'student')    return <StudentDashboard />

  if (step === 'email') return (
    <div className="student-card">
      <h2 className="panel-title">ClassCall Login</h2>
      <p className="panel-sub">Enter your school email to receive a login code.</p>
      <input className="text-input" type="email" placeholder="you@school.edu"
        value={email} onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && email.includes('@') && handleEmail()} />
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary" disabled={loading || !email.includes('@')} onClick={handleEmail}>
        {loading ? 'Sending…' : 'Send code'}
      </button>
    </div>
  )

  return (
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
      <button className="btn btn-ghost" onClick={() => { setStep('email'); setCode(''); setError('') }}>← Back</button>
    </div>
  )
}
