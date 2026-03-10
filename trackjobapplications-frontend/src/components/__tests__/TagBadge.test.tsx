import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TagBadge from '../dashboard/TagBadge'
import { Tag } from '../../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => opts ? `${k}:${opts.name}` : k }),
}))

const tag: Tag = { id: 1, name: 'Remote', color: '#3b82f6' }

describe('TagBadge', () => {
  it('renders the tag name', () => {
    render(<TagBadge tag={tag} />)
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('applies the tag color as background', () => {
    render(<TagBadge tag={tag} />)
    const badge = screen.getByText('Remote').closest('span')
    expect(badge).toHaveStyle({ backgroundColor: '#3b82f6' })
  })

  it('does not render remove button when onRemove is not provided', () => {
    render(<TagBadge tag={tag} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders remove button when onRemove is provided', () => {
    render(<TagBadge tag={tag} onRemove={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn()
    render(<TagBadge tag={tag} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('remove button has correct aria-label', () => {
    render(<TagBadge tag={tag} onRemove={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', expect.stringContaining('Remote'))
  })

  it('renders different tag name correctly', () => {
    render(<TagBadge tag={{ id: 2, name: 'On-site', color: '#10b981' }} />)
    expect(screen.getByText('On-site')).toBeInTheDocument()
  })
})
