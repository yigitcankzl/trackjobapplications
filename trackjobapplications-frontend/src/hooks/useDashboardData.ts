import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../context/ToastContext'
import {
  getApplications, createApplication, updateApplication, deleteApplication,
  bulkUpdateStatus, bulkDelete, togglePin, getStats, AppStats,
} from '../services/applications'
import { ApplicationFilters, ApplicationStatus, JobApplication } from '../types'

export default function useDashboardData() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [apps, setApps] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [stats, setStats] = useState<AppStats>({ total: 0, to_apply: 0, applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 })

  const filtersRef = useRef<ApplicationFilters>({})
  const requestIdRef = useRef(0)

  const loadStats = useCallback(() => {
    getStats().then(setStats).catch(() => addToast(t('dashboard.errors.loadFailed'), 'error'))
  }, [addToast, t])

  const load = useCallback((filters?: ApplicationFilters) => {
    const f = filters ?? filtersRef.current
    filtersRef.current = f
    setLoading(true)
    setSelectedIds([])
    const reqId = ++requestIdRef.current
    getApplications(f)
      .then(res => {
        if (reqId !== requestIdRef.current) return
        setApps(res.results)
      })
      .catch(() => { if (reqId === requestIdRef.current) addToast(t('dashboard.errors.loadFailed'), 'error') })
      .finally(() => { if (reqId === requestIdRef.current) setLoading(false) })
    loadStats()
  }, [addToast, t, loadStats])

  const handleAdd = useCallback(async (data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await createApplication(data)
      load()
      addToast(t('dashboard.toast.added'))
    } catch {
      addToast(t('dashboard.errors.addFailed'), 'error')
    }
  }, [load, addToast, t])

  const handleEdit = useCallback(async (id: number, data: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const updated = await updateApplication(id, data)
      setApps(prev => prev.map(a => (a.id === id ? updated : a)))
      addToast(t('dashboard.toast.saved'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }, [addToast, t])

  const handleStatusChange = useCallback(async (id: number, newStatus: ApplicationStatus) => {
    try {
      const updated = await updateApplication(id, { status: newStatus })
      setApps(prev => prev.map(a => (a.id === id ? updated : a)))
      loadStats()
      addToast(t('dashboard.toast.statusUpdated'))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }, [addToast, t, loadStats])

  const handleTogglePin = useCallback(async (id: number) => {
    try {
      const { is_pinned } = await togglePin(id)
      setApps(prev => prev.map(a => (a.id === id ? { ...a, is_pinned } : a)))
    } catch {
      addToast(t('dashboard.errors.editFailed'), 'error')
    }
  }, [addToast, t])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteApplication(id)
      load()
      addToast(t('dashboard.toast.deleted'))
    } catch {
      addToast(t('dashboard.errors.deleteFailed'), 'error')
    }
  }, [load, addToast, t])

  const handleBulkUpdateStatus = useCallback(async (status: ApplicationStatus) => {
    try {
      const { updated } = await bulkUpdateStatus(selectedIds, status)
      addToast(t('dashboard.toast.bulkStatusUpdated', { count: updated }))
      setSelectedIds([])
      load()
    } catch {
      addToast(t('dashboard.errors.bulkUpdateFailed'), 'error')
    }
  }, [selectedIds, load, addToast, t])

  const handleBulkDelete = useCallback(async () => {
    try {
      const { deleted } = await bulkDelete(selectedIds)
      addToast(t('dashboard.toast.bulkDeleted', { count: deleted }))
      setSelectedIds([])
      load()
    } catch {
      addToast(t('dashboard.errors.bulkDeleteFailed'), 'error')
    }
  }, [selectedIds, load, addToast, t])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === apps.length ? [] : apps.map(a => a.id)
    )
  }, [apps])

  return {
    apps, loading, stats, selectedIds,
    load, handleAdd, handleEdit, handleStatusChange,
    handleTogglePin, handleDelete,
    handleBulkUpdateStatus, handleBulkDelete,
    toggleSelect, toggleSelectAll, setSelectedIds,
  }
}
