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
    <div role="listbox" className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-100 dark:border-stone-700 py-1 z-50">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
          {t('dashboard.filters.recentSearches')}
        </span>
        <button
          onMouseDown={e => { e.preventDefault(); onClearAll() }}
          className="text-xs text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-colors"
        >
          {t('dashboard.filters.clearAll')}
        </button>
      </div>
      {history.map(query => (
        <div
          key={query}
          role="option"
          onMouseDown={e => e.preventDefault()}
          className="flex items-center justify-between px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
        >
          <button
            onMouseDown={e => { e.preventDefault(); onSelect(query) }}
            className="text-sm text-stone-700 dark:text-stone-300 truncate text-left flex-1"
          >
            {query}
          </button>
          <button
            onMouseDown={e => { e.preventDefault(); onRemove(query) }}
            className="p-0.5 text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400 flex-shrink-0 ml-2"
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
