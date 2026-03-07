import i18n from './i18n'

function locale(): string {
  return i18n.language || 'en'
}

function parseLocal(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(dateStr)
}

/** "Feb 10" */
export function formatShort(dateStr: string): string {
  return parseLocal(dateStr).toLocaleDateString(locale(), {
    month: 'short',
    day: 'numeric',
  })
}

/** "Feb 10, 2026" */
export function formatMedium(dateStr: string): string {
  return parseLocal(dateStr).toLocaleDateString(locale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "Tue, February 10, 2026" */
export function formatLong(dateStr: string): string {
  return parseLocal(dateStr).toLocaleDateString(locale(), {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** "Feb 2026" */
export function formatMonthYear(key: string): string {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString(locale(), {
    month: 'short',
    year: 'numeric',
  })
}
