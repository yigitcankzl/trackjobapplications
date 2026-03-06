import { useTranslation } from 'react-i18next'
import { JobApplication } from '../../types'

import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import StatusBadge from './StatusBadge'
import SourceBadge from './SourceBadge'
import NoteTimeline from './NoteTimeline'
import { EditIcon, TrashIcon, CloseIcon, CalendarIcon, ClockIcon, LinkIcon } from '../icons'
import { getAvatarColor } from '../../lib/avatar'
import { formatLong, formatMedium } from '../../lib/dates'

interface Props {
  app: JobApplication | null
  onClose: () => void
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
}

export default function ApplicationDrawer({ app, onClose, onEdit, onDelete }: Props) {
  const { t } = useTranslation()
  const open = !!app
  const focusTrapRef = useFocusTrap(open)
  useEscapeKey(onClose, open)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white dark:bg-gray-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {!app ? null : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <span id="drawer-title" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('dashboard.drawer.title')}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Company + Position hero */}
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                  {app.company[0].toUpperCase()}
                </div>
                <div className="min-w-0 pt-1">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{app.company}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{app.position}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    {app.source && <SourceBadge source={app.source} />}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* Details grid */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CalendarIcon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {t('dashboard.drawer.applied')}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{formatLong(app.applied_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                      {t('dashboard.drawer.lastUpdated')}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{formatMedium(app.updated_at)}</p>
                  </div>
                </div>

                {app.interview_date && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        {t('dashboard.drawer.interviewDate')}
                      </p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{formatLong(app.interview_date)}</p>
                    </div>
                  </div>
                )}

                {app.url && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <LinkIcon />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        {t('dashboard.drawer.jobPosting')}
                      </p>
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
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800" />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      {t('dashboard.drawer.notes')}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{app.notes}</p>
                  </div>
                </>
              )}

              {/* Note timeline */}
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <NoteTimeline applicationId={app.id} />

              {/* Stage timeline */}
              <div className="border-t border-gray-100 dark:border-gray-800" />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  {t('dashboard.drawer.stage')}
                </p>
                <div className="flex items-center gap-0">
                  {(['applied', 'interview', 'offer'] as const).map((stage, i) => {
                    const stages = ['applied', 'interview', 'offer'] as const
                    const currentIdx = stages.indexOf(app.status as typeof stages[number])
                    const isActive = i === currentIdx
                    const isPast = currentIdx > i

                    return (
                      <div key={stage} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {i + 1}
                          </div>
                          <span className={`text-xs mt-1 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {t(`dashboard.status.${stage}`)}
                          </span>
                        </div>
                        {i < 2 && (
                          <div className={`h-0.5 flex-1 -mt-4 ${isPast || isActive ? 'bg-blue-200' : 'bg-gray-100'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <button
                onClick={() => { onEdit(app); onClose() }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <EditIcon />
                {t('dashboard.drawer.edit')}
              </button>
              <button
                onClick={() => { onDelete(app); onClose() }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <TrashIcon />
                {t('dashboard.drawer.delete')}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
