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
    <div className="flex flex-col gap-2 w-full">
      {providers.map(({ id, label, Icon }) => (
        <a
          key={id}
          href={`${BACKEND}/auth/social/login/${id}/`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Icon />
          {t('auth.social.continueWith', { provider: label })}
        </a>
      ))}
    </div>
  )
}
