import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVirtualList } from '../useVirtualList'

describe('useVirtualList', () => {
  const defaults = { itemCount: 100, itemHeight: 50, containerHeight: 300 }

  it('starts at index 0 with no scroll', () => {
    const { result } = renderHook(() => useVirtualList(defaults))
    expect(result.current.startIndex).toBe(0)
  })

  it('renders enough items to fill the container plus overscan', () => {
    const { result } = renderHook(() => useVirtualList({ ...defaults, overscan: 3 }))
    // container shows 300/50=6 items, plus 3 overscan below = endIndex >= 8
    expect(result.current.endIndex).toBeGreaterThanOrEqual(8)
  })

  it('paddingTop is 0 at scroll position 0', () => {
    const { result } = renderHook(() => useVirtualList(defaults))
    expect(result.current.paddingTop).toBe(0)
  })

  it('paddingBottom accounts for offscreen items below', () => {
    const { result } = renderHook(() => useVirtualList(defaults))
    const total = defaults.itemCount * defaults.itemHeight
    expect(result.current.paddingTop + result.current.paddingBottom).toBeLessThan(total)
  })

  it('updates startIndex and paddingTop after scrolling', () => {
    const { result } = renderHook(() => useVirtualList({ ...defaults, overscan: 0 }))

    act(() => {
      const fakeEvent = { currentTarget: { scrollTop: 500 } } as React.UIEvent<HTMLElement>
      result.current.handleScroll(fakeEvent)
    })

    // scrollTop 500 / itemHeight 50 = item 10 → startIndex should be 10 (overscan=0)
    expect(result.current.startIndex).toBe(10)
    expect(result.current.paddingTop).toBe(10 * 50)
  })

  it('clamps startIndex to 0 even with large overscan', () => {
    const { result } = renderHook(() => useVirtualList({ ...defaults, overscan: 100 }))
    expect(result.current.startIndex).toBe(0)
  })

  it('clamps endIndex to itemCount - 1', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 5, itemHeight: 50, containerHeight: 10000 }),
    )
    expect(result.current.endIndex).toBe(4)
  })

  it('paddingBottom is 0 when all items are visible', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 3, itemHeight: 50, containerHeight: 500 }),
    )
    expect(result.current.paddingBottom).toBe(0)
  })

  it('paddingTop + rendered height + paddingBottom equals total height', () => {
    const { result } = renderHook(() => useVirtualList({ ...defaults, overscan: 0 }))

    act(() => {
      result.current.handleScroll({ currentTarget: { scrollTop: 250 } } as React.UIEvent<HTMLElement>)
    })

    const { startIndex, endIndex, paddingTop, paddingBottom } = result.current
    const renderedHeight = (endIndex - startIndex + 1) * defaults.itemHeight
    const total = paddingTop + renderedHeight + paddingBottom
    expect(total).toBe(defaults.itemCount * defaults.itemHeight)
  })

  it('handleScroll is stable across renders', () => {
    const { result, rerender } = renderHook(() => useVirtualList(defaults))
    const first = result.current.handleScroll
    rerender()
    expect(result.current.handleScroll).toBe(first)
  })
})
