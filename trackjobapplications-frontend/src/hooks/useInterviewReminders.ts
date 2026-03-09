import { useEffect, useMemo, useRef, useState } from 'react'
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
    try { localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next])) } catch { /* quota */ }
  }

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Track which interviews we've already notified about
  const notifiedRef = useRef<Set<string>>(new Set())

  // Show browser notification for upcoming interviews
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    for (const r of upcoming) {
      const key = `${r.application.id}-${r.stage.id}`
      if (notifiedRef.current.has(key)) continue
      notifiedRef.current.add(key)
      new Notification(`Interview coming up: ${r.application.company}`, {
        body: `${r.stage.stage_type} at ${new Date(r.stage.scheduled_at).toLocaleTimeString()}`,
      })
    }
  }, [upcoming])

  return { upcoming, dismissAll }
}
