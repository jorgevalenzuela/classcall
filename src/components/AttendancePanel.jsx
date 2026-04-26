/**
 * AttendancePanel — read-only live check-in view.
 *
 * Chips are not clickable; each has a small Override button for manual
 * instructor correction. State lives in InstructorApp and is polled every 15s.
 */

import { useEffect, useState } from 'react'

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

export default function AttendancePanel({
  roster,
  session,
  attendWindowMinutes,
  attendance,       // Map<studentId, boolean>
  loadError,
  onOverride,       // (studentId, present) => void  — manual instructor override
  onMarkAllPresent, // () => void
  onClearAll,       // () => void
}) {
  const minsLeft   = useWindowCountdown(session?.opened_at, attendWindowMinutes)
  const windowOpen = minsLeft !== null && minsLeft > 0
  const presentCount = [...attendance.values()].filter(Boolean).length

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Attendance</h2>
          <p className="panel-sub">{presentCount} of {roster.length} checked in</p>
        </div>

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

      <div className="attendance-actions">
        <button className="btn btn-secondary" onClick={onMarkAllPresent}>Mark all present</button>
        <button className="btn btn-ghost"     onClick={onClearAll}>Clear all</button>
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
                  <div
                    key={student.id}
                    className={`chip ${present ? 'chip-present' : 'chip-absent'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'default' }}
                  >
                    <span className="chip-status">{present ? '✅' : '⚪'}</span>
                    <span style={{ flex: 1 }}>{student.name}</span>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.65rem', padding: '1px 5px', lineHeight: 1.4, marginLeft: '0.15rem' }}
                      title={present ? 'Override: mark absent' : 'Override: mark present'}
                      onClick={() => onOverride(student.id, !present)}
                    >
                      {present ? 'Absent' : 'Present'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
