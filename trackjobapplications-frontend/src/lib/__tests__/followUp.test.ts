import { describe, it, expect } from 'vitest'
import { needsFollowUp } from '../followUp'
import { JobApplication } from '../../types'

function makeApp(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 1,
    company: 'Acme',
    position: 'Engineer',
    status: 'applied',
    applied_date: '2024-01-01',
    url: '',
    source: '',
    is_pinned: false,
    notes: '',
    tags: [],
    note_entries: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('needsFollowUp', () => {
  it('returns false for recently updated applied app', () => {
    expect(needsFollowUp(makeApp())).toBe(false)
  })

  it('returns true for applied app not updated in 3+ days', () => {
    const old = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    expect(needsFollowUp(makeApp({ updated_at: old }))).toBe(true)
  })

  it('returns true for interview app not updated in 3+ days', () => {
    const old = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    expect(needsFollowUp(makeApp({ status: 'interview', updated_at: old }))).toBe(true)
  })

  it('returns false for rejected app even if old', () => {
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(needsFollowUp(makeApp({ status: 'rejected', updated_at: old }))).toBe(false)
  })

  it('returns false for offer status', () => {
    const old = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    expect(needsFollowUp(makeApp({ status: 'offer', updated_at: old }))).toBe(false)
  })
})
