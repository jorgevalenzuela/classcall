import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('instructor'))

/**
 * GET /api/attendance/:sessionId
 * Returns all attendance records for the session.
 */
router.get('/:sessionId', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, s.first_name, s.last_name, s.display_alias, s.display_avatar
     FROM attendance a
     JOIN students s ON s.id = a.student_id
     WHERE a.session_id = $1
     ORDER BY s.last_name, s.first_name`,
    [req.params.sessionId]
  )
  res.json(rows)
})

/**
 * PATCH /api/attendance/:sessionId — { student_id, present }
 * Upserts an attendance record (instructor override).
 */
router.patch('/:sessionId', async (req, res) => {
  const { student_id, present } = req.body
  if (!student_id || present === undefined) {
    return res.status(400).json({ error: 'student_id and present are required' })
  }

  const { rows } = await pool.query(
    `INSERT INTO attendance (session_id, student_id, present)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, student_id) DO UPDATE
       SET present = EXCLUDED.present
     RETURNING *`,
    [req.params.sessionId, student_id, present]
  )
  res.json(rows[0])
})

export default router
