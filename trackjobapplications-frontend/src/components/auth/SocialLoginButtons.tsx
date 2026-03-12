import { GoogleIcon, GitHubIcon } from '../icons'

const BACKEND = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

const providers = [
  { id: 'google-oauth2', label: 'Google', Icon: GoogleIcon },
  { id: 'github',        label: 'GitHub', Icon: GitHubIcon },
] as const

export default function SocialLoginButtons() {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex gap-3">
        {providers.map(({ id, label, Icon }) => (
          <a
            key={id}
            href={`${BACKEND}/auth/social/login/${id}/`}
            title={label}
            className="flex items-center justify-center w-11 h-11 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  )
}
