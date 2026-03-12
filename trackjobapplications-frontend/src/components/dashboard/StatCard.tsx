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
  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg p-5 border border-stone-200 dark:border-stone-800">
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color === 'text-stone-900' ? 'text-stone-900 dark:text-stone-100' : color}`}>{value}</p>
    </div>
  )
})
