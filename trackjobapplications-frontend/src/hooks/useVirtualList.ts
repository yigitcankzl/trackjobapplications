import { useState, useCallback } from 'react'

export function useVirtualList({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  )

  const paddingTop = startIndex * itemHeight
  const paddingBottom = Math.max(0, (itemCount - endIndex - 1) * itemHeight)

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return { startIndex, endIndex, paddingTop, paddingBottom, handleScroll }
}
