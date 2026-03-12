import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '../ui/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('defaults to primary variant', () => {
    render(<Button>X</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-stone-900')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">X</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('text-stone-600')
    expect(btn).not.toHaveClass('bg-stone-900')
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-red-600')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>X</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('adds opacity class when disabled', () => {
    render(<Button disabled>X</Button>)
    expect(screen.getByRole('button')).toHaveClass('opacity-50')
  })

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>X</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>X</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('merges custom className', () => {
    render(<Button className="custom-cls">X</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-cls')
  })

  it('forwards extra HTML attributes', () => {
    render(<Button type="submit">X</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
