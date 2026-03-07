import { useTranslation } from 'react-i18next'
import { ApplicationSource } from '../../types'
import { SOURCE_CONFIG } from '../../constants/applicationSource'

interface Props {
  source: ApplicationSource
}

export default function SourceBadge({ source }: Props) {
  const { t } = useTranslation()
  const config = SOURCE_CONFIG[source]

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {t(`source.${source}`)}
    </span>
  )
}
