/**
 * FERPA middleware — strips PII fields from response bodies before they
 * leave the server on student-facing routes.
 *
 * Fields removed: email_encrypted, email_hash, first_name, last_name
 * (Students see only display_alias, display_avatar, and opaque UUIDs.)
 */

const PII_FIELDS = ['email_encrypted', 'email_hash', 'first_name', 'last_name']

function stripPII(obj) {
  if (Array.isArray(obj)) return obj.map(stripPII)
  if (obj && typeof obj === 'object') {
    const clean = {}
    for (const [k, v] of Object.entries(obj)) {
      if (!PII_FIELDS.includes(k)) clean[k] = stripPII(v)
    }
    return clean
  }
  return obj
}

export function ferpaStrip(req, res, next) {
  const originalJson = res.json.bind(res)
  res.json = (data) => originalJson(stripPII(data))
  next()
}
