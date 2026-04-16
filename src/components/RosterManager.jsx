/**
 * RosterManager — CSV upload + student chip grid (FR-01, FR-09).
 *
 * Chips are visually distinct:
 *   • Blue / active  → student is still in pool (uncalled)
 *   • Gray / muted   → student has been called this session
 */

import { useRef } from 'react'
import { parseCSV } from '../utils/csvParser'

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

export default function RosterManager({ roster, pool, called, loadRoster }) {
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const students = parseCSV(ev.target.result)
      if (students.length > 0) {
        loadRoster(students)
      } else {
        alert('No students found. Check that your CSV has a name, first, or last column.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const poolSet   = new Set(pool)
  const calledSet = new Set(called)
  const inPool    = roster.filter(s => poolSet.has(s.id))
  const wasCalled = roster.filter(s => calledSet.has(s.id))

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Roster</h2>
          {roster.length > 0 && (
            <p className="panel-sub">
              {roster.length} students · {inPool.length} in pool · {wasCalled.length} called
            </p>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
          Upload CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {roster.length === 0 ? (
        <div
          className="upload-area"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = ev => {
                const students = parseCSV(ev.target.result)
                if (students.length > 0) loadRoster(students)
              }
              reader.readAsText(file)
            }
          }}
        >
          <div className="upload-icon">📋</div>
          <p className="upload-title">Drop a CSV or click to upload</p>
          <p className="upload-hint">
            Detects: <code>name</code> column · <code>first</code> + <code>last</code> · first column fallback
          </p>
        </div>
      ) : (
        <>
          <div className="chip-legend">
            <span className="chip chip-pool">● In pool</span>
            <span className="chip chip-called">● Called</span>
          </div>
          {groupByLetter(roster).map(({ letter, students }) => (
            <div key={letter} className="chip-group">
              <div className="chip-group-label">{letter}</div>
              <div className="chip-grid">
                {students.map(student => {
                  const isCalled = calledSet.has(student.id)
                  return (
                    <div
                      key={student.id}
                      className={`chip ${isCalled ? 'chip-called' : 'chip-pool'}`}
                      title={student.name}
                    >
                      {student.name}
                      {isCalled && <span className="chip-check"> ✓</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem' }}>
            <button
              className="btn btn-ghost"
              onClick={() => fileRef.current?.click()}
            >
              Replace roster…
            </button>
          </div>
        </>
      )}
    </div>
  )
}
