import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Send a 6-digit login code to the student's email address.
 * @param {string} toEmail  - plain-text recipient address
 * @param {string} code     - 6-digit numeric string
 */
export async function sendLoginCode(toEmail, code) {
  if (!process.env.EMAIL_HOST) {
    console.log(`[DEV MODE] Login code for ${toEmail}: ${code}`)
    return
  }
  await transporter.sendMail({
    from:    process.env.SMTP_FROM,
    to:      toEmail,
    subject: `Your ClassCall login code: ${code}`,
    text:    `Your ClassCall login code is: ${code}\n\nThis code expires in 3 minutes and can only be used once.`,
    html:    `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="color:#2563eb">ClassCall</h2>
        <p>Your login code is:</p>
        <p style="font-size:2rem;font-weight:700;letter-spacing:0.15em;color:#1e293b">${code}</p>
        <p style="color:#64748b;font-size:0.9rem">Expires in 3 minutes · single use only</p>
      </div>
    `,
  })
}
