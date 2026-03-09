import { memo } from 'react'

type StatCardColor =
  | 'text-gray-900'
  | 'text-blue-600'
  | 'text-amber-600'
  | 'text-emerald-600'
  | 'text-red-500'

interface Props {
  label: string
  value: string | number
  color: StatCardColor
}

export default memo(function StatCard({ label, value, color }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
})
