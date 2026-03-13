import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CoverLetterTemplate } from '../../types'
import { getTemplates } from '../../services/coverLetters'

interface Props {
  applicationId: number
}

export default function CoverLetterPanel({ applicationId }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [letters, setLetters] = useState<CoverLetterTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getTemplates()
      .then(data => { if (active) setLetters(data.filter(l => l.application === applicationId)) })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applicationId])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('detail.coverLetters.title')}</h3>
        <button
          onClick={() => navigate('/cover-letters')}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {t('detail.coverLetters.viewAll')}
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-stone-400">...</p>
      ) : letters.length === 0 ? (
        <p className="text-xs text-stone-400">{t('detail.coverLetters.empty')}</p>
      ) : (
        <div className="space-y-2">
          {letters.map(letter => (
            <div
              key={letter.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/cover-letters')}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/cover-letters') } }}
              className="p-3 rounded-lg border border-stone-100/60 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 cursor-pointer hover:border-stone-200 dark:hover:border-stone-700 transition-colors"
            >
              <h4 className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{letter.name}</h4>
              <p className="text-xs text-stone-400 mt-1 line-clamp-2">{letter.content.slice(0, 150)}...</p>
              <p className="text-xs text-stone-300 mt-1.5">{new Date(letter.updated_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
