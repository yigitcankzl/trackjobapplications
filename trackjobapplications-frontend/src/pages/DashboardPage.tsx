import { useCallback, useMemo, useState } from 'react'
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
import { exportPdf } from '../services/applications'
import { ApplicationFilters, JobApplication, ViewMode } from '../types'
import { useToast } from '../context/ToastContext'
import { useApplicationFilters } from '../hooks/useApplicationFilters'
import { useApplicationReminders } from '../hooks/useApplicationReminders'
import { useWidgetOrder } from '../hooks/useWidgetOrder'
import { useInterviewReminders } from '../hooks/useInterviewReminders'
import useDashboardData from '../hooks/useDashboardData'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const {
    apps, page, totalPages, loading, stats, selectedIds,
    loadPage, handleAdd, handleEdit, handleStatusChange,
    handleTogglePin, handleDelete,
    handleBulkUpdateStatus, handleBulkDelete,
    toggleSelect, toggleSelectAll, setSelectedIds,
  } = useDashboardData()

  const [view, setView] = useState<ViewMode>('table')
  const [drawerApp, setDrawerApp] = useState<JobApplication | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null)
  const [importOpen, setImportOpen] = useState(false)

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

  const [pdfProgress, setPdfProgress] = useState<number | null>(null)

  const statConfig = useMemo(() => ({
    total:     { label: t('dashboard.stats.total'),     value: stats.total,           color: 'text-gray-900'   as const },
    to_apply:  { label: t('dashboard.stats.to_apply'),  value: stats.to_apply ?? 0,   color: 'text-indigo-600' as const },
    applied:   { label: t('dashboard.stats.applied'),   value: stats.applied,         color: 'text-blue-600'   as const },
    interview: { label: t('dashboard.stats.interview'), value: stats.interview,       color: 'text-amber-600'  as const },
    offer:     { label: t('dashboard.stats.offer'),     value: stats.offer,           color: 'text-emerald-600' as const },
    rejected:  { label: t('dashboard.stats.rejected'),  value: stats.rejected,        color: 'text-red-500'    as const },
    withdrawn: { label: t('dashboard.stats.withdrawn'), value: stats.withdrawn,       color: 'text-orange-500' as const },
  }), [t, stats])

  const reminders = useApplicationReminders(apps)
  const { order, dragIdx, onDragStart, onDragOver, onDragEnd } = useWidgetOrder()
  const { upcoming: interviewReminders, dismissAll: dismissInterviewReminders } = useInterviewReminders(apps)

  async function handleApply(app: JobApplication) {
    if (!app.url || !isSafeUrl(app.url)) return
    window.open(app.url, '_blank', 'noopener')
    if (app.status === 'to_apply') {
      handleStatusChange(app.id, 'applied')
    }
  }

  async function onDeleteConfirm() {
    if (!deleteTarget) return
    await handleDelete(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function onEditSubmit(data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    if (!editTarget) return
    await handleEdit(editTarget.id, data)
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
            <Button
              variant="secondary"
              disabled={pdfProgress !== null}
              onClick={async () => {
                setPdfProgress(0)
                try {
                  await exportPdf((pct) => setPdfProgress(pct))
                } catch (e) {
                  addToast(e instanceof Error ? e.message : t('dashboard.errors.exportPdfFailed'), 'error')
                } finally {
                  setPdfProgress(null)
                }
              }}
            >
              <DownloadIcon />
              <span className="hidden sm:inline">
                {pdfProgress !== null ? `${pdfProgress}%` : t('dashboard.exportPdf')}
              </span>
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
          const c = statConfig[key as keyof typeof statConfig]
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
        onSubmit={onEditSubmit}
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
        onConfirm={onDeleteConfirm}
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
