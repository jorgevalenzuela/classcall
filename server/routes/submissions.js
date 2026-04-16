import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

/**
 * POST /api/submissions — { session_id, content }
 * Student submits a written answer. Optionally linked to an existing grade.
 * grade_id is resolved server-side from the most recent grade for this
 * student + session, if one exists.
 */
router.post('/', async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Students only' })
  }

  const { session_id, content } = req.body
  if (!session_id || !content?.trim()) {
    return res.status(400).json({ error: 'session_id and content are required' })
  }

  const studentId = req.user.sub

  // Link to most recent grade for this student/session if available
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
