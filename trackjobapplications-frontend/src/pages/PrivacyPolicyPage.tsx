import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { BriefcaseIcon } from '../components/icons'

export default function PrivacyPolicyPage() {
  const { t, i18n } = useTranslation()
  const seo = useSEO({ title: t('legal.privacy.seoTitle'), description: t('legal.privacy.seoDescription'), path: '/privacy' })
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
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('legal.privacy.title')}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-8">{t('legal.privacy.lastUpdated')}: 2026-03-14</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {isEN ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">1. Information We Collect</h2>
                <p><strong>Account Information:</strong> When you create an account, we collect your name, email address, and password (hashed). If you sign in via Google or GitHub OAuth, we receive your name, email, and profile picture from those providers.</p>
                <p><strong>Application Data:</strong> Job applications you create including company name, position, status, notes, interview details, contacts, attachments, and offer details.</p>
                <p><strong>Usage Data:</strong> We use Google Analytics 4 to collect anonymous usage data such as pages visited, browser type, and general location (country level). IP addresses are anonymized.</p>
                <p><strong>Cookies:</strong> We use essential httpOnly cookies for authentication (JWT tokens). Google Analytics sets additional cookies for analytics purposes. See our <Link to="/cookies" className="text-stone-900 dark:text-stone-100 underline">Cookie Policy</Link> for details.</p>
                <p><strong>Browser Extension Data:</strong> When you use the TrackJobs browser extension, it accesses the active tab URL and page title to detect job postings. Authentication tokens are encrypted locally using AES-256-GCM via the Web Crypto API. No browsing data is sent to our servers beyond the job application details you explicitly save.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide and maintain the TrackJobs service</li>
                  <li>To authenticate your identity and secure your account</li>
                  <li>To send email notifications you have opted into (interview reminders)</li>
                  <li>To analyze usage patterns and improve the service</li>
                  <li>To respond to support requests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">3. Third-Party Services</h2>
                <p>We use the following third-party services that may process your data:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Google OAuth:</strong> For social login authentication</li>
                  <li><strong>GitHub OAuth:</strong> For social login authentication</li>
                  <li><strong>Google Analytics 4:</strong> For anonymous usage analytics</li>
                  <li><strong>Vercel:</strong> For hosting the web application</li>
                  <li><strong>Render:</strong> For hosting the API server</li>
                  <li><strong>Neon:</strong> For database hosting (PostgreSQL)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">4. Data Storage & Security</h2>
                <p>Your data is stored on secure cloud infrastructure. Passwords are hashed using industry-standard algorithms. Authentication tokens are stored in httpOnly cookies to prevent XSS attacks. All data is transmitted over HTTPS. The browser extension encrypts authentication tokens locally using AES-256-GCM via the Web Crypto API before storing them in browser storage.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">5. Your Rights (GDPR & CCPA)</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                  <li><strong>Export:</strong> Download your data in a portable format (CSV export)</li>
                  <li><strong>Opt-out:</strong> Disable analytics tracking via your browser settings or cookie preferences</li>
                </ul>
                <p className="mt-2">To exercise these rights, contact us at <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a>.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">6. Data Retention</h2>
                <p>We retain your data for as long as your account is active. If you delete your account, all personal data and application data will be permanently removed within 30 days.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">7. Children's Privacy</h2>
                <p>TrackJobs is not intended for users under the age of 16. We do not knowingly collect data from children.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">8. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via email or an in-app notice.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">9. Contact</h2>
                <p>If you have questions about this Privacy Policy, contact us at <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a>.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">1. Topladığımız Bilgiler</h2>
                <p><strong>Hesap Bilgileri:</strong> Hesap oluşturduğunuzda adınızı, e-posta adresinizi ve şifrenizi (hashlenmiş) toplarız. Google veya GitHub OAuth ile giriş yaparsanız, bu sağlayıcılardan adınızı, e-postanızı ve profil fotoğrafınızı alırız.</p>
                <p><strong>Başvuru Verileri:</strong> Oluşturduğunuz iş başvuruları; şirket adı, pozisyon, durum, notlar, mülakat detayları, kişiler, ekler ve teklif detayları dahil.</p>
                <p><strong>Kullanım Verileri:</strong> Ziyaret edilen sayfalar, tarayıcı türü ve genel konum (ülke düzeyi) gibi anonim kullanım verilerini toplamak için Google Analytics 4 kullanırız. IP adresleri anonimleştirilir.</p>
                <p><strong>Çerezler:</strong> Kimlik doğrulama için temel httpOnly çerezler (JWT token) kullanırız. Google Analytics, analiz amaçlı ek çerezler ayarlar. Detaylar için <Link to="/cookies" className="text-stone-900 dark:text-stone-100 underline">Çerez Politikamıza</Link> bakınız.</p>
                <p><strong>Tarayıcı Eklentisi Verileri:</strong> TrackJobs tarayıcı eklentisini kullandığınızda, iş ilanlarını tespit etmek için aktif sekmenin URL'sine ve sayfa başlığına erişir. Kimlik doğrulama tokenları Web Crypto API aracılığıyla AES-256-GCM kullanılarak yerel olarak şifrelenir. Açıkça kaydettiğiniz iş başvuru bilgileri dışında hiçbir tarama verisi sunucularımıza gönderilmez.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">2. Bilgilerinizi Nasıl Kullanırız</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>TrackJobs hizmetini sağlamak ve sürdürmek için</li>
                  <li>Kimliğinizi doğrulamak ve hesabınızı güvence altına almak için</li>
                  <li>Kabul ettiğiniz e-posta bildirimlerini göndermek için (mülakat hatırlatmaları)</li>
                  <li>Kullanım kalıplarını analiz etmek ve hizmeti geliştirmek için</li>
                  <li>Destek taleplerine yanıt vermek için</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">3. Üçüncü Taraf Hizmetler</h2>
                <p>Verilerinizi işleyebilecek aşağıdaki üçüncü taraf hizmetleri kullanırız:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Google OAuth:</strong> Sosyal giriş kimlik doğrulaması</li>
                  <li><strong>GitHub OAuth:</strong> Sosyal giriş kimlik doğrulaması</li>
                  <li><strong>Google Analytics 4:</strong> Anonim kullanım analitikleri</li>
                  <li><strong>Vercel:</strong> Web uygulaması barındırma</li>
                  <li><strong>Render:</strong> API sunucusu barındırma</li>
                  <li><strong>Neon:</strong> Veritabanı barındırma (PostgreSQL)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">4. Veri Depolama ve Güvenlik</h2>
                <p>Verileriniz güvenli bulut altyapısında saklanır. Şifreler endüstri standardı algoritmalarla hashlenir. Kimlik doğrulama tokenları XSS saldırılarını önlemek için httpOnly çerezlerde saklanır. Tüm veriler HTTPS üzerinden iletilir. Tarayıcı eklentisi, kimlik doğrulama tokenlarını tarayıcı deposunda saklamadan önce Web Crypto API aracılığıyla AES-256-GCM ile yerel olarak şifreler.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">5. Haklarınız (GDPR & CCPA)</h2>
                <p>Aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Erişim:</strong> Kişisel verilerinizin bir kopyasını talep edin</li>
                  <li><strong>Düzeltme:</strong> Yanlış verileri güncelleyin veya düzeltin</li>
                  <li><strong>Silme:</strong> Hesabınızın ve tüm ilgili verilerin silinmesini talep edin</li>
                  <li><strong>Dışa Aktarma:</strong> Verilerinizi taşınabilir formatta indirin (CSV dışa aktarma)</li>
                  <li><strong>Devre Dışı Bırakma:</strong> Tarayıcı ayarları veya çerez tercihleriniz aracılığıyla analiz takibini devre dışı bırakın</li>
                </ul>
                <p className="mt-2">Bu haklarınızı kullanmak için <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a> adresinden bize ulaşın.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">6. Veri Saklama</h2>
                <p>Hesabınız aktif olduğu sürece verilerinizi saklarız. Hesabınızı silerseniz, tüm kişisel veriler ve başvuru verileri 30 gün içinde kalıcı olarak kaldırılır.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">7. Çocukların Gizliliği</h2>
                <p>TrackJobs 16 yaşından küçük kullanıcılar için tasarlanmamıştır. Çocuklardan bilerek veri toplamayız.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">8. Politika Değişiklikleri</h2>
                <p>Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler hakkında kullanıcıları e-posta veya uygulama içi bildirim ile bilgilendiririz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">9. İletişim</h2>
                <p>Bu Gizlilik Politikası hakkında sorularınız varsa <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a> adresinden bize ulaşabilirsiniz.</p>
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
