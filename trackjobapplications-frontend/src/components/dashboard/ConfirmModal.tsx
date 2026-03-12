import { useTranslation } from 'react-i18next'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { WarningIcon } from '../icons'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const focusTrapRef = useFocusTrap(open)
  useEscapeKey(onCancel, open)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />

      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 w-full max-w-sm mx-4 p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <WarningIcon />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">{title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {t('dashboard.confirm.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            {confirmLabel ?? t('dashboard.confirm.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}
