import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import OverlayPanel from '../components/auth/OverlayPanel'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { search } = useLocation()
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    const error = new URLSearchParams(search).get('error')
    if (error) addToast(t('auth.errors.oauthFailed'), 'error')
  }, [search, addToast, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
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

      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-stone-400 dark:text-stone-500 hidden md:block">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </p>
    </div>
  )
}
