import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../dashboard/StatusBadge'
import { ApplicationStatus } from '../../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

describe('StatusBadge', () => {
  const statuses: ApplicationStatus[] = ['to_apply', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']

  it.each(statuses)('renders translation key for status "%s"', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(`dashboard.status.${status}`)).toBeInTheDocument()
  })

  it('applies bg-indigo class for to_apply', () => {
    const { container } = render(<StatusBadge status="to_apply" />)
    expect(container.firstChild?.className).toContain('bg-indigo-50')
  })

  it('applies bg-stone class for applied', () => {
    const { container } = render(<StatusBadge status="applied" />)
    expect(container.firstChild?.className).toContain('bg-stone-100')
  })

  it('applies bg-amber class for interview', () => {
    const { container } = render(<StatusBadge status="interview" />)
    expect(container.firstChild?.className).toContain('bg-amber-50')
  })

  it('applies bg-emerald class for offer', () => {
    const { container } = render(<StatusBadge status="offer" />)
    expect(container.firstChild?.className).toContain('bg-emerald-50')
  })

  it('applies bg-red class for rejected', () => {
    const { container } = render(<StatusBadge status="rejected" />)
    expect(container.firstChild?.className).toContain('bg-red-50')
  })

  it('applies bg-stone-100 class for withdrawn', () => {
    const { container } = render(<StatusBadge status="withdrawn" />)
    expect(container.firstChild?.className).toContain('bg-stone-100')
  })

  it('renders a span element', () => {
    render(<StatusBadge status="applied" />)
    expect(screen.getByText('dashboard.status.applied').tagName).toBe('SPAN')
  })
})
