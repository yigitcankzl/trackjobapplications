import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'
import LanguageSwitcher from '../components/welcome/LanguageSwitcher'
import FeatureCard from '../components/welcome/FeatureCard'
import { useTheme } from '../context/ThemeContext'
import { useSEO } from '../hooks/useSEO'
import { BriefcaseIcon, BarChartIcon, ClipboardIcon, SunIcon, MoonIcon } from '../components/icons'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'TrackJobs',
  description: 'Track every job application in one place. Manage status, follow-ups, interviews and offers.',
  url: 'https://www.trackjobapplications.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function WelcomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const seo = useSEO({ title: t('seo.welcome.title'), description: t('seo.welcome.description'), path: '/' })

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex flex-col">
      {seo}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
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

        {/* Auto-Fill & AI features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl w-full mt-5">
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            }
            title={t('welcome.features.autofill.title')}
            description={t('welcome.features.autofill.description')}
            color="indigo"
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            title={t('welcome.features.aiCoverLetter.title')}
            description={t('welcome.features.aiCoverLetter.description')}
            badge={t('welcome.features.aiCoverLetter.badge')}
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
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <Link to="/privacy" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.terms')}</Link>
          <Link to="/cookies" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.cookies')}</Link>
          <a href="https://github.com/yigitcankzl/trackjobapplications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </a>
          <a href="mailto:trackjobapplications@gmail.com" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            {t('footer.contact')}
          </a>
        </div>
      </footer>
    </div>
  )
}
