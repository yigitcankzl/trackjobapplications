import { memo } from 'react'

export type StatCardColor =
  | 'text-stone-900'
  | 'text-slate-600'
  | 'text-teal-600'
  | 'text-orange-500'
  | 'text-lime-600'
  | 'text-rose-500'
  | 'text-zinc-500'

interface Props {
  label: string
  value: string | number
  color: StatCardColor
}

export default memo(function StatCard({ label, value, color }: Props) {
  const accentMap: Record<string, string> = {
    'text-stone-900': 'bg-stone-400',
    'text-slate-600': 'bg-slate-500',
    'text-teal-600': 'bg-teal-600',
    'text-orange-500': 'bg-orange-500',
    'text-lime-600': 'bg-lime-600',
    'text-rose-500': 'bg-rose-500',
    'text-zinc-500': 'bg-zinc-400',
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg p-5 border border-stone-200/60 dark:border-stone-800 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accentMap[color] ?? 'bg-stone-400'}`} />
      <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2 pl-2">{label}</p>
      <p className={`text-3xl font-bold pl-2 ${color === 'text-stone-900' ? 'text-stone-900 dark:text-stone-100' : color}`}>{value}</p>
    </div>
  )
})
