import { memo, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JobApplication } from '../../types'
import StatusBadge from './StatusBadge'
import { EditIcon, TrashIcon, ClipboardIcon, ExternalLinkIcon } from '../icons'
import { getAvatarColor } from '../../lib/avatar'
import { formatMedium } from '../../lib/dates'
import { needsFollowUp } from '../../lib/followUp'
import { useVirtualList } from '../../hooks/useVirtualList'

const ROW_HEIGHT = 73
const TABLE_MAX_HEIGHT = 600
const VIRTUAL_THRESHOLD = 15

interface Props {
  applications: JobApplication[]
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onTogglePin?: (id: number) => void
  onApply?: (app: JobApplication) => void
  selectedIds?: number[]
  onToggleSelect?: (id: number) => void
  onToggleSelectAll?: () => void
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-400">
        <ClipboardIcon />
      </div>
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{t('dashboard.table.emptyTitle')}</p>
      <p className="text-xs text-stone-400">{t('dashboard.table.emptySubtitle')}</p>
    </div>
  )
}

export default memo(function ApplicationsTable({ applications, onEdit, onDelete, onTogglePin, onApply, selectedIds, onToggleSelect, onToggleSelectAll }: Props) {
  const hasBulk = !!(selectedIds && onToggleSelect && onToggleSelectAll)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const sorted = useMemo(() => [...applications].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned)), [applications])

  const useVirtual = sorted.length >= VIRTUAL_THRESHOLD
  const colSpan = hasBulk ? 5 : 4

  const { startIndex, endIndex, paddingTop, paddingBottom, handleScroll } = useVirtualList({
    itemCount: sorted.length,
    itemHeight: ROW_HEIGHT,
    containerHeight: TABLE_MAX_HEIGHT,
    overscan: 5,
  })

  const visibleRows = useVirtual ? sorted.slice(startIndex, endIndex + 1) : sorted

  if (applications.length === 0) {
    return (
      <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
        <EmptyState />
      </div>
    )
  }

  return (
    <div
      className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800 shadow-sm overflow-x-auto"
      style={useVirtual ? { maxHeight: TABLE_MAX_HEIGHT, overflowY: 'auto' } : undefined}
      onScroll={useVirtual ? handleScroll : undefined}
    >
      <table className="w-full min-w-[640px]">
        <thead className={useVirtual ? 'sticky top-0 z-10' : undefined}>
          <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/50">
            {hasBulk && (
              <th className="w-10 px-3 py-3.5">
                <input
                  type="checkbox"
                  checked={applications.length > 0 && selectedIds.length === applications.length}
                  onChange={onToggleSelectAll}
                  className="rounded border-stone-300 text-blue-600 focus:ring-stone-500"
                />
              </th>
            )}
            <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.company')}</th>
            <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.status')}</th>
            <th className="text-left text-xs font-semibold text-stone-400 uppercase tracking-wide px-6 py-3.5">{t('dashboard.table.applied')}</th>
            <th className="w-20 px-6 py-3.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
          {useVirtual && paddingTop > 0 && (
            <tr style={{ height: paddingTop }}><td colSpan={colSpan} /></tr>
          )}
          {visibleRows.map(app => (
            <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/applications/${app.id}`) } }} tabIndex={0} role="link" className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-500/30 focus:ring-inset">
              {hasBulk && (
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(app.id)}
                    onChange={e => { e.stopPropagation(); onToggleSelect(app.id) }}
                    onClick={e => e.stopPropagation()}
                    className="rounded border-stone-300 text-blue-600 focus:ring-stone-500"
                  />
                </td>
              )}
              {/* Company + Position + Notes */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                    {(app.company[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight flex items-center gap-1.5">
                      {app.company}
                      {needsFollowUp(app) && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title={t('dashboard.aria.followUpNeeded')} />}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{app.position}</p>
                    {app.notes && (
                      <p className="text-xs text-stone-400 mt-0.5 truncate max-w-xs italic">{app.notes}</p>
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
                <span className="text-sm text-stone-500 dark:text-stone-400">{formatMedium(app.applied_date)}</span>
              </td>

              {/* Actions — only visible on row hover */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 justify-end">
                  {onTogglePin && (
                    <button
                      onClick={e => { e.stopPropagation(); onTogglePin(app.id) }}
                      className={`p-1.5 rounded-lg transition-colors ${app.is_pinned ? 'text-amber-500' : 'text-stone-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-amber-50'}`}
                      aria-label={t('dashboard.aria.pin')}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={app.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" /></svg>
                    </button>
                  )}
                  {onApply && (
                    <button
                      onClick={e => { e.stopPropagation(); onApply(app) }}
                      disabled={!app.url}
                      className={`p-1.5 rounded-lg transition-colors ${
                        app.url
                          ? 'text-stone-400 opacity-0 group-hover:opacity-100 hover:text-emerald-600 hover:bg-emerald-50'
                          : 'text-stone-200 cursor-not-allowed opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label={app.url ? t('dashboard.aria.apply') : t('dashboard.aria.noUrl')}
                      title={app.url ? t('dashboard.aria.apply') : t('dashboard.aria.noUrl')}
                    >
                      <ExternalLinkIcon />
                    </button>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); onEdit(app) }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t('dashboard.aria.edit')}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(app) }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t('dashboard.aria.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {useVirtual && paddingBottom > 0 && (
            <tr style={{ height: paddingBottom }}><td colSpan={colSpan} /></tr>
          )}
        </tbody>
      </table>
    </div>
  )
})
