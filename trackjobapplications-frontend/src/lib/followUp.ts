import { JobApplication } from '../types'

const FOLLOW_UP_DAYS = 3

export function needsFollowUp(app: JobApplication): boolean {
  if (app.status !== 'applied' && app.status !== 'interview') return false
  return (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24) >= FOLLOW_UP_DAYS
}
