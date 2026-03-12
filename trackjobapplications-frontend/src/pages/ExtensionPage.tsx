import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'

const CHROME_STORE_URL = '#'
const FIREFOX_ADDON_URL = '#'

const FEATURES = [
  { icon: '🖱️', key: 'oneClick' },
  { icon: '📄', key: 'jobCapture' },
  { icon: '🏷️', key: 'tags' },
  { icon: '📝', key: 'notes' },
  { icon: '🤝', key: 'recruiter' },
  { icon: '📅', key: 'interviews' },
  { icon: '💰', key: 'offers' },
  { icon: '📌', key: 'pin' },
] as const

export default function ExtensionPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <Header title={t('extension.title')} />

      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a2 2 0 012 2v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a2 2 0 01-2 2h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a2 2 0 01-2-2v-3a1 1 0 00-1-1H3a2 2 0 110-4h1a1 1 0 001-1V8a2 2 0 012-2h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('extension.hero.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {t('extension.hero.description')}
          </p>
        </div>

        {/* Download buttons */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('extension.download')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z"/>
              </svg>
              Chrome Web Store
            </a>
            <a
              href={FIREFOX_ADDON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 7.2a5.4 5.4 0 01.432 2.4c0 3.6-2.4 7.2-7.2 7.2A7.2 7.2 0 014.8 14.4a5.4 5.4 0 003.6 1.2c2.4 0 4.8-2.4 4.8-4.8 0-1.2-.6-2.4-1.2-3.6z"/>
              </svg>
              Firefox Add-ons
            </a>
          </div>
        </div>

        {/* Supported sites */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('extension.supportedSites')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'].map((site) => (
              <div key={site} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                {site}
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('extension.features')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-start gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <span className="text-lg flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t(`extension.featureList.${f.key}.title`)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(`extension.featureList.${f.key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('extension.howItWorks')}</p>
          <div className="space-y-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t(`extension.steps.${step}.title`)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t(`extension.steps.${step}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
