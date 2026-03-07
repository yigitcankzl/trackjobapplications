import { useEffect, useRef, useState } from 'react'
import { ApplicationAttachment } from '../../types'
import { getAttachments, uploadAttachment, deleteAttachment } from '../../services/attachments'
import { useToast } from '../../context/ToastContext'

interface Props {
  applicationId: number
}

export default function AttachmentList({ applicationId }: Props) {
  const { addToast } = useToast()
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAttachments(applicationId).then(setAttachments).catch(() => addToast('Failed to load attachments', 'error'))
  }, [applicationId])

  async function handleUpload(files: FileList) {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const att = await uploadAttachment(applicationId, file)
        setAttachments(prev => [att, ...prev])
      }
    } catch {
      addToast('Failed to upload file', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAttachment(applicationId, id)
      setAttachments(prev => prev.filter(a => a.id !== id))
    } catch {
      addToast('Failed to delete file', 'error')
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
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Attachments</h3>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
      >
        <p className="text-xs text-gray-400">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-xs text-gray-300 mt-0.5">PDF, DOC, PNG, JPG, TXT (max 10MB)</p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={e => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span>{extIcon(att.name)}</span>
                <a
                  href={att.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline truncate"
                >
                  {att.name}
                </a>
              </div>
              <button onClick={() => handleDelete(att.id)} className="text-xs text-red-400 hover:text-red-600 ml-2">&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
