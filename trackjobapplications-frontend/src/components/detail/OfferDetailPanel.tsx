import { useEffect, useReducer, useState } from 'react'
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

interface FormState {
  salary: string
  currency: string
  salaryPeriod: string
  signingBonus: string
  annualBonus: string
  equity: string
  benefits: string
  location: string
  remotePolicy: string
  companySize: string
  startDate: string
  deadline: string
}

const INITIAL_FORM: FormState = {
  salary: '', currency: 'USD', salaryPeriod: 'yearly',
  signingBonus: '', annualBonus: '', equity: '',
  benefits: '', location: '', remotePolicy: '',
  companySize: '', startDate: '', deadline: '',
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: string }
  | { type: 'POPULATE'; data: OfferDetail }
  | { type: 'RESET'; data?: OfferDetail | null }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'POPULATE':
      return populateFromOffer(action.data)
    case 'RESET':
      return action.data ? populateFromOffer(action.data) : INITIAL_FORM
  }
}

function populateFromOffer(d: OfferDetail): FormState {
  return {
    salary: d.salary != null ? String(d.salary) : '',
    currency: d.currency || 'USD',
    salaryPeriod: d.salary_period || 'yearly',
    signingBonus: d.signing_bonus != null ? String(d.signing_bonus) : '',
    annualBonus: d.annual_bonus != null ? String(d.annual_bonus) : '',
    equity: d.equity || '',
    benefits: d.benefits || '',
    location: d.location || '',
    remotePolicy: d.remote_policy || '',
    companySize: d.company_size || '',
    startDate: d.start_date || '',
    deadline: d.deadline || '',
  }
}

const formatMoneyCache = new Map<string, Intl.NumberFormat>()
function formatMoney(amount: number, currency: string): string {
  const key = currency
  let fmt = formatMoneyCache.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
    formatMoneyCache.set(key, fmt)
  }
  return fmt.format(amount)
}

