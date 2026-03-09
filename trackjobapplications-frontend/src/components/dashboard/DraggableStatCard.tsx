import StatCard from './StatCard'

type StatCardColor =
  | 'text-gray-900'
  | 'text-indigo-600'
  | 'text-blue-600'
  | 'text-amber-600'
  | 'text-emerald-600'
  | 'text-red-500'
  | 'text-orange-500'

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

export default function DraggableStatCard({
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
}
