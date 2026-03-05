import { useTranslation } from 'react-i18next'
import { JobApplication } from '../../types'
import StatusBadge from './StatusBadge'
import { EditIcon, TrashIcon, ClipboardIcon } from '../icons'
import { getAvatarColor } from '../../lib/avatar'
import { formatMedium } from '../../lib/dates'

function needsFollowUp(app: JobApplication): boolean {
  if (app.status !== 'applied' && app.status !== 'interview') return false
  return (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24) >= 3
}

interface Props {
  applications: JobApplication[]
  onView: (app: JobApplication) => void
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-400">
        <ClipboardIcon />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.table.emptyTitle')}</p>
      <p className="text-xs text-gray-400">{t('dashboard.table.emptySubtitle')}</p>
    </div>
  )
}

export default function ApplicationsTable({ applications, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslation()

  if (applications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.company')}</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.status')}</th>
            <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.applied')}</th>
            <th className="w-20 px-6 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {applications.map(app => (
            <tr key={app.id} onClick={() => onView(app)} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors duration-150 cursor-pointer">
              {/* Company + Position + Notes */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                    {app.company[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight flex items-center gap-1.5">
                      {app.company}
                      {needsFollowUp(app) && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Follow-up needed" />}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{app.position}</p>
                    {app.notes && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs italic">{app.notes}</p>
                    )}
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <StatusBadge status={app.status} />
              </td>

              {/* Date */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatMedium(app.applied_date)}</span>
              </td>

              {/* Actions — only visible on row hover */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(app) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                    aria-label={t('dashboard.aria.edit')}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(app) }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={t('dashboard.aria.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
