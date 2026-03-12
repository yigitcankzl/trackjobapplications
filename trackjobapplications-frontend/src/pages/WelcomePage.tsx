import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/welcome/LanguageSwitcher'
import FeatureCard from '../components/welcome/FeatureCard'
import { useTheme } from '../context/ThemeContext'
import { BriefcaseIcon, BarChartIcon, ClipboardIcon, SunIcon, MoonIcon } from '../components/icons'

export default function WelcomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
            <BriefcaseIcon />
          </div>
          <span className="text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight">TrackJobs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact dropdownBelow />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="hidden sm:block px-5 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            {t('nav.signIn')}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {t('nav.getStarted')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium mb-8 border border-stone-200/60 dark:border-stone-700 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-500 animate-pulse" />
          {t('welcome.badge')}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 dark:text-stone-100 leading-[1.1] max-w-3xl mb-6 tracking-tight">
          {t('welcome.headline')}{' '}
          <span className="text-stone-400 dark:text-stone-500">
            {t('welcome.headlineHighlight')}
          </span>
        </h1>

        <p className="text-stone-500 dark:text-stone-400 text-lg max-w-xl mb-12 leading-relaxed">
          {t('welcome.subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-20">
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-md hover:shadow-lg transition-all duration-200"
          >
            {t('welcome.cta')} →
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg text-sm font-medium text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 shadow-sm hover:shadow-md transition-all duration-200"
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
            color="blue"
          />
          <FeatureCard
            icon={<BarChartIcon />}
            title={t('welcome.features.visualize.title')}
            description={t('welcome.features.visualize.description')}
            color="purple"
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title={t('welcome.features.followup.title')}
            description={t('welcome.features.followup.description')}
            color="orange"
          />
        </div>

        {/* Extensions section */}
        <div className="mt-20 max-w-3xl w-full">
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('welcome.extensions.title')}</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8">{t('welcome.extensions.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chrome Extension */}
            <div className="group bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('welcome.extensions.chrome.title')}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-xs font-medium text-amber-600 dark:text-amber-400">Coming Soon</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t('welcome.extensions.chrome.description')}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400">LinkedIn</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-xs font-medium text-purple-600 dark:text-purple-400">Indeed</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-xs font-medium text-red-500 dark:text-red-400">Gmail</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Add-on */}
            <div className="group bg-white dark:bg-stone-900 rounded-lg border border-stone-200/60 dark:border-stone-800 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('welcome.extensions.gmail.title')}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-xs font-medium text-amber-600 dark:text-amber-400">Coming Soon</span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t('welcome.extensions.gmail.description')}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-xs font-medium text-red-600 dark:text-red-400">Google Workspace</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-5 text-xs text-stone-400 dark:text-stone-500">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </footer>
    </div>
  )
}
