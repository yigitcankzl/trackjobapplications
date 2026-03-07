import { useEffect, useState } from 'react'
import { InterviewStage, InterviewStageType } from '../../types'
import { getInterviews, createInterview, updateInterview, deleteInterview } from '../../services/interviews'
import { useToast } from '../../context/ToastContext'
import { buildGoogleCalendarUrl } from '../../lib/calendar'

interface Props {
  applicationId: number
  company?: string
  position?: string
}

const STAGE_LABELS: Record<InterviewStageType, string> = {
  phone_screen: 'Phone Screen',
  technical: 'Technical',
  behavioral: 'Behavioral',
  onsite: 'On-site',
  take_home: 'Take-home',
  final: 'Final Round',
  other: 'Other',
}

const STAGE_TYPES = Object.keys(STAGE_LABELS) as InterviewStageType[]

export default function InterviewTimeline({ applicationId, company, position }: Props) {
  const { addToast } = useToast()
  const [stages, setStages] = useState<InterviewStage[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ stage_type: 'phone_screen' as InterviewStageType, scheduled_at: '', notes: '' })

  useEffect(() => {
    getInterviews(applicationId).then(setStages).catch(() => addToast('Failed to load interviews', 'error'))
  }, [applicationId])

  async function handleAdd() {
    if (!form.scheduled_at) return
    try {
      const s = await createInterview(applicationId, { ...form, completed: false })
      setStages(prev => [...prev, s].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)))
      setForm({ stage_type: 'phone_screen', scheduled_at: '', notes: '' })
      setShowAdd(false)
    } catch {
      addToast('Failed to add interview', 'error')
    }
  }

  async function toggleComplete(stage: InterviewStage) {
    try {
      const updated = await updateInterview(applicationId, stage.id, { completed: !stage.completed })
      setStages(prev => prev.map(s => s.id === stage.id ? updated : s))
    } catch {
      addToast('Failed to update', 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteInterview(applicationId, id)
      setStages(prev => prev.filter(s => s.id !== id))
    } catch {
      addToast('Failed to delete', 'error')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Interview Stages</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <select
            value={form.stage_type}
            onChange={e => setForm(p => ({ ...p, stage_type: e.target.value as InterviewStageType }))}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100"
          >
            {STAGE_TYPES.map(st => <option key={st} value={st}>{STAGE_LABELS[st]}</option>)}
          </select>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100"
          />
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100"
          />
          <button onClick={handleAdd} className="w-full py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Add Stage</button>
        </div>
      )}

      {stages.length === 0 && !showAdd ? (
        <p className="text-xs text-gray-400">No interview stages yet.</p>
      ) : (
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          {stages.map(stage => (
            <div key={stage.id} className="relative mb-4 pl-4">
              <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${
                stage.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
              }`} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-gray-200">{STAGE_LABELS[stage.stage_type]}</span>
                    <button
                      onClick={() => toggleComplete(stage)}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        stage.completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {stage.completed ? 'Done' : 'Pending'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(stage.scheduled_at).toLocaleString()}
                  </p>
                  {stage.notes && <p className="text-xs text-gray-400 mt-1">{stage.notes}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={buildGoogleCalendarUrl({
                      title: `${STAGE_LABELS[stage.stage_type]}${company ? ` — ${company}` : ''}${position ? ` (${position})` : ''}`,
                      start: stage.scheduled_at,
                      description: stage.notes,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-blue-500 hover:text-blue-700"
                    title="Add to Google Calendar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </a>
                  <button onClick={() => handleDelete(stage.id)} className="text-xs text-red-400 hover:text-red-600">&times;</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
