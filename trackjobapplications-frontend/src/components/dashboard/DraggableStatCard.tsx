import { memo } from 'react'
import StatCard, { type StatCardColor } from './StatCard'

interface Props {
  label: string
  value: string | number
  color: StatCardColor
  index: number
  isDragging: boolean
  isKeyboardGrabbed: boolean
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDragEnd: () => void
  onKeyboardGrab: (idx: number) => void
  onKeyboardMove: (dir: 'left' | 'right') => void
  onKeyboardDrop: () => void
}

export default memo(function DraggableStatCard({
  label, value, color, index, isDragging, isKeyboardGrabbed,
  onDragStart, onDragOver, onDragEnd,
  onKeyboardGrab, onKeyboardMove, onKeyboardDrop,
}: Props) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (isKeyboardGrabbed) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onKeyboardMove('left') }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onKeyboardMove('right') }
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); onKeyboardDrop() }
    } else {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onKeyboardGrab(index) }
    }
  }

  return (
    <div
      draggable
      tabIndex={0}
      role="button"
      aria-grabbed={isKeyboardGrabbed || isDragging}
      aria-label={`${label}: ${value}. ${isKeyboardGrabbed ? 'Grabbed — use Arrow keys to reorder, Space or Enter to drop.' : 'Press Space or Enter to reorder with keyboard.'}`}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onKeyDown={handleKeyDown}
      className={`cursor-grab active:cursor-grabbing transition-all outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 rounded-lg ${
        isDragging ? 'opacity-40 scale-95' : ''
      } ${
        isKeyboardGrabbed ? 'ring-2 ring-stone-500 ring-offset-2 scale-105 shadow-lg' : ''
      }`}
    >
      <StatCard label={label} value={value} color={color} />
    </div>
  )
})
