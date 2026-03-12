import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MailIcon } from '../components/icons'
import { requestPasswordReset } from '../services/auth'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await requestPasswordReset(email)
    } finally {
      setIsLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-lg p-8">
        {submitted ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">{t('forgotPassword.sentTitle')}</h1>
            <p className="text-stone-500 dark:text-stone-400 mb-6">{t('forgotPassword.sentMessage')}</p>
            <Link to="/login" className="inline-block bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">{t('forgotPassword.title')}</h1>
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">{t('forgotPassword.subtitle')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2"><MailIcon /></span>
                <input
                  type="email"
                  required
                  placeholder={t('auth.signIn.email')}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg text-sm font-medium text-white tracking-wide bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '...' : t('forgotPassword.submit')}
              </button>
              <p className="text-center text-sm text-stone-500 dark:text-stone-400">
                <Link to="/login" className="text-stone-900 dark:text-stone-100 font-medium hover:underline">
                  {t('forgotPassword.backToLogin')}
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
