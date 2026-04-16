/**
 * CSV parser with flexible column detection (FR-01).
 *
 * Detection priority:
 *  1. Single "name" / "full name" / "student name" column
 *  2. Separate "first" + "last" columns (combined as "First Last")
 *  3. First column only (no header match)
 *
 * Returns: [{ id: string, name: string }]
 */

function parseCSVLine(line) {
  const cols = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  cols.push(current.trim())
  return cols
}

function normalize(h) {
  return h.toLowerCase().replace(/[^a-z]/g, '')
}

export function parseCSV(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const rawHeaders = parseCSVLine(lines[0])
  const headers = rawHeaders.map(normalize)

  // Column index detection
  const nameIdx = headers.findIndex(h =>
    h === 'name' || h === 'fullname' || h === 'studentname' || h === 'studentfullname'
  )
  const firstIdx = headers.findIndex(h =>
    h === 'first' || h === 'firstname' || h === 'givenname'
  )
  const lastIdx = headers.findIndex(h =>
    h === 'last' || h === 'lastname' || h === 'surname' || h === 'familyname'
  )

  const students = []

  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    let name

    if (nameIdx >= 0) {
      name = cols[nameIdx] || ''
    } else if (firstIdx >= 0 && lastIdx >= 0) {
      const first = cols[firstIdx] || ''
      const last = cols[lastIdx] || ''
      name = `${first} ${last}`.trim()
    } else if (firstIdx >= 0) {
      name = cols[firstIdx] || ''
    } else {
      // Fallback: first column
      name = cols[0] || ''
    }

    name = name.replace(/^["']|["']$/g, '').trim()
    if (!name) continue

    students.push({
      id: crypto.randomUUID(),
      name,
    })
  }

  return students
}
