import { JobApplication } from '../types'

export function exportApplicationsCsv(apps: JobApplication[]) {
  const headers = ['Company', 'Position', 'Status', 'Applied Date', 'URL', 'Notes']

  const rows = apps.map(app => [
    escape(app.company),
    escape(app.position),
    app.status,
    app.applied_date,
    app.url ?? '',
    escape(app.notes),
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

function escape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
