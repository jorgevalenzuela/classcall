import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth } from '../middleware/auth.js'
import { ferpaStrip } from '../middleware/ferpa.js'

const router = Router()

router.use(requireAuth)

function studentOnly(req, res, next) {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Students only' })
  next()
}

/**
 * GET /api/student/profile
 * Returns the student's own record (PII included — this is their own data).
 */
router.get('/profile', studentOnly, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, class_id, first_name, last_name, display_alias, display_avatar,
            alias_set, participate_mode
     FROM students WHERE id = $1`,
    [req.user.sub]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Student not found' })
  res.json(rows[0])
})

/**
 * PATCH /api/student/profile — { display_alias, display_avatar, participate_mode }
 * First alias/avatar set flips alias_set = TRUE.
 */
router.patch('/profile', studentOnly, async (req, res) => {
  const { display_alias, display_avatar, participate_mode } = req.body
  const { rows } = await pool.query(
    `UPDATE students
     SET display_alias   = COALESCE($1, display_alias),
         display_avatar  = COALESCE($2, display_avatar),
         participate_mode = COALESCE($3, participate_mode),
         alias_set       = CASE WHEN $1 IS NOT NULL THEN TRUE ELSE alias_set END
     WHERE id = $4
     RETURNING id, display_alias, display_avatar, alias_set, participate_mode`,
    [display_alias ?? null, display_avatar ?? null, participate_mode ?? null, req.user.sub]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Student not found' })
  res.json(rows[0])
})

/**
 * GET /api/student/progress
 * Returns personal grade history, personal avg, class avg, and rank.
 * Leaderboard data is alias-only (FERPA).
 */
router.get('/progress', studentOnly, ferpaStrip, async (req, res) => {
  const studentId = req.user.sub

  // Personal grades
  const { rows: grades } = await pool.query(
    `SELECT g.score, g.type, g.created_at, ses.date AS session_date
     FROM grades g
     JOIN sessions ses ON ses.id = g.session_id
     WHERE g.student_id = $1
     ORDER BY g.created_at DESC`,
    [studentId]
  )

  const personal_avg = grades.length
    ? grades.reduce((s, g) => s + parseFloat(g.score), 0) / grades.length
    : null

  // Class avg + rank
  const { rows: classStats } = await pool.query(
    `SELECT student_id,
            AVG(score)::NUMERIC(3,2) AS avg_score
     FROM grades g
     JOIN students s ON s.id = g.student_id
     WHERE s.class_id = $1
     GROUP BY student_id
     ORDER BY avg_score DESC`,
    [req.user.class_id]
  )

  const totalStudents = classStats.length
  const class_avg = totalStudents
    ? classStats.reduce((s, r) => s + parseFloat(r.avg_score), 0) / totalStudents
    : null

  let rank = null
  const myEntry = classStats.findIndex(r => r.student_id === studentId)
  if (myEntry >= 0) {
    const myAvg = parseFloat(classStats[myEntry].avg_score)
    rank = classStats.filter(r => parseFloat(r.avg_score) > myAvg).length + 1
  }

  res.json({ grades, personal_avg, class_avg, rank, total_students: totalStudents })
})

/**
 * POST /api/student/checkin — { session_id }
 * Valid only within the attendance window (opened_at + attend_window_minutes).
 */
router.post('/checkin', studentOnly, async (req, res) => {
  const { session_id } = req.body
  if (!session_id) return res.status(400).json({ error: 'session_id is required' })

  // Verify session is open and within window
  const { rows: sessionRows } = await pool.query(
    `SELECT s.id, s.opened_at, s.closed_at, c.attend_window_minutes
     FROM sessions s
     JOIN classes c ON c.id = s.class_id
     WHERE s.id = $1`,
    [session_id]
  )

  if (sessionRows.length === 0) return res.status(404).json({ error: 'Session not found' })

  const session = sessionRows[0]
  if (!session.opened_at) return res.status(400).json({ error: 'Session not yet open' })
  if (session.closed_at)  return res.status(400).json({ error: 'Session is closed' })

  const windowEnd = new Date(session.opened_at.getTime() + session.attend_window_minutes * 60 * 1000)
  if (new Date() > windowEnd) return res.status(400).json({ error: 'Attendance window has closed' })

  const { rows } = await pool.query(
    `INSERT INTO attendance (session_id, student_id, present, checked_in_at)
     VALUES ($1, $2, TRUE, NOW())
     ON CONFLICT (session_id, student_id) DO UPDATE
       SET present = TRUE, checked_in_at = NOW()
     RETURNING *`,
    [session_id, req.user.sub]
  )
  res.status(201).json(rows[0])
})

/**
 * POST /api/student/submit — { session_id, content }
 * Delegates to the submissions route logic inline.
 */
router.post('/submit', studentOnly, async (req, res) => {
  const { session_id, content } = req.body
  if (!session_id || !content?.trim()) {
    return res.status(400).json({ error: 'session_id and content are required' })
  }

  const studentId = req.user.sub

  const { rows: gradeRows } = await pool.query(
    `SELECT id FROM grades
     WHERE session_id = $1 AND student_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [session_id, studentId]
  )
  const gradeId = gradeRows[0]?.id ?? null

  const { rows } = await pool.query(
    `INSERT INTO submissions (grade_id, student_id, session_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [gradeId, studentId, session_id, content.trim()]
  )
  res.status(201).json(rows[0])
})

export default router
