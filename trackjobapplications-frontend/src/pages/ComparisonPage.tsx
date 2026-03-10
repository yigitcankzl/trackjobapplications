import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import StatusBadge from '../components/dashboard/StatusBadge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useToast } from '../context/ToastContext'
import { getAllApplications, compareApplications } from '../services/applications'
import { getAvatarColor } from '../lib/avatar'
import { JobApplication, CompareApplication } from '../types'

type CriterionKey = 'salary' | 'location' | 'remote' | 'benefits' | 'companySize' | 'bonus'

interface Criterion {
  key: CriterionKey
  weight: number
}

const DEFAULT_CRITERIA: Criterion[] = [
  { key: 'salary', weight: 30 },
  { key: 'location', weight: 20 },
  { key: 'remote', weight: 20 },
  { key: 'benefits', weight: 10 },
  { key: 'companySize', weight: 10 },
  { key: 'bonus', weight: 10 },
]

const REMOTE_SCORES: Record<string, number> = { remote: 10, hybrid: 6, onsite: 3 }
const SIZE_SCORES: Record<string, number> = { enterprise: 8, large: 7, medium: 6, small: 5, startup: 4 }

interface MaxValues {
  salary: number
  bonus: number
  benefitLines: number
  locationCount: number
}

function computeMaxValues(apps: CompareApplication[]): MaxValues {
  let salary = 0, bonus = 0, benefitLines = 0, locationCount = 0
  for (const a of apps) {
    const o = a.offer_detail
    if (!o) continue
    salary = Math.max(salary, Number(o.salary) || 0)
    bonus = Math.max(bonus, (Number(o.signing_bonus) || 0) + (Number(o.annual_bonus) || 0))
    const lines = o.benefits ? o.benefits.split('\n').filter(l => l.trim()).length : 0
    benefitLines = Math.max(benefitLines, lines)
    if (o.location) locationCount++
  }
  return { salary, bonus, benefitLines, locationCount }
}

function scoreCriterion(app: CompareApplication, key: CriterionKey, maxVals: MaxValues): number {
  const offer = app.offer_detail
  if (!offer) return 0

  switch (key) {
    case 'salary': {
      if (!offer.salary) return 0
      return maxVals.salary > 0 ? (Number(offer.salary) / maxVals.salary) * 10 : 0
    }
    case 'bonus': {
      const total = (Number(offer.signing_bonus) || 0) + (Number(offer.annual_bonus) || 0)
      return maxVals.bonus > 0 ? (total / maxVals.bonus) * 10 : 0
    }
    case 'remote':
      return REMOTE_SCORES[offer.remote_policy] || 0
    case 'companySize':
      return SIZE_SCORES[offer.company_size] || 0
    case 'location':
      return offer.location ? 7 : 0
    case 'benefits': {
      if (!offer.benefits) return 0
      const lines = offer.benefits.split('\n').filter(l => l.trim()).length
      return maxVals.benefitLines > 0 ? (lines / maxVals.benefitLines) * 10 : 0
    }
    default:
      return 0
  }
}

const formatMoneyCache = new Map<string, Intl.NumberFormat>()
function formatMoney(val: number | null, currency: string): string {
  if (val === null || val === undefined) return '-'
  const cur = currency || 'USD'
  let fmt = formatMoneyCache.get(cur)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 })
    formatMoneyCache.set(cur, fmt)
  }
  return fmt.format(val)
}

