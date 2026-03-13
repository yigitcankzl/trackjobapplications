import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, Link } from 'react-router-dom'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import OverlayPanel from '../components/auth/OverlayPanel'
import { useToast } from '../context/ToastContext'
import { useSEO } from '../hooks/useSEO'

export default function LoginPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { search } = useLocation()
  const seo = useSEO({ title: t('seo.login.title'), description: t('seo.login.description'), path: '/login' })
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    const error = new URLSearchParams(search).get('error')
    if (error) addToast(t('auth.errors.oauthFailed'), 'error')
  }, [search, addToast, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      {seo}
      {/* Desktop: split card layout */}
      <div className="relative w-full max-w-4xl h-[560px] bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-lg overflow-hidden hidden md:block">
        {/* Sign Up Form — right side */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full transition-all duration-700 ease-in-out"
          style={{
            opacity: isSignUp ? 1 : 0,
            zIndex: isSignUp ? 5 : 1,
          }}
        >
          <SignUpForm onSwitch={() => setIsSignUp(false)} />
        </div>

        {/* Sign In Form — left side */}
        <div
          className="absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out"
          style={{
            opacity: isSignUp ? 0 : 1,
            zIndex: isSignUp ? 1 : 5,
          }}
        >
          <SignInForm onSwitch={() => setIsSignUp(true)} />
        </div>

        {/* Sliding Overlay */}
        <OverlayPanel isSignUp={isSignUp} onSwitch={() => setIsSignUp(!isSignUp)} />
      </div>

      {/* Mobile: stacked layout */}
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 shadow-lg overflow-hidden md:hidden py-8">
        {isSignUp ? (
          <SignUpForm onSwitch={() => setIsSignUp(false)} />
        ) : (
          <SignInForm onSwitch={() => setIsSignUp(true)} />
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-stone-400 dark:text-stone-500 hidden md:flex items-center justify-center gap-4">
        <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        <Link to="/privacy" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.privacy')}</Link>
        <Link to="/terms" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.terms')}</Link>
        <a href="https://github.com/yigitcankzl/trackjobapplications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </a>
        <a href="mailto:trackjobapplications@gmail.com" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          {t('footer.contact')}
        </a>
      </div>
    </div>
  )
}
