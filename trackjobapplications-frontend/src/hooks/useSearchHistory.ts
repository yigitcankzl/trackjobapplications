import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tj_search_history'
const MAX_ITEMS = 5

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function persist(items: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(load)

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setHistory(prev => {
      const next = [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, MAX_ITEMS)
      persist(next)
      return next
    })
  }, [])

  const removeSearch = useCallback((query: string) => {
    setHistory(prev => {
      const next = prev.filter(q => q !== query)
      persist(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setHistory([])
    persist([])
  }, [])

  return { history, addSearch, removeSearch, clearAll }
}
