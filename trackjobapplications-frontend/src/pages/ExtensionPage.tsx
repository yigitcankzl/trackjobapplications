import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'

const CHROME_STORE_URL = '#'
const FIREFOX_ADDON_URL = '#'

const FEATURES = [
  { key: 'oneClick' },
  { key: 'jobCapture' },
  { key: 'tags' },
  { key: 'notes' },
  { key: 'recruiter' },
  { key: 'interviews' },
  { key: 'offers' },
  { key: 'pin' },
] as const

export default function ExtensionPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <Header title={t('extension.title')} />

      <div className="max-w-3xl mx-auto pb-12 space-y-8">
        {/* Hero — horizontal layout */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
              {t('extension.hero.title')}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed mb-5 max-w-lg">
              {t('extension.hero.description')}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={CHROME_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-900 font-medium text-sm shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z"/>
                </svg>
                Chrome
              </a>
              <a
                href={FIREFOX_ADDON_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-stone-200/80 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 font-medium text-sm shadow-sm transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 7.2a5.4 5.4 0 01.432 2.4c0 3.6-2.4 7.2-7.2 7.2A7.2 7.2 0 014.8 14.4a5.4 5.4 0 003.6 1.2c2.4 0 4.8-2.4 4.8-4.8 0-1.2-.6-2.4-1.2-3.6z"/>
                </svg>
                Firefox
              </a>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'Zip'].map((site) => (
              <span key={site} className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400">
                {site}
              </span>
            ))}
          </div>
        </div>

        {/* Supported sites — mobile only */}
        <div className="sm:hidden flex flex-wrap gap-2">
          {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'].map((site) => (
            <span key={site} className="px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-xs font-medium text-stone-500 dark:text-stone-400">
              {site}
            </span>
          ))}
        </div>

        {/* How it works — inline steps */}
        <div>
          <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">{t('extension.howItWorks')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-start gap-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-4">
                <span className="w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{t(`extension.steps.${step}.title`)}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{t(`extension.steps.${step}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features — compact grid */}
        <div>
          <h3 className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-4">{t('extension.features')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div key={f.key} className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm px-4 py-3">
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{t(`extension.featureList.${f.key}.title`)}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t(`extension.featureList.${f.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
