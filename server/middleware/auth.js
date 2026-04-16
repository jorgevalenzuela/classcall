import jwt from 'jsonwebtoken'
import 'dotenv/config'

/** Attach decoded JWT payload to req.user; reject if missing/invalid. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' })
  }
}

/** Middleware factory — require a specific role. */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
    if (req.user.role !== role) return res.status(403).json({ error: 'Insufficient role' })
    next()
  }
}
