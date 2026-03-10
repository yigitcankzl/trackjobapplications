import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OfferDetail } from '../../types'
import { getOfferDetail, createOfferDetail, updateOfferDetail, deleteOfferDetail } from '../../services/applications'
import { useToast } from '../../context/ToastContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface Props {
  applicationId: number
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'CAD', 'AUD', 'JPY', 'INR', 'OTHER']
const PERIODS = ['yearly', 'monthly', 'hourly']
const REMOTE_OPTIONS = ['', 'onsite', 'hybrid', 'remote']
const SIZE_OPTIONS = ['', 'startup', 'small', 'medium', 'large', 'enterprise']

export default function OfferDetailPanel({ applicationId }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [salary, setSalary] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [salaryPeriod, setSalaryPeriod] = useState('yearly')
  const [signingBonus, setSigningBonus] = useState('')
  const [annualBonus, setAnnualBonus] = useState('')
  const [equity, setEquity] = useState('')
  const [benefits, setBenefits] = useState('')
  const [location, setLocation] = useState('')
  const [remotePolicy, setRemotePolicy] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    setLoading(true)
    getOfferDetail(applicationId)
      .then(data => {
        setOffer(data)
        if (data) populateForm(data)
      })
      .catch(() => addToast(t('offer.loadFailed'), 'error'))
      .finally(() => setLoading(false))
  }, [applicationId, addToast, t])

  function populateForm(d: OfferDetail) {
    setSalary(d.salary != null ? String(d.salary) : '')
    setCurrency(d.currency || 'USD')
    setSalaryPeriod(d.salary_period || 'yearly')
    setSigningBonus(d.signing_bonus != null ? String(d.signing_bonus) : '')
    setAnnualBonus(d.annual_bonus != null ? String(d.annual_bonus) : '')
    setEquity(d.equity || '')
    setBenefits(d.benefits || '')
    setLocation(d.location || '')
    setRemotePolicy(d.remote_policy || '')
    setCompanySize(d.company_size || '')
    setStartDate(d.start_date || '')
    setDeadline(d.deadline || '')
  }

  function resetForm() {
    if (offer) {
      populateForm(offer)
    } else {
      setSalary(''); setCurrency('USD'); setSalaryPeriod('yearly')
      setSigningBonus(''); setAnnualBonus(''); setEquity('')
      setBenefits(''); setLocation(''); setRemotePolicy('')
      setCompanySize(''); setStartDate(''); setDeadline('')
    }
  }

  async function handleSave() {
    setSaving(true)
    const payload: Record<string, unknown> = {
      salary: salary ? parseFloat(salary) : null,
      currency,
      salary_period: salaryPeriod,
      signing_bonus: signingBonus ? parseFloat(signingBonus) : null,
      annual_bonus: annualBonus ? parseFloat(annualBonus) : null,
      equity,
      benefits,
      location,
      remote_policy: remotePolicy,
      company_size: companySize,
      start_date: startDate || null,
      deadline: deadline || null,
    }
    try {
      let result: OfferDetail
      if (offer) {
        result = await updateOfferDetail(applicationId, offer.id, payload)
      } else {
        result = await createOfferDetail(applicationId, payload as Partial<OfferDetail>)
      }
      setOffer(result)
      populateForm(result)
      setEditing(false)
      addToast(t('offer.saved'))
    } catch {
      addToast(t('offer.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!offer) return
    try {
      await deleteOfferDetail(applicationId, offer.id)
      setOffer(null)
      resetForm()
      setEditing(false)
      addToast(t('offer.deleted'))
    } catch {
      addToast(t('offer.deleteFailed'), 'error')
    }
  }

  if (loading) return <LoadingSpinner size="sm" centered />

  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelClass = 'text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('offer.title')}</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {offer ? t('offer.edit') : t('offer.add')}
          </button>
        )}
      </div>

      {!editing && !offer && (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('offer.empty')}</p>
      )}

      {!editing && offer && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          {offer.salary != null && (
            <div>
              <p className={labelClass}>{t('compare.fields.salary')}</p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD', maximumFractionDigits: 0 }).format(offer.salary)}
                <span className="text-xs text-gray-400 ml-1">/{offer.salary_period === 'yearly' ? t('compare.yr') : offer.salary_period === 'monthly' ? t('compare.mo') : t('compare.hr')}</span>
              </p>
            </div>
          )}
          {offer.signing_bonus != null && (
            <div>
              <p className={labelClass}>{t('compare.fields.signingBonus')}</p>
              <p className="text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD', maximumFractionDigits: 0 }).format(offer.signing_bonus)}</p>
            </div>
          )}
          {offer.annual_bonus != null && (
            <div>
              <p className={labelClass}>{t('compare.fields.annualBonus')}</p>
              <p className="text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD', maximumFractionDigits: 0 }).format(offer.annual_bonus)}</p>
            </div>
          )}
          {offer.equity && <div><p className={labelClass}>{t('compare.fields.equity')}</p><p className="text-gray-800 dark:text-gray-200">{offer.equity}</p></div>}
          {offer.location && <div><p className={labelClass}>{t('compare.fields.location')}</p><p className="text-gray-800 dark:text-gray-200">{offer.location}</p></div>}
          {offer.remote_policy && <div><p className={labelClass}>{t('compare.fields.remote')}</p><p className="text-gray-800 dark:text-gray-200">{t(`compare.remoteOptions.${offer.remote_policy}`)}</p></div>}
          {offer.company_size && <div><p className={labelClass}>{t('compare.fields.companySize')}</p><p className="text-gray-800 dark:text-gray-200">{t(`compare.sizeOptions.${offer.company_size}`)}</p></div>}
          {offer.benefits && <div className="col-span-2"><p className={labelClass}>{t('compare.fields.benefits')}</p><p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-xs">{offer.benefits}</p></div>}
          {offer.start_date && <div><p className={labelClass}>{t('compare.fields.startDate')}</p><p className="text-gray-800 dark:text-gray-200">{offer.start_date}</p></div>}
          {offer.deadline && <div><p className={labelClass}>{t('compare.fields.deadline')}</p><p className="text-gray-800 dark:text-gray-200">{offer.deadline}</p></div>}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className={labelClass}>{t('compare.fields.salary')}</label>
              <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className={inputClass} placeholder="100000" />
            </div>
            <div>
              <label className={labelClass}>{t('offer.currency')}</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('offer.period')}</label>
              <select value={salaryPeriod} onChange={e => setSalaryPeriod(e.target.value)} className={inputClass}>
                {PERIODS.map(p => <option key={p} value={p}>{t(`offer.periods.${p}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('compare.fields.signingBonus')}</label>
              <input type="number" value={signingBonus} onChange={e => setSigningBonus(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('compare.fields.annualBonus')}</label>
              <input type="number" value={annualBonus} onChange={e => setAnnualBonus(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('compare.fields.equity')}</label>
            <input type="text" value={equity} onChange={e => setEquity(e.target.value)} className={inputClass} placeholder={t('offer.equityPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('compare.fields.location')}</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} placeholder={t('offer.locationPlaceholder')} />
            </div>
            <div>
              <label className={labelClass}>{t('compare.fields.remote')}</label>
              <select value={remotePolicy} onChange={e => setRemotePolicy(e.target.value)} className={inputClass}>
                {REMOTE_OPTIONS.map(r => <option key={r} value={r}>{r ? t(`compare.remoteOptions.${r}`) : '-'}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('compare.fields.companySize')}</label>
            <select value={companySize} onChange={e => setCompanySize(e.target.value)} className={inputClass}>
              {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s ? t(`compare.sizeOptions.${s}`) : '-'}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>{t('compare.fields.benefits')}</label>
            <textarea value={benefits} onChange={e => setBenefits(e.target.value)} rows={3} className={inputClass} placeholder={t('offer.benefitsPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>{t('compare.fields.startDate')}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('compare.fields.deadline')}</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {offer && (
                <button onClick={handleDelete} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  {t('offer.remove')}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setEditing(false) }} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {t('detail.cancel')}
              </button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                {saving ? '...' : t('offer.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
