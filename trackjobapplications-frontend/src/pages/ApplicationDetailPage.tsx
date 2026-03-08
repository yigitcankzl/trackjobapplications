import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import StatusBadge from '../components/dashboard/StatusBadge'
import SourceBadge from '../components/dashboard/SourceBadge'
import NoteTimeline from '../components/dashboard/NoteTimeline'
import AddApplicationModal from '../components/dashboard/AddApplicationModal'
import ConfirmModal from '../components/dashboard/ConfirmModal'
import { getApplication, updateApplication, deleteApplication } from '../services/applications'
import { useToast } from '../context/ToastContext'
import { getAvatarColor } from '../lib/avatar'
import { formatLong, formatMedium } from '../lib/dates'
import { isSafeUrl } from '../lib/url'
import { JobApplication } from '../types'
import TagBadge from '../components/dashboard/TagBadge'
import ContactList from '../components/detail/ContactList'
import InterviewTimeline from '../components/detail/InterviewTimeline'
import AttachmentList from '../components/detail/AttachmentList'
import { ArrowLeftIcon, EditIcon, TrashIcon, CalendarIcon, ClockIcon, LinkIcon } from '../components/icons'

export default function ApplicationDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [app, setApp] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      navigate('/dashboard')
      return
    }
    setLoading(true)
    getApplication(Number(id))
      .then(setApp)
      .catch(() => {
        addToast(t('dashboard.errors.loadFailed'), 'error')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [id, addToast, t, navigate])

  async function handleEdit(data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    if (!app) return
    try {
      const updated = await updateApplication(app.id, data)
      setApp(updated)
      addToast(t('dashboard.toast.saved'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }

  async function handleDelete() {
    if (!app) return
    try {
      await deleteApplication(app.id)
      addToast(t('dashboard.toast.deleted'))
      navigate('/dashboard')
    } catch {
      addToast(t('dashboard.errors.deleteFailed'), 'error')
    }
  }

  if (loading || !app) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Header
        title={t('detail.title')}
        action={
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeftIcon />
            {t('detail.backToDashboard')}
          </button>
        }
      />

      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
              {app.company[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{app.company}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{app.position}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={app.status} />
                {app.source && <SourceBadge source={app.source} />}
                {app.tags?.map(tag => <TagBadge key={tag.id} tag={tag} />)}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
              >
                <EditIcon />
                {t('detail.edit')}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
              >
                <TrashIcon />
                {t('detail.delete')}
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('detail.applied')}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{formatLong(app.applied_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ClockIcon />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('detail.lastUpdated')}</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{formatMedium(app.updated_at)}</p>
            </div>
          </div>


          {app.url && isSafeUrl(app.url) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <LinkIcon />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{t('detail.jobPosting')}</p>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline truncate block"
                >
                  {app.url}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {app.notes && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('detail.notes')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
          </div>
        )}

        {/* Note timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <NoteTimeline applicationId={app.id} />
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <ContactList applicationId={app.id} />
        </div>

        {/* Interview Stages */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <InterviewTimeline applicationId={app.id} company={app.company} position={app.position} />
        </div>

        {/* Attachments */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <AttachmentList applicationId={app.id} />
        </div>

        {/* Stage */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('detail.stage')}</p>
          <div className="flex items-center gap-0">
            {(['applied', 'interview', 'offer'] as const).map((stage, i) => {
              const stages = ['applied', 'interview', 'offer'] as const
              const currentIdx = stages.indexOf(app.status as typeof stages[number])
              const isActive = i === currentIdx
              const isPast = currentIdx > i

              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {t(`dashboard.status.${stage}`)}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 flex-1 -mt-5 ${isPast || isActive ? 'bg-blue-200' : 'bg-gray-100 dark:bg-gray-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AddApplicationModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
        initialData={app}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t('dashboard.confirm.deleteTitle')}
        description={t('dashboard.confirm.deleteDescription', {
          company: app.company,
          position: app.position,
        })}
        confirmLabel={t('dashboard.confirm.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </DashboardLayout>
  )
}
