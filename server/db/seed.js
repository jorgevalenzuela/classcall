// Run once: node server/db/seed.js
// Reads INSTRUCTOR_EMAIL from .env, inserts into instructors table
import { hashEmail, encryptEmail } from '../services/crypto.js'
import pool from './connection.js'
import dotenv from 'dotenv'
dotenv.config()

const { INSTRUCTOR_FIRST, INSTRUCTOR_LAST, INSTRUCTOR_EMAIL } = process.env

if (!INSTRUCTOR_FIRST || !INSTRUCTOR_LAST || !INSTRUCTOR_EMAIL) {
  console.error('Missing required env vars: INSTRUCTOR_FIRST, INSTRUCTOR_LAST, INSTRUCTOR_EMAIL')
  process.exit(1)
}

const result = await pool.query(
  `INSERT INTO instructors (first_name, last_name, email_hash, email_encrypted)
   VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id`,
  [INSTRUCTOR_FIRST, INSTRUCTOR_LAST, hashEmail(INSTRUCTOR_EMAIL), encryptEmail(INSTRUCTOR_EMAIL)]
)
console.log('Instructor seeded:', result.rows[0]?.id ?? 'already exists')
process.exit(0)
