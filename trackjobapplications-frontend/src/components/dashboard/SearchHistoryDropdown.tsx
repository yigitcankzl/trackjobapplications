import { useTranslation } from 'react-i18next'
import { CloseIcon } from '../icons'

interface Props {
  history: string[]
  onSelect: (query: string) => void
  onRemove: (query: string) => void
  onClearAll: () => void
  visible: boolean
}

export default function SearchHistoryDropdown({ history, onSelect, onRemove, onClearAll, visible }: Props) {
  const { t } = useTranslation()

  if (!visible || history.length === 0) return null

  return (
    <div role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
          {t('dashboard.filters.recentSearches')}
        </span>
        <button
          onMouseDown={e => { e.preventDefault(); onClearAll() }}
          className="text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
        >
          {t('dashboard.filters.clearAll')}
        </button>
      </div>
      {history.map(query => (
        <div
          key={query}
          role="option"
          onMouseDown={e => e.preventDefault()}
          className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <button
            onMouseDown={e => { e.preventDefault(); onSelect(query) }}
            className="text-sm text-gray-700 dark:text-gray-300 truncate text-left flex-1"
          >
            {query}
          </button>
          <button
            onMouseDown={e => { e.preventDefault(); onRemove(query) }}
            className="p-0.5 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 flex-shrink-0 ml-2"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
