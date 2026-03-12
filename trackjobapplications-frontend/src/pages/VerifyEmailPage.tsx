import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyEmail } from '../services/auth'

type Status = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const uid = searchParams.get('uid') ?? ''
    const token = searchParams.get('token') ?? ''

    if (!uid || !token) {
      setErrorMsg(t('verifyEmail.invalidLink'))
      setStatus('error')
      return
    }

    verifyEmail(uid, token)
      .then(() => setStatus('success'))
      .catch(() => {
        setErrorMsg(t('verifyEmail.genericError'))
        setStatus('error')
      })
  }, [searchParams, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 border-4 border-stone-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-stone-600 dark:text-stone-400">{t('verifyEmail.verifying')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              {t('verifyEmail.successTitle')}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mb-6">
              {t('verifyEmail.successMessage')}
            </p>
            <Link
              to="/login"
              className="inline-block bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {t('verifyEmail.goToLogin')}
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              {t('verifyEmail.errorTitle')}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mb-6">{errorMsg}</p>
            <Link
              to="/login"
              className="inline-block bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {t('verifyEmail.goToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
