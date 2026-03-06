import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationSource, ApplicationStatus, JobApplication } from '../../types'
import { STATUS_KEYS } from '../../constants/applicationStatus'
import { SOURCE_KEYS } from '../../constants/applicationSource'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { CloseIcon } from '../icons'
import Button from '../ui/Button'
import TagSelector from './TagSelector'

interface FormData {
  company: string
  position: string
  status: ApplicationStatus
  applied_date: string
  url: string
  source: string
  interview_date: string
  notes: string
  tag_ids: number[]
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'> & { tag_ids?: number[] }) => void
  initialData?: JobApplication
}

function getInitialForm(): FormData {
  return {
    company: '',
    position: '',
    status: 'applied',
    applied_date: new Date().toISOString().split('T')[0],
    url: '',
    source: '',
    interview_date: '',
    notes: '',
    tag_ids: [],
  }
}

function toFormData(app: JobApplication): FormData {
  return {
    company: app.company,
    position: app.position,
    status: app.status,
    applied_date: app.applied_date,
    url: app.url ?? '',
    source: app.source ?? '',
    interview_date: app.interview_date ? app.interview_date.slice(0, 16) : '',
    notes: app.notes,
    tag_ids: app.tags?.map(t => t.id) ?? [],
  }
}

export default function AddApplicationModal({ open, onClose, onSubmit, initialData }: Props) {
  const { t } = useTranslation()
  const isEdit = !!initialData
  const [form, setForm] = useState<FormData>(getInitialForm)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const firstInputRef = useRef<HTMLInputElement>(null)
  const focusTrapRef = useFocusTrap(open, firstInputRef)

  useEscapeKey(onClose, open)

  useEffect(() => {
    if (open) {
      setForm(initialData ? toFormData(initialData) : getInitialForm())
      setErrors({})
    }
  }, [open, initialData])

  function validate(): boolean {
    const next: Partial<FormData> = {}
    if (!form.company.trim()) next.company = t('dashboard.form.companyRequired')
    if (!form.position.trim()) next.position = t('dashboard.form.positionRequired')
    if (!form.applied_date) next.applied_date = t('dashboard.form.dateRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      company: form.company.trim(),
      position: form.position.trim(),
      status: form.status,
      applied_date: form.applied_date,
      url: form.url.trim() || undefined,
      source: form.source ? (form.source as ApplicationSource) : undefined,
      interview_date: form.interview_date || null,
      notes: form.notes.trim(),
      tag_ids: form.tag_ids,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? t('dashboard.editApplication') : t('dashboard.addApplication')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('dashboard.form.company')} <span className="text-red-400">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                placeholder={t('dashboard.form.companyPlaceholder')}
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors placeholder:text-gray-300 ${
                  errors.company
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900'
                }`}
              />
              {errors.company && <p className="mt-1 text-xs text-red-500">{errors.company}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t('dashboard.form.position')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder={t('dashboard.form.positionPlaceholder')}
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors placeholder:text-gray-300 ${
                  errors.position
                    ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900'
                }`}
              />
              {errors.position && <p className="mt-1 text-xs text-red-500">{errors.position}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.status')}</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as ApplicationStatus }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  {STATUS_KEYS.map(status => (
                    <option key={status} value={status}>{t(`dashboard.status.${status}`)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('dashboard.form.appliedDate')} <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.applied_date}
                  onChange={e => setForm(f => ({ ...f, applied_date: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                    errors.applied_date
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-200 dark:border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900'
                  }`}
                />
                {errors.applied_date && <p className="mt-1 text-xs text-red-500">{errors.applied_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.jobUrl')}</label>
                <input
                  type="url"
                  placeholder={t('dashboard.form.jobUrlPlaceholder')}
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors placeholder:text-gray-300 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.source')}</label>
                <select
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">{t('dashboard.form.selectSource')}</option>
                  {SOURCE_KEYS.map(src => (
                    <option key={src} value={src}>{t(`source.${src}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.interviewDate')}</label>
              <input
                type="datetime-local"
                value={form.interview_date}
                onChange={e => setForm(f => ({ ...f, interview_date: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors bg-white dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.notes')}</label>
              <textarea
                placeholder={t('dashboard.form.notesPlaceholder')}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors resize-none placeholder:text-gray-300 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('dashboard.form.tags')}</label>
              <TagSelector selectedIds={form.tag_ids} onChange={ids => setForm(f => ({ ...f, tag_ids: ids }))} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('dashboard.form.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? t('dashboard.form.saveChanges') : t('dashboard.form.saveApplication')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
