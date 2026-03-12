import { useState, useCallback } from 'react'

interface Props {
  onFileDrop: (file: File) => void
  accept?: string
  label: string
  children: React.ReactNode
}

export default function DragDropZone({ onFileDrop, accept, label, children }: Props) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (accept) {
      const accepted = accept.split(',').map(a => a.trim())
      const matches = accepted.some(a => {
        if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', '/'))
        if (a.startsWith('.')) return file.name.toLowerCase().endsWith(a.toLowerCase())
        return file.type === a
      })
      if (!matches) return
    }
    onFileDrop(file)
  }, [accept, onFileDrop])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative rounded-lg transition-all ${
        isDragOver
          ? 'border-2 border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-2 border-transparent'
      }`}
    >
      {children}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-blue-50/80 dark:bg-blue-900/40 pointer-events-none">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{label}</span>
        </div>
      )}
    </div>
  )
}
