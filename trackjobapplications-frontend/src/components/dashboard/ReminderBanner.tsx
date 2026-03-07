import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationReminder } from '../../hooks/useApplicationReminders'
import { BellIcon } from '../icons'

interface Props {
  reminders: ApplicationReminder[]
}

export default function ReminderBanner({ reminders }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  if (reminders.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-amber-600 dark:text-amber-400">
          <BellIcon />
        </span>
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {t('dashboard.reminders.title', { count: reminders.length })}
        </span>
        <svg
          className={`w-4 h-4 ml-auto text-amber-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <ul className="mt-3 space-y-1.5">
          {reminders.map(({ app, daysSinceUpdate }) => (
            <li key={app.id} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="font-medium">{app.company}</span>
              <span className="text-amber-600 dark:text-amber-400">—</span>
              <span>{app.position}</span>
              <span className="ml-auto text-xs text-amber-500 dark:text-amber-400">
                {t('dashboard.reminders.daysAgo', { days: daysSinceUpdate })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
