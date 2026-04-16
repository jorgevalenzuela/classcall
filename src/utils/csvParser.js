/**
 * CSV parser with flexible column detection (FR-01).
 *
 * Detection priority:
 *  1. Separate "first" + "last" columns → combined as "First Last"
 *  2. A column containing "name" → used directly
 *  3. Fallback → first column
 *
 * Returns: [{ id: string, name: string }]
 * id format: 'sid_' + index + '_' + random
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

  // Priority 1: separate first + last columns
  const firstIdx = headers.findIndex(h =>
    h === 'first' || h === 'firstname' || h === 'givenname'
  )
  const lastIdx = headers.findIndex(h =>
    h === 'last' || h === 'lastname' || h === 'surname' || h === 'familyname'
  )

  // Priority 2: a column containing "name"
  const nameIdx = headers.findIndex(h =>
    h === 'name' || h === 'fullname' || h === 'studentname' || h === 'studentfullname'
  )

  const students = []

  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line)
    let name

    if (firstIdx >= 0 && lastIdx >= 0) {
      // Priority 1: first + last
      const first = cols[firstIdx] || ''
      const last  = cols[lastIdx]  || ''
      name = `${first} ${last}`.trim()
    } else if (firstIdx >= 0) {
      name = cols[firstIdx] || ''
    } else if (nameIdx >= 0) {
      // Priority 2: name column
      name = cols[nameIdx] || ''
    } else {
      // Priority 3: first column
      name = cols[0] || ''
    }

    name = name.replace(/^["']|["']$/g, '').trim()
    if (!name) continue

    const idx = students.length
    const rand = Math.random().toString(36).slice(2, 8)
    students.push({
      id: `sid_${idx}_${rand}`,
      name,
    })
  }

  return students.sort((a, b) => a.name.localeCompare(b.name))
}