export default function OfferDetailPanel({ applicationId }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM)

  useEffect(() => {
    setLoading(true)
    getOfferDetail(applicationId)
      .then(data => {
        setOffer(data)
        if (data) dispatch({ type: 'POPULATE', data })
      })
      .catch(() => addToast(t('offer.loadFailed'), 'error'))
      .finally(() => setLoading(false))
  }, [applicationId, addToast, t])

  function setField(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      dispatch({ type: 'SET_FIELD', field, value: e.target.value })
  }

  async function handleSave() {
    setSaving(true)
    const payload: Record<string, unknown> = {
      salary: form.salary ? parseFloat(form.salary) : null,
      currency: form.currency,
      salary_period: form.salaryPeriod,
      signing_bonus: form.signingBonus ? parseFloat(form.signingBonus) : null,
      annual_bonus: form.annualBonus ? parseFloat(form.annualBonus) : null,
      equity: form.equity,
      benefits: form.benefits,
      location: form.location,
      remote_policy: form.remotePolicy,
      company_size: form.companySize,
      start_date: form.startDate || null,
      deadline: form.deadline || null,
    }
    try {
      let result: OfferDetail
      if (offer) {
        result = await updateOfferDetail(applicationId, offer.id, payload)
      } else {
        result = await createOfferDetail(applicationId, payload as Partial<OfferDetail>)
      }
      setOffer(result)
      dispatch({ type: 'POPULATE', data: result })
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
      dispatch({ type: 'RESET' })
      setEditing(false)
      setConfirmingDelete(false)
      addToast(t('offer.deleted'))
    } catch {
      addToast(t('offer.deleteFailed'), 'error')
    }
  }

  if (loading) return <LoadingSpinner size="sm" centered />

  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

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
                {formatMoney(offer.salary, offer.currency || 'USD')}
                <span className="text-xs text-gray-400 ml-1">/{offer.salary_period === 'yearly' ? t('compare.yr') : offer.salary_period === 'monthly' ? t('compare.mo') : t('compare.hr')}</span>
              </p>
            </div>
          )}
          {offer.signing_bonus != null && (
            <div>
              <p className={labelClass}>{t('compare.fields.signingBonus')}</p>
              <p className="text-gray-800 dark:text-gray-200">{formatMoney(offer.signing_bonus, offer.currency || 'USD')}</p>
            </div>
          )}
          {offer.annual_bonus != null && (
            <div>
              <p className={labelClass}>{t('compare.fields.annualBonus')}</p>
              <p className="text-gray-800 dark:text-gray-200">{formatMoney(offer.annual_bonus, offer.currency || 'USD')}</p>
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
              <label htmlFor="offer-salary" className={labelClass}>{t('compare.fields.salary')}</label>
              <input id="offer-salary" type="number" value={form.salary} onChange={setField('salary')} className={inputClass} placeholder="100000" />
            </div>
            <div>
              <label htmlFor="offer-currency" className={labelClass}>{t('offer.currency')}</label>
              <select id="offer-currency" value={form.currency} onChange={setField('currency')} className={inputClass}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="offer-period" className={labelClass}>{t('offer.period')}</label>
              <select id="offer-period" value={form.salaryPeriod} onChange={setField('salaryPeriod')} className={inputClass}>
                {PERIODS.map(p => <option key={p} value={p}>{t(`offer.periods.${p}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="offer-signing-bonus" className={labelClass}>{t('compare.fields.signingBonus')}</label>
              <input id="offer-signing-bonus" type="number" value={form.signingBonus} onChange={setField('signingBonus')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="offer-annual-bonus" className={labelClass}>{t('compare.fields.annualBonus')}</label>
              <input id="offer-annual-bonus" type="number" value={form.annualBonus} onChange={setField('annualBonus')} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="offer-equity" className={labelClass}>{t('compare.fields.equity')}</label>
            <input id="offer-equity" type="text" value={form.equity} onChange={setField('equity')} className={inputClass} placeholder={t('offer.equityPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="offer-location" className={labelClass}>{t('compare.fields.location')}</label>
              <input id="offer-location" type="text" value={form.location} onChange={setField('location')} className={inputClass} placeholder={t('offer.locationPlaceholder')} />
            </div>
            <div>
              <label htmlFor="offer-remote" className={labelClass}>{t('compare.fields.remote')}</label>
              <select id="offer-remote" value={form.remotePolicy} onChange={setField('remotePolicy')} className={inputClass}>
                {REMOTE_OPTIONS.map(r => <option key={r} value={r}>{r ? t(`compare.remoteOptions.${r}`) : '-'}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="offer-company-size" className={labelClass}>{t('compare.fields.companySize')}</label>
            <select id="offer-company-size" value={form.companySize} onChange={setField('companySize')} className={inputClass}>
              {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s ? t(`compare.sizeOptions.${s}`) : '-'}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="offer-benefits" className={labelClass}>{t('compare.fields.benefits')}</label>
            <textarea id="offer-benefits" value={form.benefits} onChange={setField('benefits')} rows={3} className={inputClass} placeholder={t('offer.benefitsPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="offer-start-date" className={labelClass}>{t('compare.fields.startDate')}</label>
              <input id="offer-start-date" type="date" value={form.startDate} onChange={setField('startDate')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="offer-deadline" className={labelClass}>{t('compare.fields.deadline')}</label>
              <input id="offer-deadline" type="date" value={form.deadline} onChange={setField('deadline')} className={inputClass} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {offer && !confirmingDelete && (
                <button onClick={() => setConfirmingDelete(true)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                  {t('offer.remove')}
                </button>
              )}
              {confirmingDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">{t('offer.confirmRemove')}</span>
                  <button onClick={handleDelete} className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2 py-1 rounded">
                    {t('offer.yes')}
                  </button>
                  <button onClick={() => setConfirmingDelete(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
                    {t('offer.no')}
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { dispatch({ type: 'RESET', data: offer }); setEditing(false); setConfirmingDelete(false) }} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
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
