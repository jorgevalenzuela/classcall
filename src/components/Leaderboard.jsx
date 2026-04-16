/**
 * Leaderboard — alias + avatar mode, tied ranks (FR-07, FR-10).
 *
 * • Student-facing: shows display_avatar + display_alias (or "Student N" fallback)
 * • Instructor-facing: shows real first_name + last_name
 * • Ties: same score = same rank; next rank skips (1, 2, 2, 4)
 * • Sort: score DESC, then alias/name ASC for tie-breaking display
 */

import { LIKERT_COLORS } from '../utils/scoring'

function scoreColor(pct) {
  if (pct === null) return '#94a3b8'
  if (pct >= 90) return LIKERT_COLORS[5]
  if (pct >= 70) return LIKERT_COLORS[4]
  if (pct >= 50) return LIKERT_COLORS[3]
  if (pct >= 30) return LIKERT_COLORS[2]
  return LIKERT_COLORS[1]
}

function rankMedal(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

function assignRanks(entries) {
  const ranked = []
  let currentRank = 1
  for (let i = 0; i < entries.length; i++) {
    if (i === 0 || entries[i].pct !== entries[i - 1].pct) {
      currentRank = i + 1
    }
    ranked.push({ ...entries[i], rank: entries[i].pct !== null ? currentRank : null })
  }
  return ranked
}

export default function Leaderboard({ roster, settings, getLeaderboard, setLbMode, instructorMode }) {
  const rawEntries = getLeaderboard()
  const aliasMode  = settings.lbMode === 'anonymous'

  // Secondary sort: score DESC already from getLeaderboard; tie-break by display name ASC
  const sorted = rawEntries.slice().sort((a, b) => {
    if (a.pct !== b.pct) return (b.pct ?? -1) - (a.pct ?? -1)
    const nameA = aliasMode ? (a.alias || a.name) : a.name
    const nameB = aliasMode ? (b.alias || b.name) : b.name
    return nameA.localeCompare(nameB)
  })

  const entries = assignRanks(sorted)

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Leaderboard</h2>
          <p className="panel-sub">Sorted by average score · student-facing</p>
        </div>
        <button
          className={`btn ${aliasMode ? 'btn-active' : 'btn-secondary'}`}
          onClick={() => setLbMode(aliasMode ? 'named' : 'anonymous')}
          title="Toggle alias/named mode"
        >
          {aliasMode ? '👤 Alias' : '🏷️ Named'}
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
          {entries.map(entry => {
            // Student-facing: avatar + alias. Instructor-facing: real name.
            const displayName = aliasMode && !instructorMode
              ? `${entry.avatar ? entry.avatar + ' ' : ''}${entry.alias || entry.name}`
              : entry.name

            const color    = scoreColor(entry.pct)
            const barWidth = entry.pct !== null ? `${entry.pct}%` : '0%'
            const rank     = entry.rank

            return (
              <div key={entry.id} className="lb-row">
                <span className="lb-rank">
                  {rank !== null ? rankMedal(rank) : '—'}
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

                <span className="lb-score" style={{ color }}>
                  {entry.pct !== null ? `${entry.pct}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {entries.length > 0 && (
        <p className="lb-legend">
          Score = average (0–5) expressed as % of maximum.
          {aliasMode && !instructorMode && ' Aliases shown — instructor can toggle to real names.'}
        </p>
      )}
    </div>
  )
}
