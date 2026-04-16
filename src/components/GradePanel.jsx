/**
 * GradePanel — instructor-only grade history + re-grade interface (FR-05, FR-10).
 *
 * This tab is hidden from students (controlled by App.jsx instructorMode).
 * Shows: currently selected student (if any) with grade buttons,
 *        followed by the full session grade history.
 */

import { LIKERT_LABELS, LIKERT_COLORS, avgScore } from '../utils/scoring'

function fmt(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function GradePanel({ roster, grades, history, selected, gradeSelected, skipGrade }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Grade</h2>
          <p className="panel-sub">Instructor view · private</p>
        </div>
        <span className="badge badge-warning">🔒 Instructor only</span>
      </div>

      {/* Currently selected student */}
      {selected ? (
        <div className="grade-card">
          <p className="grade-card-label">
            {selected.type === 'volunteer' ? '🙋 Volunteer' : '🎲 Random'} — grade now:
          </p>
          <p className="grade-card-name">{selected.name}</p>
          <div className="likert-row">
            {[1, 2, 3, 4, 5].map(score => (
              <button
                key={score}
                className="likert-btn"
                style={{ '--likert-color': LIKERT_COLORS[score] }}
                onClick={() => gradeSelected(score)}
                title={LIKERT_LABELS[score]}
              >
                <span className="likert-num">{score}</span>
                <span className="likert-lbl">{LIKERT_LABELS[score]}</span>
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={skipGrade}>
            Skip — no grade
          </button>
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
          No student selected. Use the <strong>Call</strong> tab to select one.
        </div>
      )}

      {/* Per-student grade summary */}
      {roster.length > 0 && (
        <div>
          <h3 className="section-title">Student averages</h3>
          <div className="grade-summary-grid">
            {roster.map(student => {
              const g = grades[student.id] || []
              const avg = avgScore(g)
              return (
                <div key={student.id} className="grade-summary-row">
                  <span className="gs-name">{student.name}</span>
                  <span className="gs-count">{g.length} grade{g.length !== 1 ? 's' : ''}</span>
                  {avg !== null ? (
                    <span className="gs-avg" style={{ color: LIKERT_COLORS[Math.round(avg)] }}>
                      {avg.toFixed(1)} — {LIKERT_LABELS[Math.round(avg)]}
                    </span>
                  ) : (
                    <span className="gs-avg gs-none">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Session history */}
      {history.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Session history</h3>
          <div className="history-list">
            {history.map((entry, i) => (
              <div key={i} className="history-row">
                <span className="hist-time">{fmt(entry.ts)}</span>
                <span className={`hist-type ${entry.type === 'volunteer' ? 'type-v' : 'type-r'}`}>
                  {entry.type === 'volunteer' ? '🙋' : '🎲'}
                </span>
                <span className="hist-name">{entry.name}</span>
                <span
                  className="hist-score"
                  style={{ color: LIKERT_COLORS[entry.score] }}
                >
                  {entry.score} — {LIKERT_LABELS[entry.score]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && roster.length === 0 && (
        <div className="empty-state">No grades yet this session.</div>
      )}
    </div>
  )
}
