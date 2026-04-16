import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-cbc'

function getKey() {
  const hex = process.env.EMAIL_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) throw new Error('EMAIL_ENCRYPTION_KEY must be 64 hex chars (256-bit)')
  return Buffer.from(hex, 'hex')
}

/** SHA-256 hash of a normalised email — used as lookup key. */
export function hashEmail(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

/** AES-256-CBC encrypt — returns "iv:ciphertext" as hex. */
export function encryptEmail(email) {
  const key = getKey()
  const iv  = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(email, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/** AES-256-CBC decrypt — accepts "iv:ciphertext" hex string. */
export function decryptEmail(stored) {
  const [ivHex, ctHex] = stored.split(':')
  if (!ivHex || !ctHex) throw new Error('Invalid encrypted email format')
  const key = getKey()
  const iv  = Buffer.from(ivHex, 'hex')
  const ct  = Buffer.from(ctHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}

/** Generate a random 6-digit numeric code. */
export function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}
