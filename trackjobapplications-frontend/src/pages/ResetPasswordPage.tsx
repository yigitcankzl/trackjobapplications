import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LockIcon } from '../components/icons'
import { confirmPasswordReset } from '../services/auth'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      setError(t('auth.errors.passwordMismatch'))
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await confirmPasswordReset(uid, token, password, password2)
      navigate('/login')
    } catch {
      setError(t('resetPassword.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-lg p-8">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">{t('resetPassword.title')}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">{t('resetPassword.subtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><LockIcon /></span>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t('profile.newPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><LockIcon /></span>
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t('profile.confirmNewPassword')}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg text-sm font-medium text-white tracking-wide bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
