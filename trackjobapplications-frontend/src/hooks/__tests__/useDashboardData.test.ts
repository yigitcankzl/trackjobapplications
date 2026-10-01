import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import useDashboardData from '../useDashboardData'
import { getApplications } from '../../services/applications'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }))
vi.mock('../../services/applications', () => ({
  getApplications: vi.fn(),
  getStats: vi.fn(() => Promise.resolve({})),
}))

const TOTAL = 250
vi.mocked(getApplications).mockImplementation(async (_f, page = 1, size = 100) => {
  const start = (page - 1) * size
  const ids = Array.from({ length: Math.max(0, Math.min(size, TOTAL - start)) }, (_, i) => start + i)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { count: TOTAL, next: null, previous: null, results: ids.map(id => ({ id }) as any) }
})

describe('useDashboardData batching', () => {
  it('loads every batch in order', async () => {
    const { result } = renderHook(() => useDashboardData())
    act(() => result.current.load({}))
    await waitFor(() => expect(result.current.loadingMore).toBe(false))
    await waitFor(() => expect(result.current.apps).toHaveLength(TOTAL))
    expect(result.current.apps.map(a => a.id)).toEqual(Array.from({ length: TOTAL }, (_, i) => i))
    expect(getApplications).toHaveBeenCalledTimes(3)
  })
})
