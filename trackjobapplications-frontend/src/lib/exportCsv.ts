import { JobApplication } from '../types'

export function exportApplicationsCsv(apps: JobApplication[]) {
  const headers = ['Company', 'Position', 'Status', 'Applied Date', 'URL', 'Notes']

  const rows = apps.map(app => [
    sanitizeCsvValue(app.company),
    sanitizeCsvValue(app.position),
    sanitizeCsvValue(app.status),
    app.applied_date,
    sanitizeCsvValue(app.url ?? ''),
    sanitizeCsvValue(app.notes),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  // UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r']

function sanitizeCsvValue(value: string): string {
  let safe = value
  if (safe && FORMULA_PREFIXES.includes(safe[0])) {
    safe = `'${safe}`
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}
