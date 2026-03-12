import { useTranslation } from 'react-i18next'
import { InterviewStage, JobApplication } from '../../types'

interface UpcomingInterview {
  application: JobApplication
  stage: InterviewStage
}

interface Props {
  reminders: UpcomingInterview[]
  onDismiss: () => void
}

export default function InterviewReminderPopup({ reminders, onDismiss }: Props) {
  const { t } = useTranslation()

  if (reminders.length === 0) return null

  return (
    <div role="alert" className="fixed top-4 right-4 z-50 bg-white dark:bg-stone-800 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg p-4 w-80 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('detail.interviewStages.title')}</h4>
        <button onClick={onDismiss} className="text-stone-400 hover:text-stone-600 text-xs">&times;</button>
      </div>
      <div className="space-y-2">
        {reminders.map(r => (
          <div key={`${r.application.id}-${r.stage.id}`} className="text-xs">
            <p className="font-medium dark:text-stone-200">
              {t(`detail.interviewStages.stageTypes.${r.stage.stage_type}`) || r.stage.stage_type} — {r.application.company}
            </p>
            <p className="text-stone-500">
              {new Date(r.stage.scheduled_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { UpcomingInterview }
