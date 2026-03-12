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

  it('applies bg-slate class for to_apply', () => {
    const { container } = render(<StatusBadge status="to_apply" />)
    expect(container.firstChild?.className).toContain('bg-slate-50')
  })

  it('applies bg-teal class for applied', () => {
    const { container } = render(<StatusBadge status="applied" />)
    expect(container.firstChild?.className).toContain('bg-teal-50')
  })

  it('applies bg-orange class for interview', () => {
    const { container } = render(<StatusBadge status="interview" />)
    expect(container.firstChild?.className).toContain('bg-orange-50')
  })

  it('applies bg-lime class for offer', () => {
    const { container } = render(<StatusBadge status="offer" />)
    expect(container.firstChild?.className).toContain('bg-lime-50')
  })

  it('applies bg-rose class for rejected', () => {
    const { container } = render(<StatusBadge status="rejected" />)
    expect(container.firstChild?.className).toContain('bg-rose-50')
  })

  it('applies bg-zinc-100 class for withdrawn', () => {
    const { container } = render(<StatusBadge status="withdrawn" />)
    expect(container.firstChild?.className).toContain('bg-zinc-100')
  })

  it('renders a span element', () => {
    render(<StatusBadge status="applied" />)
    expect(screen.getByText('dashboard.status.applied').tagName).toBe('SPAN')
  })
})
