import { useTranslation } from 'react-i18next'
import { SortKey, StatusFilter } from '../../types'
import { SearchIcon, CloseIcon, ChevronUpIcon } from '../icons'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (v: StatusFilter) => void
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSortChange: (key: SortKey) => void
}

export default function TableFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortKey,
  sortDir,
  onSortChange,
}: Props) {
  const { t } = useTranslation()

  const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: t('dashboard.status.all') },
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
      {/* Search + Sort row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={t('dashboard.filters.searchPlaceholder')}
            value={search}
            onChange={e => onSearchChange(e.target.value)}
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
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto">
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
      <div className="flex items-center gap-1.5 flex-wrap">
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
