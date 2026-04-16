import { Router } from 'express'
import pool from '../db/connection.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { hashEmail, encryptEmail } from '../services/crypto.js'

const router = Router()

// All class routes require instructor
router.use(requireAuth, requireRole('instructor'))

/** GET /api/classes */
router.get('/', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM classes ORDER BY created_at DESC`)
  res.json(rows)
})

/** POST /api/classes — { name, section, semester } */
router.post('/', async (req, res) => {
  const { name, section, semester } = req.body
  if (!name) return res.status(400).json({ error: 'name is required' })
  const { rows } = await pool.query(
    `INSERT INTO classes (name, section, semester) VALUES ($1, $2, $3) RETURNING *`,
    [name, section || null, semester || null]
  )
  res.status(201).json(rows[0])
})

/**
 * POST /api/classes/:id/roster
 * Content-Type: text/csv
 * Body: raw CSV with first_name, last_name, email columns.
 * Upserts students by email_hash within the class.
 */
router.post('/:id/roster', async (req, res) => {
  const classId = req.params.id
  const csv = req.body

  if (typeof csv !== 'string' || !csv.trim()) {
    return res.status(400).json({ error: 'CSV body required (Content-Type: text/csv)' })
  }

  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return res.status(400).json({ error: 'CSV must have header + at least one row' })

  const normalize = h => h.toLowerCase().replace(/[^a-z]/g, '')
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim()).map(normalize)

  const firstIdx = headers.findIndex(h => h === 'firstname' || h === 'first')
  const lastIdx  = headers.findIndex(h => h === 'lastname'  || h === 'last')
  const emailIdx = headers.findIndex(h => h === 'email')

  if (emailIdx < 0) return res.status(400).json({ error: 'CSV must contain an email column' })

  const parseRow = line => line.split(',').map(c => c.replace(/^"|"$/g, '').trim())

  const inserted = []
  for (const line of lines.slice(1)) {
    const cols = parseRow(line)
    const email = cols[emailIdx]
    if (!email) continue

    const firstName = firstIdx >= 0 ? (cols[firstIdx] || '') : ''
    const lastName  = lastIdx  >= 0 ? (cols[lastIdx]  || '') : ''
    const emailHash = hashEmail(email)
    const emailEnc  = encryptEmail(email)

    const { rows } = await pool.query(
      `INSERT INTO students (class_id, first_name, last_name, email_hash, email_encrypted)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (class_id, email_hash) DO UPDATE
         SET first_name = EXCLUDED.first_name,
             last_name  = EXCLUDED.last_name
       RETURNING id, first_name, last_name`,
      [classId, firstName, lastName, emailHash, emailEnc]
    )
    inserted.push(rows[0])
  }

  res.status(201).json({ imported: inserted.length, students: inserted })
})

/** PATCH /api/classes/:id/settings — { attend_window_minutes, lockout_time } */
router.patch('/:id/settings', async (req, res) => {
  const { attend_window_minutes, lockout_time } = req.body
  const { rows } = await pool.query(
    `UPDATE classes
     SET attend_window_minutes = COALESCE($1, attend_window_minutes),
         lockout_time          = COALESCE($2, lockout_time)
     WHERE id = $3
     RETURNING *`,
    [attend_window_minutes ?? null, lockout_time ?? null, req.params.id]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Class not found' })
  res.json(rows[0])
})

export default router
