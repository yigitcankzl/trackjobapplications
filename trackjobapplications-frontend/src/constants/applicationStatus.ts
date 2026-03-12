import { ApplicationStatus } from '../types'

/** Solid fill color for progress bars, dots, chart bars */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  to_apply: 'bg-slate-500',
  applied: 'bg-teal-600',
  interview: 'bg-orange-500',
  offer: 'bg-lime-600',
  rejected: 'bg-rose-500',
  withdrawn: 'bg-zinc-400',
}

/** Text color per status */
export const STATUS_TEXT: Record<ApplicationStatus, string> = {
  to_apply: 'text-slate-600',
  applied: 'text-teal-700',
  interview: 'text-orange-600',
  offer: 'text-lime-700',
  rejected: 'text-rose-600',
  withdrawn: 'text-zinc-500',
}

/** Light background color per status */
export const STATUS_BG: Record<ApplicationStatus, string> = {
  to_apply: 'bg-slate-50 dark:bg-slate-900/30',
  applied: 'bg-teal-50 dark:bg-teal-950/30',
  interview: 'bg-orange-50 dark:bg-orange-950/30',
  offer: 'bg-lime-50 dark:bg-lime-950/30',
  rejected: 'bg-rose-50 dark:bg-rose-950/30',
  withdrawn: 'bg-zinc-100 dark:bg-zinc-800/40',
}

export const STATUS_CONFIG: Record<ApplicationStatus, { className: string }> = {
  to_apply: { className: 'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700' },
  applied: { className: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 ring-1 ring-teal-200 dark:ring-teal-800' },
  interview: { className: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800' },
  offer: { className: 'bg-lime-50 dark:bg-lime-950/30 text-lime-700 dark:text-lime-400 ring-1 ring-lime-200 dark:ring-lime-800' },
  rejected: { className: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800' },
  withdrawn: { className: 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-500 ring-1 ring-zinc-200 dark:ring-zinc-700' },
}

export const STATUS_KEYS: ApplicationStatus[] = Object.keys(STATUS_CONFIG) as ApplicationStatus[]
