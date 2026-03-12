import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../dashboard/StatCard'

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total" value={42} color="text-stone-900" />)
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<StatCard label="Applied" value={7} color="text-teal-600" />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders a string value', () => {
    render(<StatCard label="Status" value="Active" color="text-lime-600" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies the color class to the value element', () => {
    render(<StatCard label="Offer" value={3} color="text-lime-600" />)
    expect(screen.getByText('3')).toHaveClass('text-lime-600')
  })

  it('applies text-rose-500 color', () => {
    render(<StatCard label="Rejected" value={5} color="text-rose-500" />)
    expect(screen.getByText('5')).toHaveClass('text-rose-500')
  })

  it('applies text-orange-500 color', () => {
    render(<StatCard label="Interview" value={2} color="text-orange-500" />)
    expect(screen.getByText('2')).toHaveClass('text-orange-500')
  })

  it('renders a container with rounded-lg class', () => {
    const { container } = render(<StatCard label="Total" value={10} color="text-stone-900" />)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })

  it('renders value 0 correctly', () => {
    render(<StatCard label="Withdrawn" value={0} color="text-zinc-500" />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
