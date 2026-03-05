import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HomeIcon, BarChartIcon, SignOutIcon, BriefcaseIcon, ProfileIcon } from '../icons'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  const NAV_ITEMS = [
    { label: t('dashboard.nav.dashboard'), to: '/dashboard', icon: <HomeIcon /> },
    { label: t('dashboard.nav.analytics'), to: '/analytics', icon: <BarChartIcon /> },
    { label: t('dashboard.nav.profile'), to: '/profile', icon: <ProfileIcon /> },
  ]

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2.5 px-6 py-5"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
          <BriefcaseIcon />
        </div>
        <span className="text-base font-bold text-gray-800 tracking-tight">TrackJobs</span>
      </Link>

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
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — user + sign out */}
      <div className="px-3 pb-5 space-y-2">
        {user && (
          <div className="px-3 py-2 text-xs font-medium text-gray-400 truncate">
            {user.first_name} {user.last_name}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all duration-150"
        >
          <SignOutIcon />
          {t('dashboard.nav.signOut')}
        </button>
      </div>
    </aside>
  )
}
