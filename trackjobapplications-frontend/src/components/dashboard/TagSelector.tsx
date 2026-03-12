import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from '../../types'
import { getTags, createTag } from '../../services/tags'
import { useToast } from '../../context/ToastContext'

interface Props {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

export default function TagSelector({ selectedIds, onChange }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    let active = true
    getTags()
      .then(data => { if (active) setTags(data) })
      .catch(() => { if (active) addToast(t('detail.tags.loadFailed'), 'error') })
    return () => { active = false }
  }, [addToast, t])

  function toggle(id: number) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    )
  }

  async function handleCreate() {
    if (!newName.trim()) return
    try {
      const tag = await createTag({ name: newName.trim(), color: newColor })
      setTags(prev => [...prev, tag])
      onChange([...selectedIds, tag.id])
      setNewName('')
      setShowCreate(false)
    } catch {
      addToast(t('detail.tags.createFailed'), 'error')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              selectedIds.includes(tag.id)
                ? 'text-white border-transparent'
                : 'bg-transparent border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300'
            }`}
            style={selectedIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
          >
            {tag.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          {t('detail.tags.new')}
        </button>
      </div>
      {showCreate && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder={t('detail.tags.namePlaceholder')}
            className="px-2 py-1 text-xs rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 dark:text-stone-100 outline-none"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex gap-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-4 h-4 rounded-full ${newColor === c ? 'ring-2 ring-offset-1 ring-stone-400' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="button" onClick={handleCreate} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
            {t('detail.tags.add')}
          </button>
        </div>
      )}
    </div>
  )
}
