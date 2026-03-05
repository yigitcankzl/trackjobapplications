import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationNote } from '../../types'
import { getNotes, createNote, deleteNote } from '../../services/applications'
import { TrashIcon } from '../icons'
import { useToast } from '../../context/ToastContext'

interface Props {
  applicationId: number
}

export default function NoteTimeline({ applicationId }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [notes, setNotes] = useState<ApplicationNote[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getNotes(applicationId).then(setNotes).catch(() => {})
  }, [applicationId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const note = await createNote(applicationId, content.trim())
      setNotes(prev => [note, ...prev])
      setContent('')
    } catch {
      addToast(t('dashboard.notes.addFailed'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(noteId: number) {
    try {
      await deleteNote(applicationId, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch {
      addToast(t('dashboard.notes.deleteFailed'), 'error')
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {t('dashboard.notes.title')}
      </h3>

      {/* Add note form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('dashboard.notes.placeholder')}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {t('dashboard.notes.add')}
        </button>
      </form>

      {/* Timeline */}
      {notes.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('dashboard.notes.empty')}</p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="flex gap-3 group">
              <div className="flex flex-col items-center pt-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
              </div>
              <div className="flex-1 pb-3">
                <p className="text-sm text-gray-800 dark:text-gray-200">{note.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(note.created_at)}</span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                    aria-label={t('dashboard.aria.delete')}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
