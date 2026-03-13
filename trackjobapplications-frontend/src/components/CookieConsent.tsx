import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'cookie-consent'

export default function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted' })
    }
    setVisible(false)
  }

  function handleReject() {
    localStorage.setItem(STORAGE_KEY, 'rejected')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-lg mx-auto bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-700 rounded-lg shadow-lg p-4 sm:p-5">
        <p className="text-sm text-stone-600 dark:text-stone-300 mb-3 leading-relaxed">
          {t('cookieConsent.message')}{' '}
          <Link to="/cookies" className="underline text-stone-900 dark:text-stone-100">
            {t('cookieConsent.learnMore')}
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-xs font-medium rounded-lg text-white bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 transition-colors"
          >
            {t('cookieConsent.accept')}
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 text-xs font-medium rounded-lg text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            {t('cookieConsent.reject')}
          </button>
        </div>
      </div>
    </div>
  )
}
