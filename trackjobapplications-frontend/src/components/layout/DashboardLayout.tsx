import { ReactNode, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from '../dashboard/Sidebar'
import { MenuIcon } from '../icons'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1')

  const toggleCollapse = useCallback(() => {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
      return next
    })
  }, [])

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-100/60 dark:border-stone-800 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('dashboard.aria.openMenu')}
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-bold text-stone-800 dark:text-stone-100">TrackJobs</span>
        </div>
        <div className="px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 flex-1">
          {children}
        </div>
        <footer className="px-4 py-4 sm:px-6 lg:px-8 border-t border-stone-100/60 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400 dark:text-stone-500">
            <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/yigitcankzl/trackjobapplications" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="mailto:trackjobapplications@gmail.com" className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
                {t('footer.contact')}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
