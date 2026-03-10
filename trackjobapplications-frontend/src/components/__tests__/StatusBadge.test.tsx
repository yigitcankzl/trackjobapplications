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

  it('applies bg-indigo-50 class for to_apply', () => {
    const { container } = render(<StatusBadge status="to_apply" />)
    expect(container.firstChild).toHaveClass('bg-indigo-50')
  })

  it('applies bg-blue-50 class for applied', () => {
    const { container } = render(<StatusBadge status="applied" />)
    expect(container.firstChild).toHaveClass('bg-blue-50')
  })

  it('applies bg-amber-50 class for interview', () => {
    const { container } = render(<StatusBadge status="interview" />)
    expect(container.firstChild).toHaveClass('bg-amber-50')
  })

  it('applies bg-emerald-50 class for offer', () => {
    const { container } = render(<StatusBadge status="offer" />)
    expect(container.firstChild).toHaveClass('bg-emerald-50')
  })

  it('applies bg-red-50 class for rejected', () => {
    const { container } = render(<StatusBadge status="rejected" />)
    expect(container.firstChild).toHaveClass('bg-red-50')
  })

  it('applies bg-gray-100 class for withdrawn', () => {
    const { container } = render(<StatusBadge status="withdrawn" />)
    expect(container.firstChild).toHaveClass('bg-gray-100')
  })

  it('renders a span element', () => {
    render(<StatusBadge status="applied" />)
    expect(screen.getByText('dashboard.status.applied').tagName).toBe('SPAN')
  })
})
