/**
 * Score calculation helpers (FR-05, FR-07).
 */

export const LIKERT_LABELS = {
  1: 'Needs Growth',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
}

export const LIKERT_COLORS = {
  1: '#dc2626',
  2: '#d97706',
  3: '#ca8a04',
  4: '#16a34a',
  5: '#2563eb',
}

/** Average raw score (1–5) for a student's grade array. */
export function avgScore(grades) {
  if (!grades || grades.length === 0) return null
  return grades.reduce((sum, g) => sum + g.score, 0) / grades.length
}

/** Percentage of max (5) for display in leaderboard bars. */
export function pctScore(grades) {
  const avg = avgScore(grades)
  if (avg === null) return null
  return Math.round((avg / 5) * 100)
}

/** Build sorted leaderboard entries from roster + grades map. */
export function buildLeaderboard(roster, grades) {
  return roster
    .map((student, idx) => {
      const g = grades[student.id] || []
      const pct = pctScore(g)
      const avg = avgScore(g)
      return {
        id: student.id,
        name: student.name,
        pct,
        avg,
        attempts: g.length,
        rank: idx, // filled after sort
      }
    })
    .sort((a, b) => {
      // Graded students first, sorted by pct desc; ungraded at bottom
      if (a.pct === null && b.pct === null) return 0
      if (a.pct === null) return 1
      if (b.pct === null) return -1
      return b.pct - a.pct
    })
    .map((entry, i) => ({ ...entry, rank: i + 1 }))
}
