import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '../../types'

interface Props {
  tag: Tag
  onRemove?: () => void
  /** Makes the badge a button, e.g. to filter by this tag */
  onClick?: () => void
}

export default memo(function TagBadge({ tag, onRemove, onClick }: Props) {
  const { t } = useTranslation()
  const className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClick() }}
        className={`${className} hover:opacity-80 transition-opacity`}
        style={{ backgroundColor: tag.color }}
        title={t('dashboard.filters.filterByTag', { name: tag.name })}
      >
        {tag.name}
      </button>
    )
  }
  return (
    <span className={className} style={{ backgroundColor: tag.color }}>
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70" aria-label={t('detail.tags.removeTag', { name: tag.name })}>
          &times;
        </button>
      )}
    </span>
  )
})
