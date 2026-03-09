import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import { useToast } from '../context/ToastContext'
import { CoverLetterTemplate } from '../types'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/coverLetters'
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from '../components/icons'
import Button from '../components/ui/Button'

const PLACEHOLDERS = ['{company}', '{position}', '{date}']

export default function CoverLettersPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CoverLetterTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', content: '' })
  const [preview, setPreview] = useState<CoverLetterTemplate | null>(null)
  const [deleting, setDeleting] = useState<CoverLetterTemplate | null>(null)

  useEffect(() => {
    let active = true
    getTemplates()
      .then(data => { if (active) { setTemplates(data); setLoading(false) } })
      .catch(() => { if (active) { addToast(t('coverLetters.errors.loadFailed'), 'error'); setLoading(false) } })
    return () => { active = false }
  }, [addToast, t])

  function openCreate() {
    setForm({ name: '', content: '' })
    setCreating(true)
    setEditing(null)
    setPreview(null)
  }

  function openEdit(tpl: CoverLetterTemplate) {
    setForm({ name: tpl.name, content: tpl.content })
    setEditing(tpl)
    setCreating(false)
    setPreview(null)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm({ name: '', content: '' })
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      addToast(t('coverLetters.errors.required'), 'error')
      return
    }
    try {
      if (editing) {
        const updated = await updateTemplate(editing.id, form)
        setTemplates(prev => prev.map(tpl => tpl.id === updated.id ? updated : tpl))
        addToast(t('coverLetters.toast.updated'), 'success')
      } else {
        const created = await createTemplate(form)
        setTemplates(prev => [created, ...prev])
        addToast(t('coverLetters.toast.created'), 'success')
      }
      closeForm()
    } catch {
      addToast(t('coverLetters.errors.saveFailed'), 'error')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const target = deleting
    try {
      await deleteTemplate(target.id)
      setTemplates(prev => prev.filter(tpl => tpl.id !== target.id))
      addToast(t('coverLetters.toast.deleted'), 'success')
      setDeleting(null)
      if (editing?.id === target.id) closeForm()
      if (preview?.id === target.id) setPreview(null)
    } catch {
      addToast(t('coverLetters.errors.deleteFailed'), 'error')
    }
  }

  function renderPreview(content: string) {
    return content
      .replace(/\{company\}/g, 'Acme Corp')
      .replace(/\{position\}/g, 'Software Engineer')
      .replace(/\{date\}/g, new Date().toLocaleDateString())
  }

  function insertPlaceholder(placeholder: string) {
    setForm(prev => ({ ...prev, content: prev.content + placeholder }))
  }

  const dismissDelete = useCallback(() => setDeleting(null), [])

  useEffect(() => {
    if (!deleting) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDeleting(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deleting])

  const isFormOpen = creating || !!editing

  return (
    <DashboardLayout>
      <Header title={t('coverLetters.title')} action={
        <Button onClick={openCreate}>
          <PlusIcon />
          {t('coverLetters.newTemplate')}
        </Button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template list */}
        <div className={`${isFormOpen || preview ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">{t('coverLetters.loading')}</div>
          ) : templates.length === 0 && !isFormOpen ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('coverLetters.empty.title')}</p>
              <p className="text-xs text-gray-400 mb-4">{t('coverLetters.empty.subtitle')}</p>
              <Button onClick={openCreate}>
                <PlusIcon />
                {t('coverLetters.newTemplate')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setPreview(tpl); setCreating(false); setEditing(null) }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPreview(tpl); setCreating(false); setEditing(null) } }}
                  className={`group bg-white dark:bg-gray-900 rounded-xl border shadow-sm p-4 cursor-pointer transition-all duration-200 ${
                    preview?.id === tpl.id || editing?.id === tpl.id
                      ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900'
                      : 'border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{tpl.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{tpl.content.slice(0, 120)}...</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(tpl) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleting(tpl) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-2">
                    {new Date(tpl.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor panel */}
        {isFormOpen && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {editing ? t('coverLetters.editTemplate') : t('coverLetters.createTemplate')}
              </h2>
              <button onClick={closeForm} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('coverLetters.form.name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('coverLetters.form.namePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t('coverLetters.form.content')}</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {PLACEHOLDERS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => insertPlaceholder(p)}
                      className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={14}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  placeholder={t('coverLetters.form.contentPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={closeForm}>{t('coverLetters.form.cancel')}</Button>
                <Button onClick={handleSave}>{t('coverLetters.form.save')}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview panel */}
        {preview && !isFormOpen && (
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{preview.name}</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(preview)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <EditIcon />
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {renderPreview(preview.content)}
            </div>
            <p className="text-xs text-gray-400 mt-3">{t('coverLetters.previewNote')}</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={dismissDelete}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-tpl-title" className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 id="delete-tpl-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('coverLetters.deleteConfirm.title')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('coverLetters.deleteConfirm.message', { name: deleting.name })}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>{t('coverLetters.form.cancel')}</Button>
              <Button variant="danger" onClick={handleDelete}>{t('coverLetters.deleteConfirm.confirm')}</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
