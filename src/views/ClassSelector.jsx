/**
 * ClassSelector — shown before the instructor shell.
 * Fetches existing classes and lets the instructor select or create one.
 * Calls onSelect(cls) with the full class object when ready.
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/apiClient'

export default function ClassSelector({ onSelect }) {
  const [classes,  setClasses]  = useState([])
  const [name,     setName]     = useState('')
  const [section,  setSection]  = useState('')
  const [semester, setSemester] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    apiFetch('/classes')
      .then(setClasses)
      .catch(e => setError(e.message))
  }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const cls = await apiFetch('/classes', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), section: section.trim() || null, semester: semester.trim() || null }),
      })
      onSelect(cls)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-card" style={{ maxWidth: 480, margin: '4rem auto' }}>
      <h2 className="panel-title">Select a class</h2>

      {classes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {classes.map(cls => (
            <button key={cls.id} className="btn btn-secondary"
              style={{ display: 'block', width: '100%', marginBottom: '0.5rem', textAlign: 'left' }}
              onClick={() => onSelect(cls)}>
              {cls.name}{cls.section ? ` · ${cls.section}` : ''}{cls.semester ? ` · ${cls.semester}` : ''}
            </button>
          ))}
        </div>
      )}

      <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
      <p className="panel-sub">Or create a new class:</p>

      <input className="text-input" placeholder="Class name *" value={name}
        onChange={e => setName(e.target.value)} />
      <input className="text-input" placeholder="Section (optional)" value={section}
        onChange={e => setSection(e.target.value)} style={{ marginTop: '0.5rem' }} />
      <input className="text-input" placeholder="Semester (optional)" value={semester}
        onChange={e => setSemester(e.target.value)} style={{ marginTop: '0.5rem' }} />

      {error && <p className="form-error">{error}</p>}

      <button className="btn btn-primary" disabled={loading || !name.trim()} onClick={handleCreate}
        style={{ marginTop: '1rem' }}>
        {loading ? 'Creating…' : 'Create & start'}
      </button>
    </div>
  )
}
