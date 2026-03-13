import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { BriefcaseIcon } from '../components/icons'

export default function TermsPage() {
  const { t, i18n } = useTranslation()
  const seo = useSEO({ title: t('legal.terms.seoTitle'), description: t('legal.terms.seoDescription'), path: '/terms' })
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
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('legal.terms.title')}</h1>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-8">{t('legal.privacy.lastUpdated')}: 2026-03-13</p>

        <div className="prose prose-stone dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {isEN ? (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">1. Acceptance of Terms</h2>
                <p>By accessing or using TrackJobs ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">2. Description of Service</h2>
                <p>TrackJobs is a free web application and browser extension that helps users track job applications, manage interviews, and organize their job search process.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">3. User Accounts</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You must provide accurate information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must not share your account with others</li>
                  <li>You must be at least 16 years old to use the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">4. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use the Service for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to the Service or its systems</li>
                  <li>Use automated tools to scrape or extract data from the Service</li>
                  <li>Upload malicious content or attempt to disrupt the Service</li>
                  <li>Impersonate others or misrepresent your identity</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">5. Your Data</h2>
                <p>You retain ownership of all data you submit to TrackJobs. We do not sell your personal data to third parties. See our <Link to="/privacy" className="text-stone-900 dark:text-stone-100 underline">Privacy Policy</Link> for details on how we handle your data.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">6. Service Availability</h2>
                <p>TrackJobs is provided "as is" without warranty of any kind. We do not guarantee that the Service will be available at all times or free from errors. We may modify, suspend, or discontinue the Service at any time.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">7. Limitation of Liability</h2>
                <p>To the fullest extent permitted by law, TrackJobs and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of data or missed job opportunities.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">8. Account Termination</h2>
                <p>We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time through your profile settings.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">9. Changes to Terms</h2>
                <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">10. Contact</h2>
                <p>For questions about these Terms, contact us at <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a>.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">1. Koşulların Kabulü</h2>
                <p>TrackJobs'a ("Hizmet") erişerek veya kullanarak bu Kullanım Koşullarına bağlı olmayı kabul edersiniz. Kabul etmiyorsanız, lütfen Hizmeti kullanmayın.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">2. Hizmet Tanımı</h2>
                <p>TrackJobs, kullanıcıların iş başvurularını takip etmelerine, mülakatlarını yönetmelerine ve iş arama süreçlerini organize etmelerine yardımcı olan ücretsiz bir web uygulaması ve tarayıcı eklentisidir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">3. Kullanıcı Hesapları</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hesap oluştururken doğru bilgi sağlamalısınız</li>
                  <li>Hesap bilgilerinizin güvenliğini korumaktan siz sorumlusunuz</li>
                  <li>Hesabınızı başkalarıyla paylaşmamalısınız</li>
                  <li>Hizmeti kullanmak için en az 16 yaşında olmalısınız</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">4. Kabul Edilebilir Kullanım</h2>
                <p>Şunları yapmamayı kabul edersiniz:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Hizmeti herhangi bir yasadışı amaç için kullanmak</li>
                  <li>Hizmete veya sistemlerine yetkisiz erişim sağlamaya çalışmak</li>
                  <li>Hizmetten veri çekmek için otomatik araçlar kullanmak</li>
                  <li>Kötü amaçlı içerik yüklemek veya Hizmeti bozmaya çalışmak</li>
                  <li>Başkalarını taklit etmek veya kimliğinizi yanlış beyan etmek</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">5. Verileriniz</h2>
                <p>TrackJobs'a gönderdiğiniz tüm verilerin sahipliği size aittir. Kişisel verilerinizi üçüncü taraflara satmıyoruz. Verilerinizi nasıl işlediğimiz hakkında detaylar için <Link to="/privacy" className="text-stone-900 dark:text-stone-100 underline">Gizlilik Politikamıza</Link> bakınız.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">6. Hizmet Kullanılabilirliği</h2>
                <p>TrackJobs herhangi bir garanti olmaksızın "olduğu gibi" sağlanmaktadır. Hizmetin her zaman kullanılabilir veya hatasız olacağını garanti etmiyoruz. Hizmeti herhangi bir zamanda değiştirebilir, askıya alabilir veya sonlandırabiliriz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">7. Sorumluluk Sınırlaması</h2>
                <p>Yasaların izin verdiği en geniş ölçüde, TrackJobs ve yaratıcıları, Hizmeti kullanımınızdan kaynaklanan dolaylı, arızi, özel veya sonuç olarak ortaya çıkan zararlardan sorumlu olmayacaktır; veri kaybı veya kaçırılan iş fırsatları dahil ancak bunlarla sınırlı değildir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">8. Hesap Sonlandırma</h2>
                <p>Bu Koşulları ihlal eden hesapları askıya alma veya sonlandırma hakkımızı saklı tutarız. Hesabınızı istediğiniz zaman profil ayarlarınızdan silebilirsiniz.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">9. Koşul Değişiklikleri</h2>
                <p>Bu Koşulları zaman zaman güncelleyebiliriz. Değişikliklerden sonra Hizmeti kullanmaya devam etmeniz yeni Koşulları kabul ettiğiniz anlamına gelir.</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mt-8 mb-3">10. İletişim</h2>
                <p>Bu Koşullar hakkında sorularınız için <a href="mailto:trackjobapplications@gmail.com" className="text-stone-900 dark:text-stone-100 underline">trackjobapplications@gmail.com</a> adresinden bize ulaşabilirsiniz.</p>
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
