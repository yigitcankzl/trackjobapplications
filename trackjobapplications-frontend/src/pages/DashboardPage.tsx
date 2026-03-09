import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import DraggableStatCard from '../components/dashboard/DraggableStatCard'
import ApplicationsTable from '../components/dashboard/ApplicationsTable'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import AddApplicationModal from '../components/dashboard/AddApplicationModal'
import ConfirmModal from '../components/dashboard/ConfirmModal'
import TableFilters from '../components/dashboard/TableFilters'
import ApplicationDrawer from '../components/dashboard/ApplicationDrawer'
import ReminderBanner from '../components/dashboard/ReminderBanner'
import BulkActionBar from '../components/dashboard/BulkActionBar'
import ImportModal from '../components/dashboard/ImportModal'
import InterviewReminderPopup from '../components/dashboard/InterviewReminderPopup'
import Pagination from '../components/ui/Pagination'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { PlusIcon, TableIcon, KanbanIcon, DownloadIcon, RefreshIcon } from '../components/icons'
import { exportApplicationsCsv } from '../lib/exportCsv'
import { isSafeUrl } from '../lib/url'
import { getApplications, createApplication, updateApplication, deleteApplication, bulkUpdateStatus, bulkDelete, togglePin, getStats, exportPdf, AppStats } from '../services/applications'
import { ApplicationFilters, ApplicationStatus, JobApplication, ViewMode } from '../types'
import { useToast } from '../context/ToastContext'
import { useApplicationFilters } from '../hooks/useApplicationFilters'
import { useApplicationReminders } from '../hooks/useApplicationReminders'
import { useWidgetOrder } from '../hooks/useWidgetOrder'
import { useInterviewReminders } from '../hooks/useInterviewReminders'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [apps, setApps] = useState<JobApplication[]>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 20

  const [view, setView] = useState<ViewMode>('table')
  const [drawerApp, setDrawerApp] = useState<JobApplication | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [importOpen, setImportOpen] = useState(false)

  const filtersRef = useRef<ApplicationFilters>({})

  const [stats, setStats] = useState<AppStats>({ total: 0, to_apply: 0, applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 })

  const loadStats = useCallback(() => {
    getStats().then(setStats).catch(() => addToast(t('dashboard.errors.loadFailed'), 'error'))
  }, [addToast, t])

  const requestIdRef = useRef(0)

  const loadPage = useCallback((p: number, filters?: ApplicationFilters) => {
    const f = filters ?? filtersRef.current
    filtersRef.current = f
    setLoading(true)
    setSelectedIds([])
    const reqId = ++requestIdRef.current
    getApplications(p, f)
      .then(res => {
        if (reqId !== requestIdRef.current) return
        setApps(res.results)
        setTotalCount(res.count)
        setPage(p)
      })
      .catch(() => { if (reqId === requestIdRef.current) addToast(t('dashboard.errors.loadFailed'), 'error') })
      .finally(() => { if (reqId === requestIdRef.current) setLoading(false) })
    loadStats()
  }, [addToast, t, loadStats])

  const handleFiltersChange = useCallback((filters: ApplicationFilters) => {
    loadPage(1, filters)
  }, [loadPage])

  const {
    search, setSearch,
    statusFilter, setStatusFilter,
    sourceFilter, setSourceFilter,
    dateAfter, setDateAfter,
    dateBefore, setDateBefore,
    sortKey, sortDir, handleSortChange,
  } = useApplicationFilters(handleFiltersChange)

  const reminders = useApplicationReminders(apps)
  const { order, dragIdx, onDragStart, onDragOver, onDragEnd } = useWidgetOrder()
  const { upcoming: interviewReminders, dismissAll: dismissInterviewReminders } = useInterviewReminders(apps)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Stats are loaded via loadPage() which is called on mount by useApplicationFilters

  async function handleAdd(data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    try {
      await createApplication(data)
      loadPage(1)
      addToast(t('dashboard.toast.added'))
    } catch {
      addToast(t('dashboard.errors.addFailed'), 'error')
    }
  }

  async function handleEdit(data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    if (!editTarget) return
    try {
      const updated = await updateApplication(editTarget.id, data)
      setApps(prev => prev.map(a => (a.id === editTarget.id ? updated : a)))
      addToast(t('dashboard.toast.saved'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }

  async function handleStatusChange(id: number, newStatus: ApplicationStatus) {
    try {
      const updated = await updateApplication(id, { status: newStatus })
      setApps(prev => prev.map(a => (a.id === id ? updated : a)))
      loadStats()
      addToast(t('dashboard.toast.statusUpdated'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }

  async function handleTogglePin(id: number) {
    try {
      const { is_pinned } = await togglePin(id)
      setApps(prev => prev.map(a => (a.id === id ? { ...a, is_pinned } : a)))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }

  async function handleApply(app: JobApplication) {
    if (!app.url || !isSafeUrl(app.url)) return
    window.open(app.url, '_blank', 'noopener')
    if (app.status === 'to_apply') {
      try {
        const updated = await updateApplication(app.id, { status: 'applied' })
        setApps(prev => prev.map(a => (a.id === app.id ? updated : a)))
        loadStats()
        addToast(t('dashboard.toast.statusUpdated'))
      } catch {
        addToast(t('dashboard.errors.editFailed'), 'error')
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteApplication(deleteTarget.id)
      const maxPage = Math.ceil((totalCount - 1) / PAGE_SIZE) || 1
      loadPage(Math.min(page, maxPage))
      setDeleteTarget(null)
      addToast(t('dashboard.toast.deleted'))
    } catch {
      addToast(t('dashboard.errors.deleteFailed'), 'error')
    }
  }

  // Bulk actions
  async function handleBulkUpdateStatus(status: ApplicationStatus) {
    try {
      const { updated } = await bulkUpdateStatus(selectedIds, status)
      addToast(t('dashboard.toast.bulkStatusUpdated', { count: updated }))
      setSelectedIds([])
      loadPage(page)
    } catch {
      addToast(t('dashboard.errors.bulkUpdateFailed'), 'error')
    }
  }

  async function handleBulkDelete() {
    try {
      const { deleted } = await bulkDelete(selectedIds)
      addToast(t('dashboard.toast.bulkDeleted', { count: deleted }))
      setSelectedIds([])
      const maxPage = Math.ceil((totalCount - selectedIds.length) / PAGE_SIZE) || 1
      loadPage(Math.min(page, maxPage))
    } catch {
      addToast(t('dashboard.errors.bulkDeleteFailed'), 'error')
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === apps.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(apps.map(a => a.id))
    }
  }

  return (
    <DashboardLayout>
      <Header
        title={t('dashboard.title')}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setView('table')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'table' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                aria-label={t('dashboard.viewTable')}
                aria-pressed={view === 'table'}
              >
                <TableIcon />
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`p-1.5 rounded-lg transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                aria-label={t('dashboard.viewKanban')}
                aria-pressed={view === 'kanban'}
              >
                <KanbanIcon />
              </button>
            </div>

            <Button variant="secondary" onClick={() => loadPage(page)}>
              <RefreshIcon />
            </Button>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <span className="hidden sm:inline">{t('import.import')}</span>
            </Button>
            <Button variant="secondary" onClick={() => exportApplicationsCsv(apps)}>
              <DownloadIcon />
              <span className="hidden sm:inline">{t('dashboard.exportCsv')}</span>
            </Button>
            <Button variant="secondary" onClick={() => exportPdf().catch(() => addToast(t('dashboard.errors.exportPdfFailed'), 'error'))}>
              <DownloadIcon />
              <span className="hidden sm:inline">{t('dashboard.exportPdf')}</span>
            </Button>
            <Button onClick={() => setAddOpen(true)}>
              <PlusIcon />
              <span className="hidden sm:inline">{t('dashboard.addApplication')}</span>
            </Button>
          </div>
        }
      />

      <ReminderBanner reminders={reminders} />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {order.map((key, idx) => {
          const config: Record<string, { label: string; value: string | number; color: 'text-gray-900' | 'text-indigo-600' | 'text-blue-600' | 'text-amber-600' | 'text-emerald-600' | 'text-red-500' | 'text-orange-500' }> = {
            total: { label: t('dashboard.stats.total'), value: stats.total, color: 'text-gray-900' },
            to_apply: { label: t('dashboard.stats.to_apply'), value: stats.to_apply ?? 0, color: 'text-indigo-600' },
            applied: { label: t('dashboard.stats.applied'), value: stats.applied, color: 'text-blue-600' },
            interview: { label: t('dashboard.stats.interview'), value: stats.interview, color: 'text-amber-600' },
            offer: { label: t('dashboard.stats.offer'), value: stats.offer, color: 'text-emerald-600' },
            rejected: { label: t('dashboard.stats.rejected'), value: stats.rejected, color: 'text-red-500' },
            withdrawn: { label: t('dashboard.stats.withdrawn'), value: stats.withdrawn, color: 'text-orange-500' },
          }
          const c = config[key]
          return (
            <DraggableStatCard
              key={key}
              label={c.label}
              value={c.value}
              color={c.color}
              index={idx}
              isDragging={dragIdx === idx}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            />
          )
        })}
      </div>

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        dateAfter={dateAfter}
        onDateAfterChange={setDateAfter}
        dateBefore={dateBefore}
        onDateBeforeChange={setDateBefore}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      ) : view === 'table' ? (
        <ApplicationsTable
          applications={apps}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          onTogglePin={handleTogglePin}
          onApply={handleApply}
        />
      ) : (
        <KanbanBoard
          applications={apps}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          onTogglePin={handleTogglePin}
          onStatusChange={handleStatusChange}
        />
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={p => loadPage(p)} />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onUpdateStatus={handleBulkUpdateStatus}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds([])}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => loadPage(1)}
      />

      <InterviewReminderPopup
        reminders={interviewReminders}
        onDismiss={dismissInterviewReminders}
      />

      <AddApplicationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      <AddApplicationModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        initialData={editTarget ?? undefined}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={t('dashboard.confirm.deleteTitle')}
        description={
          deleteTarget
            ? t('dashboard.confirm.deleteDescription', {
                company: deleteTarget.company,
                position: deleteTarget.position,
              })
            : ''
        }
        confirmLabel={t('dashboard.confirm.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ApplicationDrawer
        app={drawerApp}
        onClose={() => setDrawerApp(null)}
        onEdit={app => { setDrawerApp(null); setEditTarget(app) }}
        onDelete={app => { setDrawerApp(null); setDeleteTarget(app) }}
      />
    </DashboardLayout>
  )
}
