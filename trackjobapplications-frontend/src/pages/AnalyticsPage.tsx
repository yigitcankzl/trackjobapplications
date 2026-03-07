import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import StatCard from '../components/dashboard/StatCard'
import { useToast } from '../context/ToastContext'
import { getAllApplications } from '../services/applications'
import { ApplicationSource, ApplicationStatus, JobApplication } from '../types'
import { STATUS_COLORS, STATUS_TEXT, STATUS_BG } from '../constants/applicationStatus'
import { SOURCE_CONFIG, SOURCE_KEYS } from '../constants/applicationSource'
import { formatMonthYear } from '../lib/dates'
import { ChevronRightIcon } from '../components/icons'

const STATUSES: ApplicationStatus[] = ['applied', 'interview', 'offer', 'rejected', 'withdrawn']

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [apps, setApps] = useState<JobApplication[]>([])

  useEffect(() => {
    getAllApplications()
      .then(setApps)
      .catch(() => addToast(t('dashboard.errors.loadFailed'), 'error'))
  }, [addToast, t])

  const counts: Record<ApplicationStatus, number> = {
    applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0,
  }
  for (const app of apps) {
    counts[app.status] += 1
  }

  const total = apps.length
  const interviewRate = total > 0 ? Math.round((counts.interview + counts.offer) / total * 100) : 0
  const offerRate = total > 0 ? Math.round(counts.offer / total * 100) : 0
  const maxCount = Math.max(...Object.values(counts), 1)

  const [timeView, setTimeView] = useState<'weekly' | 'monthly'>('monthly')

  const monthMap: Record<string, number> = {}
  for (const app of apps) {
    const key = app.applied_date.slice(0, 7)
    monthMap[key] = (monthMap[key] ?? 0) + 1
  }
  const byMonth = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b))
  const maxMonthCount = Math.max(...byMonth.map(([, c]) => c), 1)

  const byWeek = useMemo(() => {
    const weekMap: Record<string, number> = {}
    for (const app of apps) {
      const [y, m, dd] = app.applied_date.split('-').map(Number)
      const d = new Date(y, m - 1, dd)
      const dow = d.getDay()
      const diff = d.getDate() - dow + (dow === 0 ? -6 : 1)
      const monday = new Date(d)
      monday.setDate(diff)
      const key = monday.toISOString().slice(0, 10)
      weekMap[key] = (weekMap[key] ?? 0) + 1
    }
    return Object.entries(weekMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  }, [apps])
  const maxWeekCount = Math.max(...byWeek.map(([, c]) => c), 1)

  return (
    <DashboardLayout>
      <Header title={t('analytics.title')} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label={t('analytics.totalApplications')} value={total} color="text-gray-900" />
        <StatCard label={t('analytics.interviewRate')} value={`${interviewRate}%`} color="text-amber-600" />
        <StatCard label={t('analytics.offerRate')} value={`${offerRate}%`} color="text-emerald-600" />
        <StatCard label={t('analytics.active')} value={counts.applied + counts.interview} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-5">{t('analytics.statusDistribution')}</h2>
          <div className="space-y-3.5">
            {STATUSES.map(status => {
              const count = counts[status]
              const pct = Math.round(count / maxCount * 100)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${STATUS_TEXT[status]}`}>
                      {t(`dashboard.status.${status}`)}
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${STATUS_COLORS[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-3">
            {STATUSES.map(status => (
              <div key={status} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${STATUS_BG[status]}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[status]}`} />
                <span className={`text-xs font-semibold ${STATUS_TEXT[status]}`}>
                  {t(`dashboard.status.${status}`)} — {total > 0 ? Math.round(counts[status] / total * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Applications over time */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('analytics.applicationsOverTime')}</h2>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setTimeView('weekly')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  timeView === 'weekly' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {t('analytics.weekly')}
              </button>
              <button
                onClick={() => setTimeView('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  timeView === 'monthly' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {t('analytics.monthly')}
              </button>
            </div>
          </div>
          {(() => {
            const data = timeView === 'monthly' ? byMonth : byWeek
            const maxVal = timeView === 'monthly' ? maxMonthCount : maxWeekCount
            if (data.length === 0) {
              return <div className="flex items-center justify-center h-40 text-sm text-gray-400">{t('analytics.noData')}</div>
            }
            return (
              <div className="flex items-end gap-3 h-44">
                {data.map(([key, count]) => {
                  const heightPct = Math.round(count / maxVal * 100)
                  const label = timeView === 'monthly'
                    ? formatMonthYear(key)
                    : (() => { const [wy, wm, wd] = key.split('-').map(Number); return new Date(wy, wm - 1, wd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })()
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{count}</span>
                      <div className="w-full relative" style={{ height: '120px' }}>
                        <div
                          className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 text-center leading-tight">{label}</span>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-5">{t('analytics.pipeline')}</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {(['applied', 'interview', 'offer'] as ApplicationStatus[]).map((status, i, arr) => {
            const count = counts[status]
            const prev = i === 0 ? total : counts[arr[i - 1]]
            const convRate = prev > 0 ? Math.round(count / prev * 100) : 0
            return (
              <div key={status} className="flex items-center flex-1 min-w-0">
                <div className={`flex-1 rounded-xl p-4 text-center ${STATUS_BG[status]}`}>
                  <p className={`text-2xl font-bold ${STATUS_TEXT[status]}`}>{count}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{t(`dashboard.status.${status}`)}</p>
                  {i > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{convRate}{t('analytics.conversion')}</p>
                  )}
                </div>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 flex-shrink-0 mx-1">
                    <ChevronRightIcon />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Source distribution */}
      {(() => {
        const sourceCounts: Partial<Record<ApplicationSource, number>> = {}
        for (const app of apps) {
          if (app.source) {
            sourceCounts[app.source] = (sourceCounts[app.source] ?? 0) + 1
          }
        }
        const entries = SOURCE_KEYS.filter(k => sourceCounts[k]).map(k => [k, sourceCounts[k]!] as const)
        if (entries.length === 0) return null
        const maxSrc = Math.max(...entries.map(([, c]) => c), 1)
        return (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-5">{t('analytics.sourceDistribution')}</h2>
            <div className="space-y-3.5">
              {entries.map(([src, count]) => {
                const pct = Math.round(count / maxSrc * 100)
                return (
                  <div key={src}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t(`source.${src}`)}</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${SOURCE_CONFIG[src].color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
    </DashboardLayout>
  )
}
