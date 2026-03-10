import { useState, useCallback, useRef } from 'react'

const STORAGE_KEY = 'tj_widget_order'
const DEFAULT_ORDER = ['total', 'to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_ORDER.length &&
        parsed.every(k => DEFAULT_ORDER.includes(k))
      ) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

function saveOrder(order: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)) } catch { /* quota */ }
}

export function useWidgetOrder() {
  const [order, setOrder] = useState<string[]>(loadOrder)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [keyDragIdx, setKeyDragIdx] = useState<number | null>(null)
  const dragIdxRef = useRef<number | null>(null)
  const keyDragIdxRef = useRef<number | null>(null)

  // ── Mouse drag ──────────────────────────────────────────────
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
    setOrder(prev => { saveOrder(prev); return prev })
  }, [])

  // ── Keyboard drag ────────────────────────────────────────────
  const onKeyboardGrab = useCallback((idx: number) => {
    keyDragIdxRef.current = idx
    setKeyDragIdx(idx)
  }, [])

  const onKeyboardMove = useCallback((dir: 'left' | 'right') => {
    const idx = keyDragIdxRef.current
    if (idx === null) return
    const targetIdx = dir === 'left' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= DEFAULT_ORDER.length) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
      return next
    })
    keyDragIdxRef.current = targetIdx
    setKeyDragIdx(targetIdx)
  }, [])

  const onKeyboardDrop = useCallback(() => {
    keyDragIdxRef.current = null
    setKeyDragIdx(null)
    setOrder(prev => { saveOrder(prev); return prev })
  }, [])

  return { order, dragIdx, keyDragIdx, onDragStart, onDragOver, onDragEnd, onKeyboardGrab, onKeyboardMove, onKeyboardDrop }
}
