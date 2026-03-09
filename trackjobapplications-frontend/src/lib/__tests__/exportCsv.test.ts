import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportApplicationsCsv } from '../exportCsv'
import { JobApplication } from '../../types'

function makeApp(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 1,
    company: 'Acme',
    position: 'Engineer',
    status: 'applied',
    applied_date: '2024-01-15',
    url: 'https://example.com',
    source: '',
    is_pinned: false,
    notes: 'Good fit',
    tags: [],
    note_entries: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    ...overrides,
  }
}

describe('exportApplicationsCsv', () => {
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement)
    vi.spyOn(document.body, 'appendChild').mockImplementation(n => n)
    vi.spyOn(document.body, 'removeChild').mockImplementation(n => n)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('triggers download for valid apps', () => {
    exportApplicationsCsv([makeApp()])
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })

  it('sanitizes formula injection in company name', () => {
    const blobSpy = vi.spyOn(globalThis, 'Blob').mockImplementation(
      (parts) => ({ parts } as unknown as Blob)
    )
    exportApplicationsCsv([makeApp({ company: '=CMD("calc")' })])
    const csv = (blobSpy.mock.calls[0][0] as string[])[0]
    expect(csv).toContain("'=CMD")
    expect(csv).not.toMatch(/^=CMD/m)
    blobSpy.mockRestore()
  })

  it('handles empty app list', () => {
    exportApplicationsCsv([])
    expect(clickSpy).toHaveBeenCalledOnce()
  })
})
