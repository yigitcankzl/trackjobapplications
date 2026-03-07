import { useEffect, useMemo, useState } from 'react'
import { JobApplication } from '../types'
import type { UpcomingInterview } from '../components/dashboard/InterviewReminderPopup'

const DISMISSED_KEY = 'dismissed_interview_reminders'

export function useInterviewReminders(apps: JobApplication[]) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })

  const upcoming = useMemo(() => {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const result: UpcomingInterview[] = []

    for (const app of apps) {
      for (const stage of app.interview_stages || []) {
        if (stage.completed) continue
        const date = new Date(stage.scheduled_at)
        if (date >= now && date <= in24h) {
          const key = `${app.id}-${stage.id}`
          if (!dismissed.has(key)) {
            result.push({ application: app, stage })
          }
        }
      }
    }
    return result
  }, [apps, dismissed])

  function dismissAll() {
    const keys = upcoming.map(r => `${r.application.id}-${r.stage.id}`)
    const next = new Set([...dismissed, ...keys])
    setDismissed(next)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]))
  }

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Show browser notification for upcoming interviews
  useEffect(() => {
    if (upcoming.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const r = upcoming[0]
      new Notification(`Interview coming up: ${r.application.company}`, {
        body: `${r.stage.stage_type} at ${new Date(r.stage.scheduled_at).toLocaleTimeString()}`,
      })
    }
  }, [upcoming.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return { upcoming, dismissAll }
}
