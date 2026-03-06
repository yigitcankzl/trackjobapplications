import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tj_widget_order'
const DEFAULT_ORDER = ['total', 'applied', 'interview', 'offer', 'rejected']

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

export function useWidgetOrder() {
  const [order, setOrder] = useState<string[]>(loadOrder)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const onDragStart = useCallback((idx: number) => {
    setDragIdx(idx)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragIdx(idx)
  }, [dragIdx])

  const onDragEnd = useCallback(() => {
    setDragIdx(null)
    setOrder(prev => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prev))
      return prev
    })
  }, [])

  return { order, dragIdx, onDragStart, onDragOver, onDragEnd }
}
