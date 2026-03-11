import { useTranslation } from 'react-i18next'
import { GoogleIcon, GitHubIcon, FacebookIcon, LinkedInIcon } from '../icons'

const BACKEND = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

const providers = [
  { id: 'google-oauth2',   label: 'Google',   Icon: GoogleIcon },
  { id: 'github',          label: 'GitHub',   Icon: GitHubIcon },
  { id: 'facebook',        label: 'Facebook', Icon: FacebookIcon },
  { id: 'linkedin-oauth2', label: 'LinkedIn', Icon: LinkedInIcon },
] as const

export default function SocialLoginButtons() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <span className="text-xs text-gray-400 dark:text-gray-500">{t('auth.social.continueWith')}</span>
      <div className="flex gap-3">
        {providers.map(({ id, label, Icon }) => (
          <a
            key={id}
            href={`${BACKEND}/auth/social/login/${id}/`}
            title={label}
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  )
}
