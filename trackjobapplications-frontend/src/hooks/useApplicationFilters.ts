import { useCallback, useEffect, useRef, useState } from 'react'
import { ApplicationFilters, ApplicationSource, SortKey, StatusFilter } from '../types'

const SORT_MAP: Record<SortKey, string> = {
  date: 'applied_date',
  company: 'company',
  status: 'status',
}

export function useApplicationFilters(onFiltersChange: (filters: ApplicationFilters) => void) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<ApplicationSource | ''>('')
  const [dateAfter, setDateAfter] = useState('')
  const [dateBefore, setDateBefore] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  function handleSortChange(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const buildFilters = useCallback((): ApplicationFilters => {
    const filters: ApplicationFilters = {}
    if (search) filters.search = search
    if (statusFilter !== 'all') filters.status = statusFilter
    if (sourceFilter) filters.source = sourceFilter
    if (dateAfter) filters.applied_date_after = dateAfter
    if (dateBefore) filters.applied_date_before = dateBefore
    const prefix = sortDir === 'desc' ? '-' : ''
    filters.ordering = `${prefix}${SORT_MAP[sortKey]}`
    return filters
  }, [search, statusFilter, sourceFilter, dateAfter, dateBefore, sortKey, sortDir])

  // Debounce search, immediate for other filters
  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onFiltersChange(buildFilters())
    }, 300)
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Immediate trigger for non-search filters
  useEffect(() => {
    onFiltersChange(buildFilters())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sourceFilter, dateAfter, dateBefore, sortKey, sortDir])

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    dateAfter,
    setDateAfter,
    dateBefore,
    setDateBefore,
    sortKey,
    sortDir,
    handleSortChange,
    buildFilters,
  }
}
