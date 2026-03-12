import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationStatus } from '../../types'
import { STATUS_CONFIG } from '../../constants/applicationStatus'

export default memo(function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useTranslation()
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${config.className}`}>
      {t(`dashboard.status.${status}`)}
    </span>
  )
})
