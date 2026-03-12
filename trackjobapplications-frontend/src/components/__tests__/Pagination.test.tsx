import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../ui/Pagination'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

const onPageChange = vi.fn()

function setup(page: number, totalPages: number) {
  return render(<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />)
}

describe('Pagination', () => {
  it('renders nothing when totalPages <= 1', () => {
    const { container } = setup(1, 1)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when totalPages is 0', () => {
    const { container } = setup(1, 0)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders page buttons for small range', () => {
    setup(1, 3)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('highlights the current page', () => {
    setup(2, 3)
    expect(screen.getByRole('button', { name: '2' })).toHaveClass('bg-stone-900')
    expect(screen.getByRole('button', { name: '1' })).not.toHaveClass('bg-stone-900')
  })

  it('disables prev button on first page', () => {
    setup(1, 3)
    expect(screen.getByRole('button', { name: 'pagination.prev' })).toBeDisabled()
  })

  it('disables next button on last page', () => {
    setup(3, 3)
    expect(screen.getByRole('button', { name: 'pagination.next' })).toBeDisabled()
  })

  it('enables prev/next on a middle page', () => {
    setup(2, 5)
    expect(screen.getByRole('button', { name: 'pagination.prev' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: 'pagination.next' })).not.toBeDisabled()
  })

  it('calls onPageChange with page - 1 on prev click', () => {
    onPageChange.mockClear()
    setup(3, 5)
    fireEvent.click(screen.getByRole('button', { name: 'pagination.prev' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page + 1 on next click', () => {
    onPageChange.mockClear()
    setup(2, 5)
    fireEvent.click(screen.getByRole('button', { name: 'pagination.next' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with the clicked page number', () => {
    onPageChange.mockClear()
    setup(1, 3)
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('shows ellipsis for large page ranges', () => {
    setup(1, 10)
    expect(screen.getAllByText('...').length).toBeGreaterThan(0)
  })

  it('always shows first and last page buttons', () => {
    setup(5, 10)
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument()
  })
})
