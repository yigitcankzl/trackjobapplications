import { useMemo } from 'react'
import { JobApplication } from '../types'

const STALE_DAYS = 3

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export interface ApplicationReminder {
  app: JobApplication
  daysSinceUpdate: number
}

export function useApplicationReminders(apps: JobApplication[]): ApplicationReminder[] {
  return useMemo(
    () =>
      apps
        .filter(a => (a.status === 'applied' || a.status === 'interview') && daysSince(a.updated_at) >= STALE_DAYS)
        .map(a => ({ app: a, daysSinceUpdate: daysSince(a.updated_at) }))
        .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate),
    [apps],
  )
}
