import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from '../dashboard/Sidebar'
import { MenuIcon } from '../icons'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-stone-900 border-b border-stone-100 dark:border-stone-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('dashboard.aria.openMenu')}
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-bold text-stone-800 dark:text-stone-100">TrackJobs</span>
        </div>
        <div className="px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </div>
    </div>
  )
}
