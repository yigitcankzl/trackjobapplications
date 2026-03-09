import { useState, useCallback, useRef } from 'react'

const STORAGE_KEY = 'tj_widget_order'
const DEFAULT_ORDER = ['total', 'to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

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
  const dragIdxRef = useRef<number | null>(null)

  const onDragStart = useCallback((idx: number) => {
    dragIdxRef.current = idx
    setDragIdx(idx)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const cur = dragIdxRef.current
    if (cur === null || cur === idx) return
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(cur, 1)
      next.splice(idx, 0, moved)
      return next
    })
    dragIdxRef.current = idx
    setDragIdx(idx)
  }, [])

  const onDragEnd = useCallback(() => {
    dragIdxRef.current = null
    setDragIdx(null)
    setOrder(prev => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prev)) } catch { /* quota */ }
      return prev
    })
  }, [])

  return { order, dragIdx, onDragStart, onDragOver, onDragEnd }
}
