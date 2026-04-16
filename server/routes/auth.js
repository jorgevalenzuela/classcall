import { Router } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../db/connection.js'
import { hashEmail, generate6DigitCode } from '../services/crypto.js'
import { sendLoginCode } from '../services/email.js'
import 'dotenv/config'

const router = Router()

/**
 * POST /api/auth/request-code
 * Body: { email }
 * Hashes the email, inserts a 6-digit code with 3-min expiry, sends the email.
 */
router.post('/request-code', async (req, res) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' })
  }

  const emailHash = hashEmail(email)
  const code      = generate6DigitCode()
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutes

  await pool.query(
    `INSERT INTO auth_codes (email_hash, code, expires_at) VALUES ($1, $2, $3)`,
    [emailHash, code, expiresAt]
  )

  await sendLoginCode(email.trim(), code)

  res.json({ message: 'Code sent' })
})

/**
 * POST /api/auth/verify-code
 * Body: { email, code }
 * Validates the code, marks it used, returns a signed JWT.
 * Role is determined by whether the email matches an instructor account
 * (for v2: any student in the students table → role 'student'; otherwise 'instructor').
 */
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ error: 'email and code are required' })
  }

  const emailHash = hashEmail(email)

  const { rows } = await pool.query(
    `SELECT id FROM auth_codes
     WHERE email_hash = $1
       AND code = $2
       AND used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [emailHash, code]
  )

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid or expired code' })
  }

  // Mark code used
  await pool.query(`UPDATE auth_codes SET used = TRUE WHERE id = $1`, [rows[0].id])

  // Resolve student identity
  const { rows: students } = await pool.query(
    `SELECT id, class_id, alias_set FROM students WHERE email_hash = $1 LIMIT 1`,
    [emailHash]
  )

  let role = 'instructor'
  let sub  = emailHash
  let extra = {}

  if (students.length > 0) {
    role  = 'student'
    sub   = students[0].id
    extra = { class_id: students[0].class_id, alias_set: students[0].alias_set }
  }

  const token = jwt.sign(
    { sub, role, email_hash: emailHash, ...extra },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )

  res.json({ token, role })
})

export default router
