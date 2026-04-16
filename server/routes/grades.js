import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('instructor'))

/**
 * POST /api/grades — { session_id, student_id, score (0.0–5.0), type }
 * Ties are allowed — no uniqueness check on score.
 */
router.post('/', async (req, res) => {
  const { session_id, student_id, score, type } = req.body

  if (!session_id || !student_id || score === undefined || !type) {
    return res.status(400).json({ error: 'session_id, student_id, score, and type are required' })
  }

  const numericScore = parseFloat(score)
  if (isNaN(numericScore) || numericScore < 0 || numericScore > 5) {
    return res.status(400).json({ error: 'score must be a number between 0.0 and 5.0' })
  }

  const { rows } = await pool.query(
    `INSERT INTO grades (session_id, student_id, score, type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [session_id, student_id, numericScore.toFixed(1), type]
  )
  res.status(201).json(rows[0])
})

export default router
