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
import { useVirtualList } from '../../hooks/useVirtualList'

interface Props {
  applications: JobApplication[]
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onTogglePin?: (id: number) => void
  onStatusChange: (id: number, newStatus: ApplicationStatus) => void
}

const COLUMNS: ApplicationStatus[] = ['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

const CARD_ESTIMATED_HEIGHT = 140
const COLUMN_MAX_HEIGHT = 600
const VIRTUAL_THRESHOLD = 8

interface CardProps {
  app: JobApplication
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  isDragging: boolean
  isKeyboardGrabbed: boolean
  onKeyboardGrab: (id: number) => void
  onKeyboardMove: (id: number, dir: 'left' | 'right') => void
  onKeyboardDrop: () => void
}

const KanbanCard = memo(function KanbanCard({
  app, onEdit, onDelete, onDragStart, onDragEnd,
  isDragging, isKeyboardGrabbed,
  onKeyboardGrab, onKeyboardMove, onKeyboardDrop,
}: CardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isKeyboardGrabbed) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onKeyboardMove(app.id, 'left') }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onKeyboardMove(app.id, 'right') }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onKeyboardDrop() }
      else if (e.key === 'Escape') { e.preventDefault(); onKeyboardDrop() }
    } else {
      if (e.key === 'Enter') { e.preventDefault(); navigate(`/applications/${app.id}`) }
      else if (e.key === ' ') { e.preventDefault(); onKeyboardGrab(app.id) }
    }
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(app.id)}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/applications/${app.id}`)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-grabbed={isKeyboardGrabbed}
      aria-label={`${app.company}, ${app.position}. ${isKeyboardGrabbed ? 'Grabbed — use Arrow Left/Right to move column, Space or Escape to drop.' : 'Press Space to move with keyboard.'}`}
      className={`group bg-white dark:bg-stone-900 rounded-lg border shadow-sm p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-500/30 ${
        isDragging
          ? 'opacity-40 scale-95 border-stone-200'
          : isKeyboardGrabbed
            ? 'ring-2 ring-stone-500 ring-offset-2 scale-105 shadow-lg border-stone-300 dark:border-stone-700'
            : 'border-stone-100 dark:border-stone-800 hover:shadow-md hover:border-stone-200 dark:hover:border-stone-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
            {(app.company[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight truncate flex items-center gap-1.5">
              {app.company}
              {needsFollowUp(app) && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit(app) }}
            className="p-1 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            aria-label={t('dashboard.aria.edit')}
          >
            <EditIcon />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(app) }}
            className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={t('dashboard.aria.delete')}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 leading-relaxed">{app.position}</p>

      {app.notes && (
        <p className="text-xs text-stone-400 italic mb-3 truncate">{app.notes}</p>
      )}

      {app.tags && app.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {app.tags.map(tag => <TagBadge key={tag.id} tag={tag} />)}
        </div>
      )}

      <p className="text-xs text-stone-400">{formatShort(app.applied_date)}</p>
    </div>
  )
})

interface ColumnBodyProps {
  apps: JobApplication[]
  isOver: boolean
  draggingId: number | null
  keyboardDragId: number | null
  onEdit: (app: JobApplication) => void
  onDelete: (app: JobApplication) => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  onKeyboardGrab: (id: number) => void
  onKeyboardMove: (id: number, dir: 'left' | 'right') => void
  onKeyboardDrop: () => void
}

function ColumnBody({
  apps, isOver, draggingId, keyboardDragId,
  onEdit, onDelete, onDragStart, onDragEnd,
  onKeyboardGrab, onKeyboardMove, onKeyboardDrop,
}: ColumnBodyProps) {
  const { t } = useTranslation()
  const useVirtual = apps.length >= VIRTUAL_THRESHOLD

  const { startIndex, endIndex, paddingTop, paddingBottom, handleScroll } = useVirtualList({
    itemCount: apps.length,
    itemHeight: CARD_ESTIMATED_HEIGHT,
    containerHeight: COLUMN_MAX_HEIGHT,
    overscan: 3,
  })

  const visibleApps = useVirtual ? apps.slice(startIndex, endIndex + 1) : apps

  const containerClass = `min-h-24 rounded-lg transition-colors duration-150 ${
    isOver ? 'bg-stone-50/60 ring-2 ring-stone-200 ring-dashed p-1' : ''
  } ${useVirtual ? 'overflow-y-auto' : ''}`

  const containerStyle = useVirtual ? { maxHeight: COLUMN_MAX_HEIGHT } : undefined

  if (apps.length === 0 && !isOver) {
    return (
      <div className={containerClass} style={containerStyle}>
        <div className="rounded-lg border-2 border-dashed border-stone-100 dark:border-stone-800 py-8 text-center">
          <p className="text-xs text-stone-300">{t('dashboard.kanban.noApplications')}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={containerClass}
      style={containerStyle}
      onScroll={useVirtual ? handleScroll : undefined}
    >
      <div style={useVirtual ? { paddingTop, paddingBottom } : undefined} className="space-y-2.5">
        {visibleApps.map(app => (
          <KanbanCard
            key={app.id}
            app={app}
            onEdit={onEdit}
            onDelete={onDelete}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingId === app.id}
            isKeyboardGrabbed={keyboardDragId === app.id}
            onKeyboardGrab={onKeyboardGrab}
            onKeyboardMove={onKeyboardMove}
            onKeyboardDrop={onKeyboardDrop}
          />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ applications, onEdit, onDelete, onStatusChange }: Props) {
  const { t } = useTranslation()
  const draggedId = useRef<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null)
  const [keyboardDragId, setKeyboardDragId] = useState<number | null>(null)

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

  function handleKeyboardGrab(id: number) {
    setKeyboardDragId(id)
  }

  function handleKeyboardMove(id: number, dir: 'left' | 'right') {
    const app = applications.find(a => a.id === id)
    if (!app) return
    const colIdx = COLUMNS.indexOf(app.status)
    const targetIdx = dir === 'left' ? colIdx - 1 : colIdx + 1
    if (targetIdx < 0 || targetIdx >= COLUMNS.length) return
    onStatusChange(id, COLUMNS[targetIdx])
  }

  function handleKeyboardDrop() {
    setKeyboardDragId(null)
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
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`} />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wide">
                {t(`dashboard.status.${status}`)}
              </span>
              <span className="ml-auto text-xs font-semibold text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-full px-2 py-0.5">
                {colApps.length}
              </span>
            </div>

            <ColumnBody
              apps={colApps}
              isOver={isOver}
              draggingId={draggingId}
              keyboardDragId={keyboardDragId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onKeyboardGrab={handleKeyboardGrab}
              onKeyboardMove={handleKeyboardMove}
              onKeyboardDrop={handleKeyboardDrop}
            />
          </div>
        )
      })}
    </div>
  )
}
