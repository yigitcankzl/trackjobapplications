import { memo } from 'react'

export type StatCardColor =
  | 'text-stone-900'
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
}

export default memo(function StatCard({ label, value, color }: Props) {
  const accentMap: Record<string, string> = {
    'text-stone-900': 'bg-stone-400',
    'text-indigo-600': 'bg-indigo-500',
    'text-blue-600': 'bg-blue-500',
    'text-amber-600': 'bg-amber-500',
    'text-emerald-600': 'bg-emerald-500',
    'text-red-500': 'bg-red-500',
    'text-orange-500': 'bg-orange-500',
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg p-5 border border-stone-200/60 dark:border-stone-800 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accentMap[color] ?? 'bg-stone-400'}`} />
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 pl-2">{label}</p>
      <p className={`text-3xl font-bold pl-2 ${color === 'text-stone-900' ? 'text-stone-900 dark:text-stone-100' : color}`}>{value}</p>
    </div>
  )
})
