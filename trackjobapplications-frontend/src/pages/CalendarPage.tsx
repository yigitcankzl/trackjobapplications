import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import { getAllApplications } from '../services/applications'
import { useToast } from '../context/ToastContext'
import { JobApplication } from '../types'
import { getAvatarColor } from '../lib/avatar'

function getWeekdays(locale?: string): string[] {
  const base = new Date(2024, 0, 1) // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d.toLocaleDateString(locale, { weekday: 'short' })
  })
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [apps, setApps] = useState<JobApplication[]>([])
  const weekdays = useMemo(() => getWeekdays(i18n.language), [i18n.language])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  useEffect(() => {
    let active = true
    getAllApplications()
      .then(data => { if (active) setApps(data) })
      .catch(() => { if (active) addToast(t('dashboard.errors.loadFailed'), 'error') })
    return () => { active = false }
  }, [addToast, t])

  const dayMap = useMemo(() => {
    const map: Record<number, JobApplication[]> = {}
    for (const app of apps) {
      const [y, m, d] = app.applied_date.split('-').map(Number)
      if (y === year && m - 1 === month) {
        if (!map[d]) map[d] = []
        map[d].push(app)
      }
    }
    return map
  }, [apps, year, month])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : -1

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const monthLabel = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <DashboardLayout>
      <Header title={t('calendar.title')} />

      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-3 sm:p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            aria-label={t('calendar.prevMonth')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            &larr;
          </button>
          <h2 className="text-base font-semibold text-stone-800 dark:text-stone-200 capitalize">{monthLabel}</h2>
          <button
            onClick={nextMonth}
            aria-label={t('calendar.nextMonth')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            &rarr;
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekdays.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-stone-400 uppercase tracking-wide py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-px bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white dark:bg-stone-900 min-h-16 sm:min-h-24" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const isToday = day === today
            const dayApps = dayMap[day] || []
            return (
              <div
                key={day}
                className={`bg-white dark:bg-stone-900 min-h-16 sm:min-h-24 p-1 sm:p-1.5 ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-blue-600 font-bold' : 'text-stone-500 dark:text-stone-400'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayApps.map(app => (
                    <button
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                        {(app.company[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-xs text-stone-700 dark:text-stone-300 truncate">{app.company}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
