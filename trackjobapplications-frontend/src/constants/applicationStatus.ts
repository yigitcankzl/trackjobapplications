import { ApplicationStatus } from '../types'

/** Solid fill color for progress bars, dots, chart bars */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  to_apply: 'bg-indigo-500',
  applied: 'bg-blue-500',
  interview: 'bg-amber-400',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-400',
  withdrawn: 'bg-gray-300',
}

/** Text color per status */
export const STATUS_TEXT: Record<ApplicationStatus, string> = {
  to_apply: 'text-indigo-600',
  applied: 'text-blue-600',
  interview: 'text-amber-600',
  offer: 'text-emerald-600',
  rejected: 'text-red-500',
  withdrawn: 'text-gray-500',
}

/** Light background color per status */
export const STATUS_BG: Record<ApplicationStatus, string> = {
  to_apply: 'bg-indigo-50 dark:bg-indigo-950/40',
  applied: 'bg-blue-50 dark:bg-blue-950/40',
  interview: 'bg-amber-50 dark:bg-amber-950/40',
  offer: 'bg-emerald-50 dark:bg-emerald-950/40',
  rejected: 'bg-red-50 dark:bg-red-950/40',
  withdrawn: 'bg-gray-50 dark:bg-gray-800/40',
}

export const STATUS_CONFIG: Record<ApplicationStatus, { className: string }> = {
  to_apply: { className: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800' },
  applied: { className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800' },
  interview: { className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800' },
  offer: { className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800' },
  rejected: { className: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800' },
  withdrawn: { className: 'bg-gray-100 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700' },
}

export const STATUS_KEYS: ApplicationStatus[] = Object.keys(STATUS_CONFIG) as ApplicationStatus[]
