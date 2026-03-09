import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterviewStage, InterviewStageType } from '../../types'
import { getInterviews, createInterview, updateInterview, deleteInterview } from '../../services/interviews'
import { useToast } from '../../context/ToastContext'
import { buildGoogleCalendarUrl } from '../../lib/calendar'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  applicationId: number
  company?: string
  position?: string
}

const STAGE_TYPES: InterviewStageType[] = ['phone_screen', 'technical', 'behavioral', 'onsite', 'take_home', 'final', 'other']

export default function InterviewTimeline({ applicationId, company, position }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [stages, setStages] = useState<InterviewStage[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ stage_type: 'phone_screen' as InterviewStageType, scheduled_at: '', notes: '' })
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let active = true
    getInterviews(applicationId)
      .then(data => { if (active) setStages(data) })
      .catch(() => { if (active) addToast(t('detail.interviewStages.loadFailed'), 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applicationId, addToast, t])

  async function handleAdd() {
    if (!form.scheduled_at) return
    try {
      const s = await createInterview(applicationId, { ...form, completed: false })
      if (!mountedRef.current) return
      setStages(prev => [...prev, s].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)))
      setForm({ stage_type: 'phone_screen', scheduled_at: '', notes: '' })
      setShowAdd(false)
    } catch {
      if (!mountedRef.current) return
      addToast(t('detail.interviewStages.addFailed'), 'error')
    }
  }

  async function toggleComplete(stage: InterviewStage) {
    try {
      const updated = await updateInterview(applicationId, stage.id, { completed: !stage.completed })
      if (!mountedRef.current) return
      setStages(prev => prev.map(s => s.id === stage.id ? updated : s))
    } catch {
      if (!mountedRef.current) return
      addToast(t('detail.interviewStages.updateFailed'), 'error')
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteInterview(applicationId, id)
      if (!mountedRef.current) return
      setStages(prev => prev.filter(s => s.id !== id))
    } catch {
      if (!mountedRef.current) return
      addToast(t('detail.interviewStages.deleteFailed'), 'error')
    }
  }

  function stageLabel(type: InterviewStageType) {
    return t(`detail.interviewStages.stageTypes.${type}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('detail.interviewStages.title')}</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {showAdd ? t('detail.cancel') : t('detail.add')}
        </button>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <select
            value={form.stage_type}
            onChange={e => setForm(p => ({ ...p, stage_type: e.target.value as InterviewStageType }))}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100"
          >
            {STAGE_TYPES.map(st => <option key={st} value={st}>{stageLabel(st)}</option>)}
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
            placeholder={t('detail.interviewStages.notesPlaceholder')}
            rows={2}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-gray-100"
          />
          <button onClick={handleAdd} className="w-full py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">{t('detail.interviewStages.addStage')}</button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="sm" centered />
      ) : stages.length === 0 && !showAdd ? (
        <p className="text-xs text-gray-400">{t('detail.interviewStages.empty')}</p>
      ) : (
        <ol className="relative pl-4 list-none">
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          {stages.map(stage => (
            <li key={stage.id} className="relative mb-4 pl-4">
              <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${
                stage.completed
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600'
              }`} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium dark:text-gray-200">{stageLabel(stage.stage_type)}</span>
                    <button
                      onClick={() => toggleComplete(stage)}
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        stage.completed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {stage.completed ? t('detail.interviewStages.done') : t('detail.interviewStages.pending')}
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
                      title: `${stageLabel(stage.stage_type)}${company ? ` — ${company}` : ''}${position ? ` (${position})` : ''}`,
                      start: stage.scheduled_at,
                      description: stage.notes,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-blue-500 hover:text-blue-700"
                    title={t('detail.interviewStages.addToCalendar')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </a>
                  <button onClick={() => handleDelete(stage.id)} className="text-xs text-red-400 hover:text-red-600">&times;</button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
