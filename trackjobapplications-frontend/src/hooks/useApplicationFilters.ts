import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApplicationFilters, ApplicationSource, SortKey, StatusFilter } from '../types'

const SORT_MAP: Record<SortKey, string> = {
  date: 'applied_date',
  company: 'company',
  status: 'status',
}

const STATUSES: StatusFilter[] = ['all', 'to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']
const SOURCES: ApplicationSource[] = ['linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'referral', 'company_website', 'other']

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * Filters live in the URL query string, so they survive back navigation,
 * reloads and links opened in a new tab.
 */
export function useApplicationFilters(onFiltersChange: (filters: ApplicationFilters) => void) {
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const statusFilter = oneOf(params.get('status'), STATUSES, 'all')
  const sourceFilter = oneOf<ApplicationSource | ''>(params.get('source'), SOURCES, '')
  const dateAfter = params.get('from') ?? ''
  const dateBefore = params.get('to') ?? ''
  const tagFilter = params.get('tag') ?? ''
  const sortKey = oneOf<SortKey>(params.get('sort'), ['date', 'company', 'status'], 'date')
  const sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc'

  // Batch changes into one navigation; separate setParams calls in the same tick would overwrite each other
  const update = useCallback((patch: Record<string, string>) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      return next
    }, { replace: true })
  }, [setParams])

  const setSearch = useCallback((v: string) => update({ q: v }), [update])
  const setStatusFilter = useCallback((v: StatusFilter) => update({ status: v === 'all' ? '' : v }), [update])
  const setSourceFilter = useCallback((v: ApplicationSource | '') => update({ source: v }), [update])
  const setDateAfter = useCallback((v: string) => update({ from: v }), [update])
  const setDateBefore = useCallback((v: string) => update({ to: v }), [update])
  const setTagFilter = useCallback((v: string) => update({ tag: v }), [update])

  function handleSortChange(key: SortKey) {
    const dir = sortKey === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc'
    update({ sort: key === 'date' ? '' : key, dir: dir === 'desc' ? '' : dir })
  }

  const buildFilters = useCallback((): ApplicationFilters => {
    const filters: ApplicationFilters = {}
    if (search) filters.search = search
    if (statusFilter !== 'all') filters.status = statusFilter
    if (sourceFilter) filters.source = sourceFilter
    if (dateAfter) filters.applied_date_after = dateAfter
    if (dateBefore) filters.applied_date_before = dateBefore
    if (tagFilter) filters.tags = tagFilter
    const prefix = sortDir === 'desc' ? '-' : ''
    filters.ordering = `${prefix}${SORT_MAP[sortKey]}`
    return filters
  }, [search, statusFilter, sourceFilter, dateAfter, dateBefore, tagFilter, sortKey, sortDir])

  const timerRef = useRef<ReturnType<typeof setTimeout>>()

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
  }, [statusFilter, sourceFilter, dateAfter, dateBefore, tagFilter, sortKey, sortDir])

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
    tagFilter,
    setTagFilter,
    sortKey,
    sortDir,
    handleSortChange,
    buildFilters,
  }
}
