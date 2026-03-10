import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearchHistory } from '../useSearchHistory'

beforeEach(() => { localStorage.clear() })

describe('useSearchHistory', () => {
  it('starts empty when localStorage is empty', () => {
    const { result } = renderHook(() => useSearchHistory())
    expect(result.current.history).toEqual([])
  })

  it('adds a search query', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('react') })
    expect(result.current.history).toEqual(['react'])
  })

  it('prepends new queries (most recent first)', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('first') })
    act(() => { result.current.addSearch('second') })
    expect(result.current.history[0]).toBe('second')
  })

  it('deduplicates: moves existing query to the front', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('a') })
    act(() => { result.current.addSearch('b') })
    act(() => { result.current.addSearch('a') })
    expect(result.current.history).toEqual(['a', 'b'])
  })

  it('ignores blank/whitespace-only queries', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('   ') })
    expect(result.current.history).toEqual([])
  })

  it('caps history at 5 items', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => {
      ['a', 'b', 'c', 'd', 'e', 'f'].forEach(q => result.current.addSearch(q))
    })
    expect(result.current.history).toHaveLength(5)
    expect(result.current.history[0]).toBe('f')
  })

  it('removes a specific query', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('keep') })
    act(() => { result.current.addSearch('remove') })
    act(() => { result.current.removeSearch('remove') })
    expect(result.current.history).toEqual(['keep'])
  })

  it('clearAll empties the history', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('x') })
    act(() => { result.current.clearAll() })
    expect(result.current.history).toEqual([])
  })

  it('persists to localStorage on add', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => { result.current.addSearch('persist-me') })
    const saved = JSON.parse(localStorage.getItem('tj_search_history')!)
    expect(saved).toContain('persist-me')
  })

  it('loads existing history from localStorage on mount', () => {
    localStorage.setItem('tj_search_history', JSON.stringify(['preloaded']))
    const { result } = renderHook(() => useSearchHistory())
    expect(result.current.history).toContain('preloaded')
  })
})
