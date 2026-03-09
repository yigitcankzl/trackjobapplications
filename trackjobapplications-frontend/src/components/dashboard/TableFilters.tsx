import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationSource, SortKey, StatusFilter } from '../../types'
import { SearchIcon, CloseIcon, ChevronUpIcon } from '../icons'
import { useSearchHistory } from '../../hooks/useSearchHistory'
import SearchHistoryDropdown from './SearchHistoryDropdown'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (v: StatusFilter) => void
  sourceFilter: ApplicationSource | ''
  onSourceFilterChange: (v: ApplicationSource | '') => void
  dateAfter: string
  onDateAfterChange: (v: string) => void
  dateBefore: string
  onDateBeforeChange: (v: string) => void
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSortChange: (key: SortKey) => void
}

const SOURCE_OPTIONS: { value: ApplicationSource | ''; label: string }[] = [
  { value: '', label: 'All Sources' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'referral', label: 'Referral' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'other', label: 'Other' },
]

export default function TableFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  dateAfter,
  onDateAfterChange,
  dateBefore,
  onDateBeforeChange,
  sortKey,
  sortDir,
  onSortChange,
}: Props) {
  const { t } = useTranslation()
  const { history, addSearch, removeSearch, clearAll } = useSearchHistory()
  const [searchFocused, setSearchFocused] = useState(false)

  const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('dashboard.status.all') },
    { value: 'to_apply', label: t('dashboard.status.to_apply') },
    { value: 'applied', label: t('dashboard.status.applied') },
    { value: 'interview', label: t('dashboard.status.interview') },
    { value: 'offer', label: t('dashboard.status.offer') },
    { value: 'rejected', label: t('dashboard.status.rejected') },
    { value: 'withdrawn', label: t('dashboard.status.withdrawn') },
  ]

  const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'date', label: t('dashboard.filters.sortDate') },
    { value: 'company', label: t('dashboard.filters.sortCompany') },
    { value: 'status', label: t('dashboard.filters.sortStatus') },
  ]

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Search + Source + Date range + Sort row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-0 sm:min-w-[200px] sm:max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('dashboard.filters.searchPlaceholder')}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => {
              if (e.key === 'Enter' && search.trim()) {
                addSearch(search)
              }
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-colors placeholder:text-gray-300 bg-white dark:bg-gray-900 dark:text-gray-100"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <CloseIcon />
            </button>
          )}
          <SearchHistoryDropdown
            history={history}
            onSelect={query => { onSearchChange(query); setSearchFocused(false) }}
            onRemove={removeSearch}
            onClearAll={clearAll}
            visible={searchFocused && !search}
          />
        </div>

        {/* Source filter */}
        <select
          value={sourceFilter}
          onChange={e => onSourceFilterChange(e.target.value as ApplicationSource | '')}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
        >
          {SOURCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateAfter}
            onChange={e => onDateAfterChange(e.target.value)}
            className="px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
          />
          <span className="text-gray-400 text-xs">—</span>
          <input
            type="date"
            value={dateBefore}
            onChange={e => onDateBeforeChange(e.target.value)}
            className="px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 outline-none focus:border-blue-400"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 sm:ml-auto">
          <span className="text-xs text-gray-400 font-medium">{t('dashboard.filters.sort')}</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortKey === opt.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {opt.label}
              {sortKey === opt.value && (
                <ChevronUpIcon flipped={sortDir === 'desc'} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
        {STATUS_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => onStatusFilterChange(chip.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === chip.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  )
}
