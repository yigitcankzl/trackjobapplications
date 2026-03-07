import { useEffect } from 'react'

export function useEscapeKey(onEscape: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [active, onEscape])
}
