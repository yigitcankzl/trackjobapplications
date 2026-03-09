import { memo } from 'react'
import StatCard, { type StatCardColor } from './StatCard'

interface Props {
  label: string
  value: string | number
  color: StatCardColor
  index: number
  isDragging: boolean
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent, idx: number) => void
  onDragEnd: () => void
}

export default memo(function DraggableStatCard({
  label, value, color, index, isDragging,
  onDragStart, onDragOver, onDragEnd,
}: Props) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      className={`cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-40 scale-95' : ''}`}
    >
      <StatCard label={label} value={value} color={color} />
    </div>
  )
})
