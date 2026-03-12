import { ApplicationStatus } from '../types'

/** Solid fill color for progress bars, dots, chart bars */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  to_apply: 'bg-indigo-500',
  applied: 'bg-stone-500',
  interview: 'bg-amber-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-400',
  withdrawn: 'bg-stone-300',
}

/** Text color per status */
export const STATUS_TEXT: Record<ApplicationStatus, string> = {
  to_apply: 'text-indigo-600',
  applied: 'text-stone-600',
  interview: 'text-amber-600',
  offer: 'text-emerald-600',
  rejected: 'text-red-500',
  withdrawn: 'text-stone-500',
}

/** Light background color per status */
export const STATUS_BG: Record<ApplicationStatus, string> = {
  to_apply: 'bg-indigo-50/70 dark:bg-indigo-950/30',
  applied: 'bg-stone-100 dark:bg-stone-800/40',
  interview: 'bg-amber-50/70 dark:bg-amber-950/30',
  offer: 'bg-emerald-50/70 dark:bg-emerald-950/30',
  rejected: 'bg-red-50/70 dark:bg-red-950/30',
  withdrawn: 'bg-stone-100 dark:bg-stone-800/40',
}

export const STATUS_CONFIG: Record<ApplicationStatus, { className: string }> = {
  to_apply: { className: 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200/60 dark:ring-indigo-800/60' },
  applied: { className: 'bg-stone-100 dark:bg-stone-800/40 text-stone-600 dark:text-stone-400 ring-1 ring-stone-200 dark:ring-stone-700' },
  interview: { className: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/60' },
  offer: { className: 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/60' },
  rejected: { className: 'bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-1 ring-red-200/60 dark:ring-red-800/60' },
  withdrawn: { className: 'bg-stone-100 dark:bg-stone-800/40 text-stone-500 dark:text-stone-500 ring-1 ring-stone-200 dark:ring-stone-700' },
}

export const STATUS_KEYS: ApplicationStatus[] = Object.keys(STATUS_CONFIG) as ApplicationStatus[]
