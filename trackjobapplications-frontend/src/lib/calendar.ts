export function buildGoogleCalendarUrl(params: {
  title: string
  start: string
  description?: string
  durationMinutes?: number
}): string {
  const { title, start, description = '', durationMinutes = 60 } = params
  const startDate = new Date(start)
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

  function toGCalFormat(d: Date): string {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const base = 'https://calendar.google.com/calendar/render'
  const searchParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGCalFormat(startDate)}/${toGCalFormat(endDate)}`,
    details: description,
  })

  return `${base}?${searchParams.toString()}`
}
