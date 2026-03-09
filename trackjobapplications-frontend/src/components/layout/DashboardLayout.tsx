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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('dashboard.aria.openMenu')}
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">TrackJobs</span>
        </div>
        <div className="px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </div>
    </div>
  )
}
