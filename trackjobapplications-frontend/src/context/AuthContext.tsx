import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../types'
import * as auth from '../services/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, firstName: string, lastName: string, password: string, password2: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    // Always attempt fetchMe — auth state is determined by httpOnly cookie, not localStorage
    auth.fetchMe()
      .then(me => { if (active) setUser(me) })
      .catch(() => { /* Not authenticated — stay logged out */ })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    function handleForceLogout() {
      setUser(null)
      const publicPaths = ['/', '/login', '/forgot-password', '/reset-password', '/verify-email', '/oauth-callback', '/extension-auth', '/privacy', '/terms', '/cookies']
      if (!publicPaths.some(p => window.location.pathname.startsWith(p))) {
        navigate('/')
      }
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [navigate])

  const login = useCallback(async (email: string, password: string) => {
    await auth.login(email, password)
    const me = await auth.fetchMe()
    setUser(me)
  }, [])

  const register = useCallback(async (
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    password2: string,
  ) => {
    await auth.register(email, firstName, lastName, password, password2)
    await auth.login(email, password)
    const me = await auth.fetchMe()
    setUser(me)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const me = await auth.fetchMe()
      setUser(me)
    } catch {
      setUser(null)
    }
  }, [])

  const logout = useCallback(async () => {
    await auth.logout()
    setUser(null)
    // Clear user-specific data from localStorage
    localStorage.removeItem('tj_search_history')
    localStorage.removeItem('tj_widget_order')
    localStorage.removeItem('dismissed_interview_reminders')
    // Clear PWA service worker cache
    if ('caches' in window) {
      caches.delete('trackjobs-v1').catch(() => {})
    }
    navigate('/')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
