import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationStatus } from '../../types'
import Button from '../ui/Button'

interface Props {
  selectedCount: number
  onUpdateStatus: (status: ApplicationStatus) => void
  onDelete: () => void
  onClear: () => void
}

const STATUS_KEYS: ApplicationStatus[] = ['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

export default function BulkActionBar({ selectedCount, onUpdateStatus, onDelete, onClear }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<ApplicationStatus>('applied')

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl px-6 py-3 flex items-center gap-4">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {t('dashboard.bulk.selected', { count: selectedCount })}
      </span>

      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as ApplicationStatus)}
          className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
        >
          {STATUS_KEYS.map(s => (
            <option key={s} value={s}>{t(`dashboard.status.${s}`)}</option>
          ))}
        </select>
        <Button variant="secondary" onClick={() => onUpdateStatus(status)}>
          {t('dashboard.bulk.updateStatus')}
        </Button>
      </div>

      <Button variant="secondary" onClick={onDelete} className="!text-red-600 !border-red-200 hover:!bg-red-50">
        {t('dashboard.bulk.deleteSelected')}
      </Button>

      <button onClick={onClear} className="text-xs text-gray-400 hover:text-gray-600">
        Clear
      </button>
    </div>
  )
}
