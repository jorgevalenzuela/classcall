import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireRole('instructor'))

/**
 * POST /api/sessions — { class_id }
 * Opens a new session, sets opened_at to NOW().
 */
router.post('/', async (req, res) => {
  const { class_id } = req.body
  if (!class_id) return res.status(400).json({ error: 'class_id is required' })

  const { rows } = await pool.query(
    `INSERT INTO sessions (class_id, date, opened_at)
     VALUES ($1, CURRENT_DATE, NOW())
     RETURNING *`,
    [class_id]
  )
  res.status(201).json(rows[0])
})

/**
 * PATCH /api/sessions/:id/close
 * Sets closed_at to NOW().
 */
router.patch('/:id/close', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE sessions SET closed_at = NOW()
     WHERE id = $1 AND closed_at IS NULL
     RETURNING *`,
    [req.params.id]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Session not found or already closed' })
  res.json(rows[0])
})

export default router
