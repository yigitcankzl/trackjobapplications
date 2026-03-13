import { useEffect, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import { useToast } from '../context/ToastContext'
import { CoverLetterTemplate } from '../types'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/coverLetters'
import { getApplicationsBrief, type ApplicationBrief } from '../services/applications'
import { PlusIcon, EditIcon, TrashIcon, CloseIcon, DownloadIcon } from '../components/icons'
import Button from '../components/ui/Button'

export default function CoverLettersPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [letters, setLetters] = useState<CoverLetterTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CoverLetterTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', content: '', application: null as number | null })
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState<CoverLetterTemplate | null>(null)
  const [apps, setApps] = useState<ApplicationBrief[]>([])

  useEffect(() => {
    let active = true
    Promise.all([getTemplates(), getApplicationsBrief()])
      .then(([tpl, appList]) => { if (active) { setLetters(tpl); setApps(appList); setLoading(false) } })
      .catch(() => { if (active) { addToast(t('coverLetters.errors.loadFailed'), 'error'); setLoading(false) } })
    return () => { active = false }
  }, [addToast, t])

  function openCreate() {
    setForm({ name: '', content: '', application: null })
    setCreating(true)
    setEditing(null)
    setCopied(false)
  }

  function openEdit(letter: CoverLetterTemplate) {
    setForm({ name: letter.name, content: letter.content, application: letter.application })
    setEditing(letter)
    setCreating(false)
    setCopied(false)
  }

  function closeForm() {
    setCreating(false)
    setEditing(null)
    setForm({ name: '', content: '', application: null })
  }

  function exportPdf() {
    const w = window.open('', '_blank')
    if (!w) return
    const escaped = form.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const paragraphs = escaped.split(/\n\n+/).map(p => {
      const lines = p.split(/\n/).join('<br/>')
      return `<p>${lines}</p>`
    }).join('')
    const title = (form.name || 'Cover Letter').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #111; }
  .page { max-width: 700px; margin: 0 auto; padding: 40px 0; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1.5px solid #333; }
  .header h1 { font-size: 18pt; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 6px; }
  .header .date { font-size: 10pt; color: #555; }
  .content p { margin-bottom: 14px; text-align: justify; }
  .content p:last-child { margin-bottom: 0; }
  @media print { .page { padding: 2.5cm; max-width: none; } }
  @media screen { body { background: #f5f5f5; } .page { background: #fff; padding: 60px 50px; margin: 30px auto; box-shadow: 0 1px 6px rgba(0,0,0,0.12); } }
</style></head><body><div class="page"><div class="header"><h1>${title}</h1><div class="date">${date}</div></div><div class="content">${paragraphs}</div></div></body></html>`)
    w.document.close()
    setTimeout(() => { w.print() }, 300)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      addToast(t('coverLetters.errors.required'), 'error')
      return
    }
    const payload = { name: form.name, content: form.content, application: form.application }
    try {
      if (editing) {
        const updated = await updateTemplate(editing.id, payload)
        setLetters(prev => prev.map(l => l.id === updated.id ? updated : l))
        addToast(t('coverLetters.toast.updated'), 'success')
      } else {
        const created = await createTemplate(payload)
        setLetters(prev => [created, ...prev])
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
      setLetters(prev => prev.filter(l => l.id !== target.id))
      addToast(t('coverLetters.toast.deleted'), 'success')
      setDeleting(null)
      if (editing?.id === target.id) closeForm()
    } catch {
      addToast(t('coverLetters.errors.deleteFailed'), 'error')
    }
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
          {t('coverLetters.new')}
        </Button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Letter list */}
        <div className={`${isFormOpen ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm">{t('coverLetters.loading')}</div>
          ) : letters.length === 0 && !isFormOpen ? (
            <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">{t('coverLetters.empty.title')}</p>
              <p className="text-xs text-stone-400 mb-4">{t('coverLetters.empty.subtitle')}</p>
              <Button onClick={openCreate}>
                <PlusIcon />
                {t('coverLetters.new')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {letters.map(letter => (
                <div
                  key={letter.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEdit(letter)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(letter) } }}
                  className={`group bg-white dark:bg-stone-900 rounded-lg border shadow-sm p-4 cursor-pointer transition-all duration-200 ${
                    editing?.id === letter.id
                      ? 'border-teal-200 dark:border-teal-800 ring-1 ring-teal-100 dark:ring-teal-900'
                      : 'border-stone-100/60 dark:border-stone-800 hover:shadow-md hover:border-stone-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{letter.name}</h3>
                      {letter.application_company && (
                        <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{letter.application_company} — {letter.application_position}</p>
                      )}
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">{letter.content.slice(0, 120)}...</p>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(letter) }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleting(letter) }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-stone-300 mt-2">
                    {new Date(letter.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor panel */}
        {isFormOpen && (
          <div className="lg:col-span-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                {editing ? t('coverLetters.edit') : t('coverLetters.create')}
              </h2>
              <button onClick={closeForm} className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">{t('coverLetters.form.name')}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
                  placeholder={t('coverLetters.form.namePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">{t('coverLetters.form.application')}</label>
                <select
                  value={form.application ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, application: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none"
                >
                  <option value="">{t('coverLetters.form.noApplication')}</option>
                  {apps.map(a => (
                    <option key={a.id} value={a.id}>{a.company} — {a.position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1">{t('coverLetters.form.content')}</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={14}
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none resize-none"
                  placeholder={t('coverLetters.form.contentPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-2">
                {form.content.trim() && (
                  <>
                    <button
                      onClick={exportPdf}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1"
                    >
                      <DownloadIcon />
                      {t('coverLetters.exportPdf')}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(form.content)
                          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
                          .catch(() => {})
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                    >
                      {copied ? t('coverLetters.copied') : t('coverLetters.copy')}
                    </button>
                  </>
                )}
                <Button variant="secondary" onClick={closeForm}>{t('coverLetters.form.cancel')}</Button>
                <Button onClick={handleSave}>{t('coverLetters.form.save')}</Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={dismissDelete}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-cl-title" className="bg-white dark:bg-stone-900 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 id="delete-cl-title" className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2">{t('coverLetters.deleteConfirm.title')}</h3>
            <p className="text-xs text-stone-500 mb-4">{t('coverLetters.deleteConfirm.message', { name: deleting.name })}</p>
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
