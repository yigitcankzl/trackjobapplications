import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { BriefcaseIcon } from '../components/icons'

export default function CookiePolicyPage() {
  const { t, i18n } = useTranslation()
  const seo = useSEO({ title: t('legal.cookies.seoTitle'), description: t('legal.cookies.seoDescription'), path: '/cookies' })
  const isEN = i18n.language === 'en'

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {seo}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-stone-200/60 dark:border-stone-800">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center">
            <BriefcaseIcon />
          </div>
          <span className="text-lg font-bold text-stone-800 dark:text-stone-100 tracking-tight">TrackJobs</span>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('legal.cookies.title')}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-8">{t('legal.privacy.lastUpdated')}: 2026-03-13</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {isEN ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">What Are Cookies</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help websites function properly and provide information to site owners.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Cookies We Use</h2>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-700">
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Cookie</th>
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Type</th>
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Purpose</th>
                        <th className="py-2 font-semibold text-stone-800 dark:text-stone-200">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">access_token</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">JWT authentication token (httpOnly)</td>
                        <td className="py-2">15 minutes</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">refresh_token</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">Token refresh (httpOnly)</td>
                        <td className="py-2">7 days</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">csrftoken</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">CSRF protection</td>
                        <td className="py-2">1 year</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">sessionid</td>
                        <td className="py-2 pr-4">Essential</td>
                        <td className="py-2 pr-4">OAuth flow session</td>
                        <td className="py-2">Session</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*</td>
                        <td className="py-2 pr-4">Analytics</td>
                        <td className="py-2 pr-4">Google Analytics 4 — anonymous usage tracking</td>
                        <td className="py-2">2 years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Essential Cookies</h2>
                <p>These cookies are strictly necessary for the Service to function. They handle authentication and security. You cannot opt out of essential cookies as the Service would not work without them.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Analytics Cookies</h2>
                <p>We use Google Analytics 4 to understand how visitors interact with our site. These cookies collect anonymous information about page visits and usage patterns. IP addresses are anonymized.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Managing Cookies</h2>
                <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. Note that blocking essential cookies will prevent you from using TrackJobs.</p>
                <p>To opt out of Google Analytics specifically, you can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-stone-900 dark:text-stone-100 underline">Google Analytics Opt-out Browser Add-on</a>.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Contact</h2>
                <p>For questions about our use of cookies, contact us at <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a>.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Çerezler Nedir</h2>
                <p>Çerezler, bir web sitesini ziyaret ettiğinizde cihazınızda saklanan küçük metin dosyalarıdır. Web sitelerinin düzgün çalışmasına yardımcı olur ve site sahiplerine bilgi sağlar.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Kullandığımız Çerezler</h2>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-stone-700">
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Çerez</th>
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Tür</th>
                        <th className="py-2 pr-4 font-semibold text-stone-800 dark:text-stone-200">Amaç</th>
                        <th className="py-2 font-semibold text-stone-800 dark:text-stone-200">Süre</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">access_token</td>
                        <td className="py-2 pr-4">Zorunlu</td>
                        <td className="py-2 pr-4">JWT kimlik doğrulama tokeni (httpOnly)</td>
                        <td className="py-2">15 dakika</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">refresh_token</td>
                        <td className="py-2 pr-4">Zorunlu</td>
                        <td className="py-2 pr-4">Token yenileme (httpOnly)</td>
                        <td className="py-2">7 gün</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">csrftoken</td>
                        <td className="py-2 pr-4">Zorunlu</td>
                        <td className="py-2 pr-4">CSRF koruması</td>
                        <td className="py-2">1 yıl</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">sessionid</td>
                        <td className="py-2 pr-4">Zorunlu</td>
                        <td className="py-2 pr-4">OAuth akış oturumu</td>
                        <td className="py-2">Oturum</td>
                      </tr>
                      <tr className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-mono text-xs">_ga, _ga_*</td>
                        <td className="py-2 pr-4">Analitik</td>
                        <td className="py-2 pr-4">Google Analytics 4 — anonim kullanım takibi</td>
                        <td className="py-2">2 yıl</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Zorunlu Çerezler</h2>
                <p>Bu çerezler Hizmetin çalışması için kesinlikle gereklidir. Kimlik doğrulama ve güvenliği yönetir. Zorunlu çerezleri devre dışı bırakamazsınız çünkü Hizmet bunlar olmadan çalışmaz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Analitik Çerezler</h2>
                <p>Ziyaretçilerin sitemizle nasıl etkileşim kurduğunu anlamak için Google Analytics 4 kullanırız. Bu çerezler sayfa ziyaretleri ve kullanım kalıpları hakkında anonim bilgi toplar. IP adresleri anonimleştirilir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">Çerezleri Yönetme</h2>
                <p>Çerezleri tarayıcı ayarlarınızdan kontrol edebilirsiniz. Çoğu tarayıcı çerezleri engellemenize veya silmenize olanak tanır. Zorunlu çerezleri engellemenin TrackJobs'u kullanmanızı engelleyeceğini unutmayın.</p>
                <p>Google Analytics'i özellikle devre dışı bırakmak için <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-stone-900 dark:text-stone-100 underline">Google Analytics Devre Dışı Bırakma Tarayıcı Eklentisini</a> yükleyebilirsiniz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">İletişim</h2>
                <p>Çerez kullanımımız hakkında sorularınız için <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a> adresinden bize ulaşabilirsiniz.</p>
              </section>
            </>
          )}
        </div>
      </main>

      <footer className="text-center py-5 text-xs text-stone-400 dark:text-stone-500 border-t border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center justify-center gap-4">
          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
          <Link to="/privacy" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.terms')}</Link>
          <Link to="/cookies" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">{t('footer.cookies')}</Link>
        </div>
      </footer>
    </div>
  )
}
