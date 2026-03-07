import { ApplicationSource } from '../types'

export const SOURCE_CONFIG: Record<ApplicationSource, { className: string; color: string }> = {
  linkedin: { className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', color: 'bg-blue-500' },
  indeed: { className: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200', color: 'bg-purple-500' },
  glassdoor: { className: 'bg-green-50 text-green-700 ring-1 ring-green-200', color: 'bg-green-500' },
  referral: { className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', color: 'bg-amber-500' },
  company_website: { className: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200', color: 'bg-cyan-500' },
  other: { className: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200', color: 'bg-gray-400' },
}

export const SOURCE_KEYS: ApplicationSource[] = Object.keys(SOURCE_CONFIG) as ApplicationSource[]
