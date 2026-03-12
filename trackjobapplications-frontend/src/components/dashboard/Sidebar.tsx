import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { HomeIcon, BarChartIcon, CalendarIcon, DocumentIcon, SignOutIcon, BriefcaseIcon, ProfileIcon, SunIcon, MoonIcon, CloseIcon, ScaleIcon, PuzzleIcon } from '../icons'
import LanguageSwitcher from '../welcome/LanguageSwitcher'

interface Props {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const NAV_ITEMS = [
    { label: t('dashboard.nav.dashboard'), to: '/dashboard', icon: <HomeIcon /> },
    { label: t('dashboard.nav.calendar'), to: '/calendar', icon: <CalendarIcon /> },
    { label: t('dashboard.nav.coverLetters'), to: '/cover-letters', icon: <DocumentIcon /> },
    { label: t('dashboard.nav.compare'), to: '/compare', icon: <ScaleIcon /> },
    { label: t('dashboard.nav.analytics'), to: '/analytics', icon: <BarChartIcon /> },
    { label: t('dashboard.nav.profile'), to: '/profile', icon: <ProfileIcon /> },
  ]

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <BriefcaseIcon />
          </div>
          <span className="text-base font-bold text-gray-800 dark:text-gray-100 tracking-tight">TrackJobs</span>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t('dashboard.aria.closeMenu')}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Extension */}
      <div className="px-3 pt-2">
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
          <NavLink
            to="/extension"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`
            }
          >
            <PuzzleIcon />
            {t('dashboard.nav.extension')}
          </NavLink>
        </div>
      </div>

      {/* Bottom — theme toggle + user + sign out */}
      <div className="px-3 pb-5 space-y-2">
        <div className="px-1">
          <LanguageSwitcher />
        </div>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {theme === 'dark' ? t('dashboard.nav.lightMode') : t('dashboard.nav.darkMode')}
        </button>
        {user && (
          <div className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 truncate">
            {user.first_name} {user.last_name}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-150"
        >
          <SignOutIcon />
          {t('dashboard.nav.signOut')}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-gray-900 flex flex-col shadow-xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
