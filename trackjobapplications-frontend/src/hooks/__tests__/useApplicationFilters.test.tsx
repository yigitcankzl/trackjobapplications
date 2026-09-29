import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { useApplicationFilters } from '../useApplicationFilters'

function setup(url: string) {
  const onChange = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  const { result } = renderHook(() => ({ filters: useApplicationFilters(onChange), location: useLocation() }), { wrapper })
  return { result, onChange }
}

describe('useApplicationFilters', () => {
  it('restores filters from the URL', () => {
    const { result, onChange } = setup('/dashboard?q=acme&status=interview&tag=3&sort=company&dir=asc')
    expect(result.current.filters.search).toBe('acme')
    expect(result.current.filters.statusFilter).toBe('interview')
    expect(onChange).toHaveBeenCalledWith({
      search: 'acme', status: 'interview', tags: '3', ordering: 'company',
    })
  })

  it('ignores invalid values', () => {
    const { result } = setup('/dashboard?status=bogus&sort=nope&source=evil')
    expect(result.current.filters.statusFilter).toBe('all')
    expect(result.current.filters.sortKey).toBe('date')
    expect(result.current.filters.sourceFilter).toBe('')
  })

  it('writes changes to the URL, dropping defaults', () => {
    const { result } = setup('/dashboard?status=offer')
    act(() => result.current.filters.setTagFilter('7'))
    act(() => result.current.filters.setStatusFilter('all'))
    act(() => result.current.filters.handleSortChange('company'))
    expect(result.current.location.search).toBe('?tag=7&sort=company&dir=asc')
  })
})
