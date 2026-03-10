import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWidgetOrder } from '../useWidgetOrder'

const DEFAULT_ORDER = ['total', 'to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('useWidgetOrder — initial state', () => {
  it('loads the default order when localStorage is empty', () => {
    const { result } = renderHook(() => useWidgetOrder())
    expect(result.current.order).toEqual(DEFAULT_ORDER)
  })

  it('loads a saved order from localStorage', () => {
    const saved = [...DEFAULT_ORDER].reverse()
    localStorage.setItem('tj_widget_order', JSON.stringify(saved))
    const { result } = renderHook(() => useWidgetOrder())
    expect(result.current.order).toEqual(saved)
  })

  it('falls back to default when localStorage has invalid data', () => {
    localStorage.setItem('tj_widget_order', 'not-json')
    const { result } = renderHook(() => useWidgetOrder())
    expect(result.current.order).toEqual(DEFAULT_ORDER)
  })

  it('falls back to default when saved order has wrong length', () => {
    localStorage.setItem('tj_widget_order', JSON.stringify(['total', 'applied']))
    const { result } = renderHook(() => useWidgetOrder())
    expect(result.current.order).toEqual(DEFAULT_ORDER)
  })
})

describe('useWidgetOrder — keyboard drag', () => {
  it('sets keyDragIdx on grab', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onKeyboardGrab(2) })
    expect(result.current.keyDragIdx).toBe(2)
  })

  it('moves item right', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onKeyboardGrab(0) })
    act(() => { result.current.onKeyboardMove('right') })
    expect(result.current.order[1]).toBe('total')
    expect(result.current.keyDragIdx).toBe(1)
  })

  it('moves item left', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onKeyboardGrab(1) })
    act(() => { result.current.onKeyboardMove('left') })
    expect(result.current.order[0]).toBe('to_apply')
    expect(result.current.keyDragIdx).toBe(0)
  })

  it('does not move left past index 0', () => {
    const { result } = renderHook(() => useWidgetOrder())
    const before = [...result.current.order]
    act(() => { result.current.onKeyboardGrab(0) })
    act(() => { result.current.onKeyboardMove('left') })
    expect(result.current.order).toEqual(before)
    expect(result.current.keyDragIdx).toBe(0)
  })

  it('does not move right past last index', () => {
    const { result } = renderHook(() => useWidgetOrder())
    const last = DEFAULT_ORDER.length - 1
    const before = [...result.current.order]
    act(() => { result.current.onKeyboardGrab(last) })
    act(() => { result.current.onKeyboardMove('right') })
    expect(result.current.order).toEqual(before)
    expect(result.current.keyDragIdx).toBe(last)
  })

  it('clears keyDragIdx on drop and saves to localStorage', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onKeyboardGrab(0) })
    act(() => { result.current.onKeyboardMove('right') })
    act(() => { result.current.onKeyboardDrop() })
    expect(result.current.keyDragIdx).toBeNull()
    const saved = JSON.parse(localStorage.getItem('tj_widget_order')!)
    expect(saved).toEqual(result.current.order)
  })

  it('multiple moves follow the grabbed item across positions', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onKeyboardGrab(0) })
    act(() => { result.current.onKeyboardMove('right') })
    act(() => { result.current.onKeyboardMove('right') })
    expect(result.current.keyDragIdx).toBe(2)
    expect(result.current.order[2]).toBe('total')
  })
})

describe('useWidgetOrder — mouse drag', () => {
  it('sets dragIdx on dragStart', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onDragStart(3) })
    expect(result.current.dragIdx).toBe(3)
  })

  it('reorders on dragOver and clears on dragEnd', () => {
    const { result } = renderHook(() => useWidgetOrder())
    act(() => { result.current.onDragStart(0) })
    act(() => {
      result.current.onDragOver(
        { preventDefault: vi.fn() } as unknown as React.DragEvent,
        2,
      )
    })
    expect(result.current.order[2]).toBe('total')
    act(() => { result.current.onDragEnd() })
    expect(result.current.dragIdx).toBeNull()
    const saved = JSON.parse(localStorage.getItem('tj_widget_order')!)
    expect(saved[2]).toBe('total')
  })
})
