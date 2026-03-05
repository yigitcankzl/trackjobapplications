import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import StatCard from '../components/dashboard/StatCard'
import ApplicationsTable from '../components/dashboard/ApplicationsTable'
import KanbanBoard from '../components/dashboard/KanbanBoard'
import AddApplicationModal from '../components/dashboard/AddApplicationModal'
import ConfirmModal from '../components/dashboard/ConfirmModal'
import TableFilters from '../components/dashboard/TableFilters'
import ApplicationDrawer from '../components/dashboard/ApplicationDrawer'
import ReminderBanner from '../components/dashboard/ReminderBanner'
import Button from '../components/ui/Button'
import { PlusIcon, TableIcon, KanbanIcon } from '../components/icons'
import { getApplications, createApplication, updateApplication, deleteApplication } from '../services/applications'
import { ApplicationStatus, JobApplication, ViewMode } from '../types'
import { useToast } from '../context/ToastContext'
import { useApplicationFilters } from '../hooks/useApplicationFilters'
import { useApplicationReminders } from '../hooks/useApplicationReminders'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [apps, setApps] = useState<JobApplication[]>([])

  const [view, setView] = useState<ViewMode>('table')
  const [drawerApp, setDrawerApp] = useState<JobApplication | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<JobApplication | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null)

  const { search, setSearch, statusFilter, setStatusFilter, sortKey, sortDir, handleSortChange, filtered } =
    useApplicationFilters(apps)
  const reminders = useApplicationReminders(apps)

  useEffect(() => {
    getApplications()
      .then(setApps)
      .catch(() => addToast(t('dashboard.errors.loadFailed'), 'error'))
  }, [addToast, t])

  const stats = useMemo(() => ({
    total: apps.length,
    applied: apps.filter(a => a.status === 'applied').length,
    interview: apps.filter(a => a.status === 'interview').length,
    offer: apps.filter(a => a.status === 'offer').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  }), [apps])

  async function handleAdd(data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const created = await createApplication(data)
      setApps(prev => [created, ...prev])
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
      addToast(t('dashboard.toast.statusUpdated'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteApplication(deleteTarget.id)
      setApps(prev => prev.filter(a => a.id !== deleteTarget.id))
      setDeleteTarget(null)
      addToast(t('dashboard.toast.deleted'))
    } catch {
      addToast(t('dashboard.errors.deleteFailed'), 'error')
    }
  }

  return (
    <DashboardLayout>
      <Header
        title={t('dashboard.title')}
        action={
          <div className="flex items-center gap-2">
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

            <Button onClick={() => setAddOpen(true)}>
              <PlusIcon />
              {t('dashboard.addApplication')}
            </Button>
          </div>
        }
      />

      <ReminderBanner reminders={reminders} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label={t('dashboard.stats.total')} value={stats.total} color="text-gray-900" />
        <StatCard label={t('dashboard.stats.applied')} value={stats.applied} color="text-blue-600" />
        <StatCard label={t('dashboard.stats.interview')} value={stats.interview} color="text-amber-600" />
        <StatCard label={t('dashboard.stats.offer')} value={stats.offer} color="text-emerald-600" />
        <StatCard label={t('dashboard.stats.rejected')} value={stats.rejected} color="text-red-500" />
      </div>

      <TableFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />

      {view === 'table' ? (
        <ApplicationsTable
          applications={filtered}
          onView={setDrawerApp}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      ) : (
        <KanbanBoard
          applications={filtered}
          onView={setDrawerApp}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          onStatusChange={handleStatusChange}
        />
      )}

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
