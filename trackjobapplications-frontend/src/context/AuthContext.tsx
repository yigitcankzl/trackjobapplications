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
    if (auth.isAuthenticated()) {
      auth.fetchMe().then(setUser).catch(() => auth.clearTokens()).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    function handleForceLogout() {
      setUser(null)
      navigate('/login')
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
      auth.clearTokens()
      setUser(null)
    }
  }, [])

  const logout = useCallback(async () => {
    await auth.logout()
    setUser(null)
    navigate('/login')
  }, [navigate])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
