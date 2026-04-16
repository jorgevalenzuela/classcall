import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRouter        from './routes/auth.js'
import classesRouter     from './routes/classes.js'
import sessionsRouter    from './routes/sessions.js'
import attendanceRouter  from './routes/attendance.js'
import gradesRouter      from './routes/grades.js'
import submissionsRouter from './routes/submissions.js'
import studentRouter     from './routes/student.js'

const app  = express()
const PORT = process.env.PORT || 3001

// ── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.text({ type: 'text/csv', limit: '2mb' }))

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRouter)
app.use('/api/classes',     classesRouter)
app.use('/api/sessions',    sessionsRouter)
app.use('/api/attendance',  attendanceRouter)
app.use('/api/grades',      gradesRouter)
app.use('/api/submissions', submissionsRouter)
app.use('/api/student',     studentRouter)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`ClassCall API listening on http://localhost:${PORT}`)
})
