import { InterviewStage, JobApplication } from '../../types'

interface UpcomingInterview {
  application: JobApplication
  stage: InterviewStage
}

interface Props {
  reminders: UpcomingInterview[]
  onDismiss: () => void
}

const STAGE_LABELS: Record<string, string> = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  onsite: 'On-site',
  take_home: 'Take-home',
  final: 'Final Round',
  other: 'Other',
}

export default function InterviewReminderPopup({ reminders, onDismiss }: Props) {
  if (reminders.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-xl shadow-lg p-4 w-80 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Upcoming Interviews</h4>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-xs">&times;</button>
      </div>
      <div className="space-y-2">
        {reminders.map(r => (
          <div key={`${r.application.id}-${r.stage.id}`} className="text-xs">
            <p className="font-medium dark:text-gray-200">
              {STAGE_LABELS[r.stage.stage_type] || r.stage.stage_type} — {r.application.company}
            </p>
            <p className="text-gray-500">
              {new Date(r.stage.scheduled_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export type { UpcomingInterview }
