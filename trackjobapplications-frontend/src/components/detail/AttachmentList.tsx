import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApplicationAttachment } from '../../types'
import { getAttachments, uploadAttachment, deleteAttachment } from '../../services/attachments'
import { useToast } from '../../context/ToastContext'
import { isSafeUrl } from '../../lib/url'

interface Props {
  applicationId: number
}

export default function AttachmentList({ applicationId }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let active = true
    getAttachments(applicationId)
      .then(data => { if (active) setAttachments(data) })
      .catch(() => { if (active) addToast(t('detail.attachmentList.loadFailed'), 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applicationId, addToast, t])

  async function handleUpload(files: FileList) {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const att = await uploadAttachment(applicationId, file)
        if (!mountedRef.current) return
        setAttachments(prev => [att, ...prev])
      }
    } catch {
      if (!mountedRef.current) return
      addToast(t('detail.attachmentList.uploadFailed'), 'error')
    } finally {
      if (mountedRef.current) setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAttachment(applicationId, id)
      if (!mountedRef.current) return
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch {
      if (!mountedRef.current) return
      addToast(t('detail.attachmentList.deleteFailed'), 'error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files)
  }

  const extIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['doc', 'docx'].includes(ext || '')) return '📝'
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return '🖼️'
    return '📎'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('detail.attachmentList.title')}</h3>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        <p className="text-xs text-gray-400">
          {uploading ? t('detail.attachmentList.uploading') : t('detail.attachmentList.dropOrClick')}
        </p>
        <p className="text-xs text-gray-300 mt-0.5">{t('detail.attachmentList.formats')}</p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={e => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span>{extIcon(att.name)}</span>
                {isSafeUrl(att.file) ? (
                  <a
                    href={att.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {att.name}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500 truncate">{att.name}</span>
                )}
              </div>
              <button onClick={() => handleDelete(att.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
