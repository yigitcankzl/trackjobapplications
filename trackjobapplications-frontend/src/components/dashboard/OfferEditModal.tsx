import { useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { OfferDetail } from '../../types'
import { getOfferDetail, createOfferDetail, updateOfferDetail } from '../../services/applications'
import { useToast } from '../../context/ToastContext'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface Props {
  open: boolean
  applicationId: number
  company: string
  onClose: () => void
  onSaved: (appId: number, offer: OfferDetail) => void
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
  | { type: 'RESET' }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'POPULATE': {
      const d = action.data
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
    case 'RESET':
      return INITIAL_FORM
  }
}

export default function OfferEditModal({ open, applicationId, company, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const firstRef = useRef<HTMLInputElement>(null)
  const focusTrapRef = useFocusTrap(open, firstRef)
  useEscapeKey(onClose, open)

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, dispatch] = useReducer(formReducer, INITIAL_FORM)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getOfferDetail(applicationId)
      .then(data => {
        setOffer(data)
        if (data) dispatch({ type: 'POPULATE', data })
        else dispatch({ type: 'RESET' })
      })
      .catch(() => addToast(t('offer.loadFailed'), 'error'))
      .finally(() => setLoading(false))
  }, [open, applicationId, addToast, t])

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
      onSaved(applicationId, result)
      addToast(t('offer.saved'))
      onClose()
    } catch {
      addToast(t('offer.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const inputClass = 'w-full px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 focus:border-transparent'
  const labelClass = 'block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
          {t('offer.title')} — {company}
        </h3>

        {loading ? (
          <p className="text-sm text-stone-400 py-8 text-center">...</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className={labelClass}>{t('compare.fields.salary')}</label>
                <input ref={firstRef} type="number" value={form.salary} onChange={setField('salary')} className={inputClass} placeholder="100000" />
              </div>
              <div>
                <label className={labelClass}>{t('offer.currency')}</label>
                <select value={form.currency} onChange={setField('currency')} className={inputClass}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('offer.period')}</label>
                <select value={form.salaryPeriod} onChange={setField('salaryPeriod')} className={inputClass}>
                  {PERIODS.map(p => <option key={p} value={p}>{t(`offer.periods.${p}`)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{t('compare.fields.signingBonus')}</label>
                <input type="number" value={form.signingBonus} onChange={setField('signingBonus')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('compare.fields.annualBonus')}</label>
                <input type="number" value={form.annualBonus} onChange={setField('annualBonus')} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('compare.fields.equity')}</label>
              <input type="text" value={form.equity} onChange={setField('equity')} className={inputClass} placeholder={t('offer.equityPlaceholder')} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{t('compare.fields.location')}</label>
                <input type="text" value={form.location} onChange={setField('location')} className={inputClass} placeholder={t('offer.locationPlaceholder')} />
              </div>
              <div>
                <label className={labelClass}>{t('compare.fields.remote')}</label>
                <select value={form.remotePolicy} onChange={setField('remotePolicy')} className={inputClass}>
                  {REMOTE_OPTIONS.map(r => <option key={r} value={r}>{r ? t(`compare.remoteOptions.${r}`) : '-'}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('compare.fields.companySize')}</label>
              <select value={form.companySize} onChange={setField('companySize')} className={inputClass}>
                {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s ? t(`compare.sizeOptions.${s}`) : '-'}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>{t('compare.fields.benefits')}</label>
              <textarea value={form.benefits} onChange={setField('benefits')} rows={3} className={inputClass} placeholder={t('offer.benefitsPlaceholder')} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{t('compare.fields.startDate')}</label>
                <input type="date" value={form.startDate} onChange={setField('startDate')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('compare.fields.deadline')}</label>
                <input type="date" value={form.deadline} onChange={setField('deadline')} className={inputClass} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {t('detail.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                {saving ? '...' : t('offer.save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
