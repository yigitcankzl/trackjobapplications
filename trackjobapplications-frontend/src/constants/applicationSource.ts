import { ApplicationSource } from '../types'

export const SOURCE_CONFIG: Record<ApplicationSource, { className: string; color: string }> = {
  linkedin: { className: 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 ring-1 ring-sky-200 dark:ring-sky-800', color: 'bg-sky-600' },
  indeed: { className: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800', color: 'bg-violet-600' },
  glassdoor: { className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800', color: 'bg-emerald-600' },
  referral: { className: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 ring-1 ring-yellow-200 dark:ring-yellow-800', color: 'bg-yellow-500' },
  company_website: { className: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400 ring-1 ring-fuchsia-200 dark:ring-fuchsia-800', color: 'bg-fuchsia-500' },
  other: { className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400 ring-1 ring-zinc-200 dark:ring-zinc-700', color: 'bg-zinc-400' },
}

export const SOURCE_KEYS: ApplicationSource[] = Object.keys(SOURCE_CONFIG) as ApplicationSource[]
