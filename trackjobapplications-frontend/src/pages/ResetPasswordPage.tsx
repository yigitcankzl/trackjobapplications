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
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('resetPassword.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('resetPassword.title')}</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">{t('resetPassword.subtitle')}</p>
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
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all"
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
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white tracking-wide bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : t('resetPassword.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
