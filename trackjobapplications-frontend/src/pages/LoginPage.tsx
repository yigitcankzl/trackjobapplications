import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SignInForm from '../components/auth/SignInForm'
import SignUpForm from '../components/auth/SignUpForm'
import OverlayPanel from '../components/auth/OverlayPanel'

export default function LoginPage() {
  const { t } = useTranslation()
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      {/* Desktop: split card layout */}
      <div className="relative w-full max-w-4xl h-[560px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden hidden md:block">
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
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden md:hidden py-8">
        {isSignUp ? (
          <SignUpForm onSwitch={() => setIsSignUp(false)} />
        ) : (
          <SignInForm onSwitch={() => setIsSignUp(true)} />
        )}
      </div>

      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400 dark:text-gray-500 hidden md:block">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </p>
    </div>
  )
}
