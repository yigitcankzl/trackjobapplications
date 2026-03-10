import { memo, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { JobApplication, ApplicationStatus } from '../../types'
import { STATUS_COLORS } from '../../constants/applicationStatus'
import { EditIcon, TrashIcon } from '../icons'
import { getAvatarColor } from '../../lib/avatar'
import { formatShort } from '../../lib/dates'
import TagBadge from './TagBadge'
import { needsFollowUp } from '../../lib/followUp'

interface Props {
  applications: JobApplication[]
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onTogglePin?: (id: number) => void
  onStatusChange: (id: number, newStatus: ApplicationStatus) => void
}

const COLUMNS: ApplicationStatus[] = ['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

interface CardProps {
  app: JobApplication
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  isDragging: boolean
}

const KanbanCard = memo(function KanbanCard({ app, onEdit, onDelete, onDragStart, onDragEnd, isDragging }: CardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div
      draggable
      onDragStart={() => onDragStart(app.id)}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/applications/${app.id}`)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/applications/${app.id}`) } }}
      tabIndex={0}
      role="link"
      className={`group bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
        isDragging
          ? 'opacity-40 scale-95 border-blue-200'
          : 'border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-100 dark:hover:border-blue-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
            {(app.company[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate flex items-center gap-1.5">
              {app.company}
              {needsFollowUp(app) && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit(app) }}
            className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label={t('dashboard.aria.edit')}
          >
            <EditIcon />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(app) }}
            className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={t('dashboard.aria.delete')}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{app.position}</p>

      {app.notes && (
        <p className="text-xs text-gray-400 italic mb-3 truncate">{app.notes}</p>
      )}

      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {app.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
        </div>
      )}

      <p className="text-xs text-gray-400">{formatShort(app.applied_date)}</p>
    </div>
  )
})

export default function KanbanBoard({ applications, onEdit, onDelete, onStatusChange }: Props) {
  const { t } = useTranslation()
  const draggedId = useRef<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null)

  const grouped = useMemo(() => {
    const map: Record<ApplicationStatus, JobApplication[]> = {
      to_apply: [], applied: [], interview: [], offer: [], rejected: [], withdrawn: [],
    }
    for (const app of applications) {
      map[app.status].push(app)
    }
    return map
  }, [applications])

  function handleDragStart(id: number) {
    draggedId.current = id
    setDraggingId(id)
  }

  function handleDragEnd() {
    draggedId.current = null
    setDraggingId(null)
    setDragOverCol(null)
  }

  function handleDragOver(e: React.DragEvent, status: ApplicationStatus) {
    e.preventDefault()
    setDragOverCol(status)
  }

  function handleDrop(status: ApplicationStatus) {
    if (draggedId.current !== null) {
      const app = applications.find(a => a.id === draggedId.current)
      if (app && app.status !== status) {
        onStatusChange(draggedId.current, status)
      }
    }
    draggedId.current = null
    setDraggingId(null)
    setDragOverCol(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(status => {
        const colApps = grouped[status]
        const isOver = dragOverCol === status

        return (
          <div
            key={status}
            className="flex-shrink-0 w-64"
            onDragOver={e => handleDragOver(e, status)}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverCol(null)
              }
            }}
            onDrop={() => handleDrop(status)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                {t(`dashboard.status.${status}`)}
              </span>
              <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                {colApps.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className={`space-y-2.5 min-h-24 rounded-xl transition-colors duration-150 ${
                isOver ? 'bg-blue-50/60 ring-2 ring-blue-200 ring-dashed p-1' : ''
              }`}
            >
              {colApps.length === 0 && !isOver ? (
                <div className="rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-800 py-8 text-center">
                  <p className="text-xs text-gray-300">{t('dashboard.kanban.noApplications')}</p>
                </div>
              ) : (
                colApps.map(app => (
                  <KanbanCard
                    key={app.id}
                    app={app}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === app.id}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
