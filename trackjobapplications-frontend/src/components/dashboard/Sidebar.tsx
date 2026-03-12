import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { HomeIcon, BarChartIcon, CalendarIcon, DocumentIcon, SignOutIcon, BriefcaseIcon, ProfileIcon, SunIcon, MoonIcon, CloseIcon, ScaleIcon, PuzzleIcon, ChevronLeftIcon, ChevronRightIcon, MailIcon } from '../icons'
import LanguageSwitcher from '../welcome/LanguageSwitcher'

interface Props {
  mobileOpen?: boolean
  onMobileClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: Props) {
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
    { label: t('dashboard.nav.dashboard'), to: '/dashboard', icon: <HomeIcon />, iconColor: 'text-blue-500 dark:text-blue-400' },
    { label: t('dashboard.nav.calendar'), to: '/calendar', icon: <CalendarIcon />, iconColor: 'text-orange-500 dark:text-orange-400' },
    { label: t('dashboard.nav.coverLetters'), to: '/cover-letters', icon: <DocumentIcon />, iconColor: 'text-sky-500 dark:text-sky-400' },
    { label: t('dashboard.nav.compare'), to: '/compare', icon: <ScaleIcon />, iconColor: 'text-purple-500 dark:text-purple-400' },
    { label: t('dashboard.nav.analytics'), to: '/analytics', icon: <BarChartIcon />, iconColor: 'text-rose-500 dark:text-rose-400' },
    { label: t('dashboard.nav.profile'), to: '/profile', icon: <ProfileIcon />, iconColor: 'text-amber-500 dark:text-amber-400' },
  ]

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center' : ''
    } ${isActive
      ? 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200'
    }`

  const sidebarContent = (isCollapsed: boolean) => (
    <>
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center px-3' : 'justify-between px-6'} py-5`}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-stone-100 flex items-center justify-center flex-shrink-0">
            <BriefcaseIcon />
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold text-stone-800 dark:text-stone-100 tracking-tight">TrackJobs</span>
          )}
        </Link>
        {!isCollapsed && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('dashboard.aria.closeMenu')}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end className={navLinkClass} title={isCollapsed ? item.label : undefined}>
            {({ isActive }) => (
              <>
                <span className={isActive ? '' : item.iconColor}>{item.icon}</span>
                {!isCollapsed && item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Extension */}
      <div className="px-3 pt-2">
        <div className="border-t border-stone-200 dark:border-stone-800 pt-3">
          <NavLink to="/extension" className={navLinkClass} title={isCollapsed ? t('dashboard.nav.extension') : undefined}>
            <PuzzleIcon />
            {!isCollapsed && t('dashboard.nav.extension')}
          </NavLink>
        </div>
      </div>

      {/* Feedback */}
      <div className="px-3">
        <a
          href="mailto:trackjobapplications@gmail.com"
          title={isCollapsed ? t('dashboard.nav.feedback') : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-150 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <MailIcon />
          {!isCollapsed && t('dashboard.nav.feedback')}
        </a>
      </div>

      {/* Bottom — theme toggle + user + sign out */}
      <div className="px-3 pb-5 space-y-2">
        <div className={isCollapsed ? 'flex justify-center' : 'px-1'}>
          <LanguageSwitcher compact={isCollapsed} />
        </div>
        <button
          onClick={toggleTheme}
          title={isCollapsed ? (theme === 'dark' ? t('dashboard.nav.lightMode') : t('dashboard.nav.darkMode')) : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-150 ${isCollapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          {!isCollapsed && (theme === 'dark' ? t('dashboard.nav.lightMode') : t('dashboard.nav.darkMode'))}
        </button>
        {!isCollapsed && user && (
          <div className="px-3 py-2 text-xs font-medium text-stone-400 dark:text-stone-500 truncate">
            {user.first_name} {user.last_name}
          </div>
        )}
        <button
          onClick={logout}
          title={isCollapsed ? t('dashboard.nav.signOut') : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-150 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <SignOutIcon />
          {!isCollapsed && t('dashboard.nav.signOut')}
        </button>

        {/* Collapse toggle (desktop only) */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-150 ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? t('dashboard.aria.openMenu') : t('dashboard.aria.closeMenu')}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            {!isCollapsed && t('dashboard.nav.collapse')}
          </button>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex h-screen sticky top-0 bg-white dark:bg-stone-900 border-r border-stone-200/60 dark:border-stone-800 shadow-sm flex-col overflow-visible transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent(!!collapsed)}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} aria-hidden="true" />
          <aside className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-stone-900 flex flex-col border-r border-stone-200 dark:border-stone-800 animate-slide-in">
            {sidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  )
}
