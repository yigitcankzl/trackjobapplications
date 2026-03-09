import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '../../types'

interface Props {
  tag: Tag
  onRemove?: () => void
}

export default memo(function TagBadge({ tag, onRemove }: Props) {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70" aria-label={t('detail.tags.removeTag', { name: tag.name })}>
          &times;
        </button>
      )}
    </span>
  )
})
