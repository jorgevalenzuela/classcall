/**
 * CallPanel — random/volunteer selection + inline grading (FR-02, FR-03, FR-04, FR-05, FR-08).
 *
 * Selected student name appears with a pop-in animation (FR-03).
 * Volunteer mode shows a clickable roster of uncalled students (FR-04).
 * Grading buttons are shown inline when instructorMode=true (FR-05, FR-10).
 * Pool mode badge shows current mode (FR-08).
 */

import { useEffect, useRef } from 'react'
import { LIKERT_LABELS, LIKERT_COLORS } from '../utils/scoring'
import { formatVolunteerName } from '../hooks/useClassCall'

export default function CallPanel({
  roster, pool, called, selected, volunteerMode, settings,
  pickRandom, callVolunteer, recordGrade, skipStudent, setVolunteerMode,
  instructorMode,
}) {
  // Re-key the selected div on each new selection to re-trigger animation
  const animRef = useRef(null)
  const prevSelectedId = useRef(null)

  useEffect(() => {
    if (selected && selected.id !== prevSelectedId.current) {
      prevSelectedId.current = selected.id
      if (animRef.current) {
        animRef.current.classList.remove('pop-in')
        void animRef.current.offsetWidth // force reflow
        animRef.current.classList.add('pop-in')
      }
    }
  }, [selected])

  const poolEmpty     = pool.length === 0
  const rosterEmpty   = roster.length === 0
  const uncalledInPool = roster.filter(s => pool.includes(s.id))

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Call</h2>
          {!rosterEmpty && (
            <p className="panel-sub">
              {pool.length} of {roster.length} remaining in pool
            </p>
          )}
        </div>
        <div className="badge-row">
          {!rosterEmpty && (
            <span className={`badge ${poolEmpty ? 'badge-warning' : 'badge-success'}`}>
              {poolEmpty ? 'Pool empty' : `${pool.length} left`}
            </span>
          )}
          {settings.poolMode === 'roundrobin'
            ? <span className="badge badge-info">↻ Round-robin</span>
            : <span className="badge badge-secondary">⏹ Session</span>
          }
        </div>
      </div>

      {/* ── Selected student display ─────────────────────────────────────── */}
      {selected && (
        <div className="selected-wrap" ref={animRef}>
          <div className={`selected-type ${selected.type === 'volunteer' ? 'type-volunteer' : 'type-random'}`}>
            {selected.type === 'volunteer' ? '🙋 Volunteer' : '🎲 Random Pick'}
          </div>
          <div className="selected-name">
            {selected.type === 'volunteer'
              ? formatVolunteerName(selected.name)
              : selected.name}
          </div>

          {/* Instructor: grade inline */}
          {instructorMode && (
            <div className="grade-section">
              <p className="grade-prompt">Grade this response:</p>
              <div className="likert-row">
                {[1, 2, 3, 4, 5].map(score => (
                  <button
                    key={score}
                    className="likert-btn"
                    style={{ '--likert-color': LIKERT_COLORS[score] }}
                    onClick={() => recordGrade(selected.id, score)}
                    title={LIKERT_LABELS[score]}
                  >
                    <span className="likert-num">{score}</span>
                    <span className="likert-lbl">{LIKERT_LABELS[score]}</span>
                  </button>
                ))}
              </div>
              {selected.type === 'random' && (
                <button className="btn btn-ghost" onClick={skipStudent}>
                  Skip
                </button>
              )}
            </div>
          )}

          {/* Student view: just dismiss */}
          {!instructorMode && (
            <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={skipStudent}>
              Next student
            </button>
          )}
        </div>
      )}

      {/* ── Call controls (shown when no one is selected) ────────────────── */}
      {!selected && (
        <div className="call-body">
          {rosterEmpty && (
            <div className="empty-state">
              <p>📋 Upload a roster in the <strong>Roster</strong> tab to begin.</p>
            </div>
          )}

          {!rosterEmpty && (
            <>
              <div className="call-buttons">
                <button
                  className="btn btn-primary btn-xl"
                  onClick={() => { pickRandom(); setVolunteerMode(false) }}
                  disabled={poolEmpty}
                >
                  🎲 Call Random
                </button>

                <button
                  className={`btn btn-xl ${volunteerMode ? 'btn-active' : 'btn-secondary'}`}
                  onClick={() => setVolunteerMode(!volunteerMode)}
                  disabled={poolEmpty}
                >
                  {volunteerMode ? '✕ Cancel' : '🙋 Volunteer'}
                </button>
              </div>

              {poolEmpty && (
                <p className="pool-empty-msg">
                  All students have been called.
                  Go to <strong>Settings</strong> to reset the pool.
                </p>
              )}

              {/* Volunteer student list (FR-04) */}
              {volunteerMode && uncalledInPool.length > 0 && (
                <div className="volunteer-list">
                  <p className="volunteer-hint">Select the student who volunteered:</p>
                  <div className="chip-grid">
                    {uncalledInPool.map(student => (
                      <button
                        key={student.id}
                        className="chip chip-volunteer"
                        onClick={() => callVolunteer(student.id)}
                      >
                        {formatVolunteerName(student.name)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
