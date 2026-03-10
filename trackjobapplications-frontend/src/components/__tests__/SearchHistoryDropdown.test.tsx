import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchHistoryDropdown from '../dashboard/SearchHistoryDropdown'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

const history = ['react developer', 'frontend engineer', 'typescript']

function setup(props: Partial<React.ComponentProps<typeof SearchHistoryDropdown>> = {}) {
  const defaults = {
    history,
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onClearAll: vi.fn(),
    visible: true,
  }
  return { ...defaults, ...props, rendered: render(<SearchHistoryDropdown {...defaults} {...props} />) }
}

describe('SearchHistoryDropdown', () => {
  it('renders nothing when visible is false', () => {
    const { rendered: { container } } = setup({ visible: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when history is empty', () => {
    const { rendered: { container } } = setup({ history: [] })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders all history items when visible', () => {
    setup()
    expect(screen.getByText('react developer')).toBeInTheDocument()
    expect(screen.getByText('frontend engineer')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('renders a listbox role', () => {
    setup()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('renders option roles for each item', () => {
    setup()
    expect(screen.getAllByRole('option')).toHaveLength(history.length)
  })

  it('calls onSelect when a history item button fires mousedown', () => {
    const onSelect = vi.fn()
    setup({ onSelect })
    // The select button uses onMouseDown
    fireEvent.mouseDown(screen.getByText('react developer'))
    expect(onSelect).toHaveBeenCalledWith('react developer')
  })

  it('calls onClearAll when clear all button fires mousedown', () => {
    const onClearAll = vi.fn()
    setup({ onClearAll })
    fireEvent.mouseDown(screen.getByText('dashboard.filters.clearAll'))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })

  it('calls onRemove when remove button fires mousedown', () => {
    const onRemove = vi.fn()
    setup({ onRemove })
    // Each option row has a remove button (CloseIcon)
    const removeBtns = screen.getAllByRole('button').filter(
      btn => !btn.textContent || btn.textContent === ''
    )
    fireEvent.mouseDown(removeBtns[0])
    expect(onRemove).toHaveBeenCalledWith('react developer')
  })

  it('shows the recent searches header', () => {
    setup()
    expect(screen.getByText('dashboard.filters.recentSearches')).toBeInTheDocument()
  })
})