export default function ComparisonPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [allApps, setAllApps] = useState<JobApplication[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [compareData, setCompareData] = useState<CompareApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA)
  const [showMatrix, setShowMatrix] = useState(false)

  useEffect(() => {
    getAllApplications()
      .then(setAllApps)
      .catch(() => addToast(t('compare.loadFailed'), 'error'))
      .finally(() => setLoading(false))
  }, [addToast, t])

  function toggleSelect(id: number) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  async function handleCompare() {
    if (selectedIds.length < 2) return
    setComparing(true)
    try {
      const data = await compareApplications(selectedIds)
      setCompareData(data)
    } catch {
      addToast(t('compare.compareFailed'), 'error')
    } finally {
      setComparing(false)
    }
  }

  function updateWeight(key: CriterionKey, newWeight: number) {
    setCriteria(prev => prev.map(c => c.key === key ? { ...c, weight: newWeight } : c))
  }

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0)

  const maxVals = useMemo(() => computeMaxValues(compareData), [compareData])

  const scores = useMemo(() => {
    if (compareData.length === 0) return []
    return compareData.map(app => {
      let total = 0
      const breakdown: Record<string, number> = {}
      for (const c of criteria) {
        const raw = scoreCriterion(app, c.key, maxVals)
        const weighted = totalWeight > 0 ? (raw * c.weight) / totalWeight : 0
        breakdown[c.key] = Math.round(raw * 10) / 10
        total += weighted
      }
      return { id: app.id, total: Math.round(total * 10) / 10, breakdown }
    })
  }, [compareData, criteria, totalWeight, maxVals])

  const sortedScores = useMemo(() => [...scores].sort((a, b) => b.total - a.total), [scores])

  const bestId = sortedScores.length > 0 ? sortedScores[0].id : null

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Header title={t('compare.title')} />

      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Application selector */}
        {compareData.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
              {t('compare.selectApps')} <span className="text-gray-400">({selectedIds.length}/5)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {allApps.map(app => (
                <button
                  key={app.id}
                  onClick={() => toggleSelect(app.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedIds.includes(app.id)
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                    {(app.company[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.company}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{app.position}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2 || comparing}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {comparing ? t('compare.comparing') : t('compare.compareBtn', { count: selectedIds.length })}
              </button>
            </div>
          </div>
        )}

        {/* Comparison table */}
        {compareData.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setCompareData([]); setSelectedIds([]) }}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                &larr; {t('compare.back')}
              </button>
              <button
                onClick={() => setShowMatrix(!showMatrix)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                {showMatrix ? t('compare.hideMatrix') : t('compare.showMatrix')}
              </button>
            </div>

            {/* Side by side comparison */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">{t('compare.field')}</th>
                    {compareData.map(app => (
                      <th key={app.id} className="p-3 text-center min-w-[180px]">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${getAvatarColor(app.company)} ${bestId === app.id ? 'ring-2 ring-emerald-400' : ''}`}>
                            {app.company[0]?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{app.company}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{app.position}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  <CompareRow label={t('compare.fields.status')} data={compareData} render={a => <StatusBadge status={a.status} />} />
                  <CompareRow label={t('compare.fields.salary')} data={compareData} render={a => {
                    const o = a.offer_detail
                    if (!o?.salary) return <span className="text-gray-400">-</span>
                    return <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(o.salary, o.currency)}<span className="text-xs text-gray-400 ml-1">/{o.salary_period === 'yearly' ? t('compare.yr') : o.salary_period === 'monthly' ? t('compare.mo') : t('compare.hr')}</span></span>
                  }} />
                  <CompareRow label={t('compare.fields.signingBonus')} data={compareData} render={a => {
                    const o = a.offer_detail
                    return <span>{o?.signing_bonus ? formatMoney(o.signing_bonus, o.currency) : '-'}</span>
                  }} />
                  <CompareRow label={t('compare.fields.annualBonus')} data={compareData} render={a => {
                    const o = a.offer_detail
                    return <span>{o?.annual_bonus ? formatMoney(o.annual_bonus, o.currency) : '-'}</span>
                  }} />
                  <CompareRow label={t('compare.fields.equity')} data={compareData} render={a => <span>{a.offer_detail?.equity || '-'}</span>} />
                  <CompareRow label={t('compare.fields.location')} data={compareData} render={a => <span>{a.offer_detail?.location || '-'}</span>} />
                  <CompareRow label={t('compare.fields.remote')} data={compareData} render={a => {
                    const p = a.offer_detail?.remote_policy
                    if (!p) return <span className="text-gray-400">-</span>
                    const colors: Record<string, string> = { remote: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', hybrid: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', onsite: 'text-gray-600 bg-gray-100 dark:bg-gray-800' }
                    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[p] || ''}`}>{t(`compare.remoteOptions.${p}`)}</span>
                  }} />
                  <CompareRow label={t('compare.fields.companySize')} data={compareData} render={a => <span>{a.offer_detail?.company_size ? t(`compare.sizeOptions.${a.offer_detail.company_size}`) : '-'}</span>} />
                  <CompareRow label={t('compare.fields.benefits')} data={compareData} render={a => {
                    const b = a.offer_detail?.benefits
                    if (!b) return <span className="text-gray-400">-</span>
                    return <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap max-h-24 overflow-y-auto">{b}</p>
                  }} />
                  <CompareRow label={t('compare.fields.startDate')} data={compareData} render={a => <span>{a.offer_detail?.start_date || '-'}</span>} />
                  <CompareRow label={t('compare.fields.deadline')} data={compareData} render={a => <span>{a.offer_detail?.deadline || '-'}</span>} />
                </tbody>
              </table>
            </div>

            {/* Decision matrix */}
            {showMatrix && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('compare.decisionMatrix')}</h3>

                {/* Weight sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {criteria.map(c => (
                    <div key={c.key} className="flex items-center gap-2">
                      <label htmlFor={`weight-${c.key}`} className="text-xs text-gray-500 dark:text-gray-400 w-20">{t(`compare.criteria.${c.key}`)}</label>
                      <input
                        id={`weight-${c.key}`}
                        type="range"
                        min={0}
                        max={100}
                        value={c.weight}
                        onChange={e => updateWeight(c.key, Number(e.target.value))}
                        aria-label={t(`compare.criteria.${c.key}`)}
                        className="flex-1 h-1.5 accent-blue-600"
                      />
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-8 text-right">{c.weight}</span>
                    </div>
                  ))}
                </div>

                {/* Score bars */}
                <div className="space-y-3 mt-4">
                  {sortedScores.map((s, i) => {
                    const app = compareData.find(a => a.id === s.id)!
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(app.company)}`}>
                          {app.company[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{app.company}</span>
                            <span className={`text-sm font-bold ${i === 0 ? 'text-emerald-600' : 'text-gray-500'}`}>{s.total.toFixed(1)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${i === 0 ? 'bg-emerald-500' : 'bg-blue-400'}`}
                              style={{ width: `${(s.total / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Detailed breakdown table */}
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left p-2 text-gray-400 font-medium">{t('compare.criterion')}</th>
                        {compareData.map(app => (
                          <th key={app.id} className="p-2 text-center text-gray-400 font-medium">{app.company}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {criteria.map(c => (
                        <tr key={c.key}>
                          <td className="p-2 text-gray-600 dark:text-gray-300">{t(`compare.criteria.${c.key}`)} <span className="text-gray-400">({c.weight})</span></td>
                          {scores.map(s => (
                            <td key={s.id} className="p-2 text-center font-mono text-gray-700 dark:text-gray-200">{s.breakdown[c.key]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function CompareRow({ label, data, render }: { label: string; data: CompareApplication[]; render: (app: CompareApplication) => React.ReactNode }) {
  return (
    <tr>
      <td className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{label}</td>
      {data.map(app => (
        <td key={app.id} className="p-3 text-center text-sm text-gray-700 dark:text-gray-200">{render(app)}</td>
      ))}
    </tr>
  )
}
