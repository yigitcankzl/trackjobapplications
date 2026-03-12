import { ApplicationSource } from '../types'

export const SOURCE_CONFIG: Record<ApplicationSource, { className: string; color: string }> = {
  linkedin: { className: 'bg-blue-50/70 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 ring-1 ring-blue-200/60 dark:ring-blue-800/60', color: 'bg-blue-500' },
  indeed: { className: 'bg-purple-50/70 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 ring-1 ring-purple-200/60 dark:ring-purple-800/60', color: 'bg-purple-500' },
  glassdoor: { className: 'bg-green-50/70 text-green-700 dark:bg-green-950/30 dark:text-green-400 ring-1 ring-green-200/60 dark:ring-green-800/60', color: 'bg-green-500' },
  referral: { className: 'bg-amber-50/70 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/60', color: 'bg-amber-500' },
  company_website: { className: 'bg-cyan-50/70 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 ring-1 ring-cyan-200/60 dark:ring-cyan-800/60', color: 'bg-cyan-500' },
  other: { className: 'bg-stone-100 text-stone-600 dark:bg-stone-800/40 dark:text-stone-400 ring-1 ring-stone-200 dark:ring-stone-700', color: 'bg-stone-400' },
}

export const SOURCE_KEYS: ApplicationSource[] = Object.keys(SOURCE_CONFIG) as ApplicationSource[]
