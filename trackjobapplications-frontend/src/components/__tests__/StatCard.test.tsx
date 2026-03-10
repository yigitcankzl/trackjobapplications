import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../dashboard/StatCard'

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total" value={42} color="text-gray-900" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<StatCard label="Applied" value={7} color="text-blue-600" />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<StatCard label="Status" value="Active" color="text-emerald-600" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies the color class to the value element', () => {
    render(<StatCard label="Offer" value={3} color="text-emerald-600" />)
    expect(screen.getByText('3')).toHaveClass('text-emerald-600')
  })

  it('applies text-red-500 color', () => {
    render(<StatCard label="Rejected" value={5} color="text-red-500" />)
    expect(screen.getByText('5')).toHaveClass('text-red-500')
  })

  it('applies text-amber-600 color', () => {
    render(<StatCard label="Interview" value={2} color="text-amber-600" />)
    expect(screen.getByText('2')).toHaveClass('text-amber-600')
  })

  it('renders a container with rounded-2xl class', () => {
    const { container } = render(<StatCard label="Total" value={10} color="text-gray-900" />)
    expect(container.firstChild).toHaveClass('rounded-2xl')
  })

  it('renders value 0 correctly', () => {
    render(<StatCard label="Withdrawn" value={0} color="text-orange-500" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
