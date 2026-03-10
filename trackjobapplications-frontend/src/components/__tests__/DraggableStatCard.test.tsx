import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DraggableStatCard from '../dashboard/DraggableStatCard'

function setup(overrides: Partial<React.ComponentProps<typeof DraggableStatCard>> = {}) {
  const defaults = {
    label: 'Applied',
    value: 5,
    color: 'text-blue-600' as const,
    index: 2,
    isDragging: false,
    isKeyboardGrabbed: false,
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDragEnd: vi.fn(),
    onKeyboardGrab: vi.fn(),
    onKeyboardMove: vi.fn(),
    onKeyboardDrop: vi.fn(),
  }
  return { ...defaults, ...overrides, rendered: render(<DraggableStatCard {...defaults} {...overrides} />) }
}

describe('DraggableStatCard', () => {
  it('renders label and value via StatCard', () => {
    setup()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('has role="button" and tabIndex=0', () => {
    setup()
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('tabindex', '0')
  })

  it('aria-grabbed is false when not dragging/grabbed', () => {
    setup()
    expect(screen.getByRole('button')).toHaveAttribute('aria-grabbed', 'false')
  })

  it('aria-grabbed is true when isKeyboardGrabbed', () => {
    setup({ isKeyboardGrabbed: true })
    expect(screen.getByRole('button')).toHaveAttribute('aria-grabbed', 'true')
  })

  it('aria-grabbed is true when isDragging', () => {
    setup({ isDragging: true })
    expect(screen.getByRole('button')).toHaveAttribute('aria-grabbed', 'true')
  })

  it('applies opacity-40 when isDragging', () => {
    setup({ isDragging: true })
    expect(screen.getByRole('button')).toHaveClass('opacity-40')
  })

  it('applies ring-2 ring-blue-500 when isKeyboardGrabbed', () => {
    setup({ isKeyboardGrabbed: true })
    const el = screen.getByRole('button')
    expect(el).toHaveClass('ring-2')
    expect(el).toHaveClass('ring-blue-500')
  })

  it('calls onKeyboardGrab with index on Space when not grabbed', () => {
    const onKeyboardGrab = vi.fn()
    setup({ onKeyboardGrab })
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onKeyboardGrab).toHaveBeenCalledWith(2)
  })

  it('calls onKeyboardGrab with index on Enter when not grabbed', () => {
    const onKeyboardGrab = vi.fn()
    setup({ onKeyboardGrab })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onKeyboardGrab).toHaveBeenCalledWith(2)
  })

  it('calls onKeyboardMove("left") on ArrowLeft when grabbed', () => {
    const onKeyboardMove = vi.fn()
    setup({ isKeyboardGrabbed: true, onKeyboardMove })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' })
    expect(onKeyboardMove).toHaveBeenCalledWith('left')
  })

  it('calls onKeyboardMove("right") on ArrowRight when grabbed', () => {
    const onKeyboardMove = vi.fn()
    setup({ isKeyboardGrabbed: true, onKeyboardMove })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowRight' })
    expect(onKeyboardMove).toHaveBeenCalledWith('right')
  })

  it('calls onKeyboardDrop on Escape when grabbed', () => {
    const onKeyboardDrop = vi.fn()
    setup({ isKeyboardGrabbed: true, onKeyboardDrop })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Escape' })
    expect(onKeyboardDrop).toHaveBeenCalledTimes(1)
  })

  it('calls onKeyboardDrop on Space when grabbed', () => {
    const onKeyboardDrop = vi.fn()
    setup({ isKeyboardGrabbed: true, onKeyboardDrop })
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onKeyboardDrop).toHaveBeenCalledTimes(1)
  })

  it('does not call onKeyboardMove when not grabbed', () => {
    const onKeyboardMove = vi.fn()
    setup({ isKeyboardGrabbed: false, onKeyboardMove })
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' })
    expect(onKeyboardMove).not.toHaveBeenCalled()
  })
})
