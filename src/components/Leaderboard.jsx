/**
 * Leaderboard — sorted bar chart, named/anonymous toggle (FR-07, FR-10).
 *
 * • Sorted descending by % score (avg / 5 × 100)
 * • Anonymous mode: names replaced with "Student 1", "Student 2", …
 * • Student-facing: always visible regardless of instructorMode
 * • Students with no grades appear at the bottom as "—"
 */

import { buildLeaderboard, LIKERT_COLORS } from '../utils/scoring'

function scoreColor(pct) {
  if (pct === null) return '#94a3b8'
  if (pct >= 90) return LIKERT_COLORS[5]
  if (pct >= 70) return LIKERT_COLORS[4]
  if (pct >= 50) return LIKERT_COLORS[3]
  if (pct >= 30) return LIKERT_COLORS[2]
  return LIKERT_COLORS[1]
}

export default function Leaderboard({ roster, grades, settings, updateSettings }) {
  const entries = buildLeaderboard(roster, grades)
  const anonymous = settings.lbMode === 'anonymous'

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Leaderboard</h2>
          <p className="panel-sub">Sorted by average score · student-facing</p>
        </div>
        <button
          className={`btn ${anonymous ? 'btn-active' : 'btn-secondary'}`}
          onClick={() =>
            updateSettings({ lbMode: anonymous ? 'named' : 'anonymous' })
          }
          title="Toggle named/anonymous"
        >
          {anonymous ? '👤 Anonymous' : '🏷️ Named'}
        </button>
      </div>

      {roster.length === 0 && (
        <div className="empty-state">Upload a roster to see the leaderboard.</div>
      )}

      {roster.length > 0 && entries.length === 0 && (
        <div className="empty-state">No grades recorded yet.</div>
      )}

      {entries.length > 0 && (
        <div className="lb-list">
          {entries.map((entry, i) => {
            const displayName = anonymous ? `Student ${i + 1}` : entry.name
            const color = scoreColor(entry.pct)
            const barWidth = entry.pct !== null ? `${entry.pct}%` : '0%'

            return (
              <div key={entry.id} className="lb-row">
                <span className="lb-rank">
                  {i === 0 && entry.pct !== null ? '🥇' :
                   i === 1 && entry.pct !== null ? '🥈' :
                   i === 2 && entry.pct !== null ? '🥉' :
                   `#${i + 1}`}
                </span>

                <div className="lb-info">
                  <div className="lb-name-row">
                    <span className="lb-name">{displayName}</span>
                    <span className="lb-meta">
                      {entry.attempts > 0
                        ? `${entry.attempts} grade${entry.attempts !== 1 ? 's' : ''}`
                        : 'not graded'}
                    </span>
                  </div>

                  <div className="lb-bar-track">
                    <div
                      className="lb-bar-fill"
                      style={{ width: barWidth, backgroundColor: color }}
                    />
                  </div>
                </div>

                <span
                  className="lb-score"
                  style={{ color }}
                >
                  {entry.pct !== null ? `${entry.pct}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {entries.length > 0 && (
        <p className="lb-legend">
          Score = average Likert (1–5) expressed as % of maximum.
          {anonymous && ' Names hidden — toggle above to show.'}
        </p>
      )}
    </div>
  )
}
