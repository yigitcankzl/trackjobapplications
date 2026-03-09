import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/welcome/LanguageSwitcher'
import FeatureCard from '../components/welcome/FeatureCard'
import { BriefcaseIcon, BarChartIcon, ClipboardIcon } from '../components/icons'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
            <BriefcaseIcon />
          </div>
          <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">TrackJobs</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {t('nav.signIn')}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-md hover:shadow-blue-200 transition-all duration-200"
          >
            {t('nav.getStarted')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 border border-blue-200 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {t('welcome.badge')}
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight max-w-2xl mb-5">
          {t('welcome.headline')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
            {t('welcome.headlineHighlight')}
          </span>
        </h1>

        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mb-10 leading-relaxed">
          {t('welcome.subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 mb-16">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all duration-200"
          >
            {t('welcome.cta')}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all duration-200"
          >
            {t('nav.signIn')}
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full">
          <FeatureCard
            icon={<ClipboardIcon />}
            title={t('welcome.features.track.title')}
            description={t('welcome.features.track.description')}
          />
          <FeatureCard
            icon={<BarChartIcon />}
            title={t('welcome.features.visualize.title')}
            description={t('welcome.features.visualize.description')}
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title={t('welcome.features.followup.title')}
            description={t('welcome.features.followup.description')}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-gray-400 dark:text-gray-500">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  )
}
