import { useEffect, useRef, RefObject } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(active: boolean, initialFocusRef?: RefObject<HTMLElement | null>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return
    const el = containerRef.current

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Focus initial element or first focusable
    requestAnimationFrame(() => {
      const target = initialFocusRef?.current ?? el.querySelector<HTMLElement>(FOCUSABLE_SELECTORS)
      target?.focus()
    })

    // Body scroll lock
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Tab trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTab)

    return () => {
      document.removeEventListener('keydown', handleTab)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus()
    }
  }, [active, initialFocusRef])

  return containerRef
}
