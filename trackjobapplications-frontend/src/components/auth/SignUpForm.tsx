import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserIcon, MailIcon, LockIcon, EyeIcon } from '../icons'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import SocialLoginButtons from './SocialLoginButtons'

interface Props {
  onSwitch: () => void
}

export default function SignUpForm({ onSwitch }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const { addToast } = useToast()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== password2) {
      addToast(t('auth.errors.passwordMismatch'), 'error')
      return
    }
    setIsLoading(true)
    try {
      await register(email, firstName, lastName, password, password2)
      navigate('/dashboard')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      if (data) {
        const messages = Object.values(data).flat().join(' ')
        addToast(messages || t('auth.errors.registrationFailed'), 'error')
      } else {
        addToast(t('auth.errors.registrationFailed'), 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 sm:px-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-stone-100 mb-1">{t('auth.signUp.title')}</h2>
      <p className="text-sm text-stone-400 dark:text-stone-500 mb-8">{t('auth.signUp.subtitle')}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2"><UserIcon /></span>
            <input
              type="text"
              placeholder={t('auth.signUp.firstName')}
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
            />
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('auth.signUp.lastName')}
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
            />
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><MailIcon /></span>
          <input
            type="email"
            placeholder={t('auth.signUp.email')}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
          />
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><LockIcon /></span>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.signUp.password')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            aria-label={t('dashboard.aria.togglePassword')}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2"><LockIcon /></span>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.signUp.confirmPassword')}
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-stone-200 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg text-sm font-medium text-white tracking-wide bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : t('auth.signUp.submit')}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
          <span className="text-xs text-stone-400 dark:text-stone-500">{t('auth.signUp.or')}</span>
          <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
        </div>

        <SocialLoginButtons />

        <p className="text-center text-sm text-stone-500 dark:text-stone-400 md:hidden">
          {t('auth.signUp.hasAccount')}{' '}
          <button type="button" onClick={onSwitch} className="text-stone-900 dark:text-stone-100 font-medium hover:underline">
            {t('auth.signUp.switchToSignIn')}
          </button>
        </p>
      </form>
    </div>
  )
}
