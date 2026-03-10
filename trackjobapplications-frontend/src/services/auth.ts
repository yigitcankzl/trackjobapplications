import api from '../lib/axios'
import { AuthTokens, NotificationPreference, User } from '../types'

const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.access)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEYS.refresh)
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}

export function saveTokens(tokens: AuthTokens): void {
  try {
    localStorage.setItem(TOKEN_KEYS.access, tokens.access)
    localStorage.setItem(TOKEN_KEYS.refresh, tokens.refresh)
  } catch {
    // Safari private browsing or quota exceeded
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(TOKEN_KEYS.access)
    localStorage.removeItem(TOKEN_KEYS.refresh)
  } catch {
    // Safari private browsing
  }
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login/', { email, password })
  saveTokens(data)
  return data
}

export async function register(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
  password2: string,
): Promise<User> {
  const { data } = await api.post<User>('/auth/register/', {
    email,
    first_name: firstName,
    last_name: lastName,
    password,
    password2,
  })
  return data
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken()
  if (refresh) {
    try {
      await api.post('/auth/logout/', { refresh })
    } catch {
      // Token may already be blacklisted — ignore
    }
  }
  clearTokens()
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me/')
  return data
}

export async function updateProfile(formData: FormData): Promise<User> {
  const { data } = await api.patch<User>('/auth/me/', formData)
  return data
}

export async function fetchNotificationPreferences(): Promise<NotificationPreference> {
  const { data } = await api.get<NotificationPreference>('/auth/me/notifications/')
  return data
}

export async function updateNotificationPreferences(
  prefs: Partial<NotificationPreference>,
): Promise<NotificationPreference> {
  const { data } = await api.patch<NotificationPreference>('/auth/me/notifications/', prefs)
  return data
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  newPassword2: string,
): Promise<void> {
  await api.post('/auth/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
    new_password2: newPassword2,
  })
}

export async function verifyEmail(uid: string, token: string): Promise<void> {
  await api.post('/auth/verify-email/', { uid, token })
}

export async function resendVerification(): Promise<void> {
  await api.post('/auth/resend-verification/')
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post('/auth/password-reset/', { email })
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword: string,
  newPassword2: string,
): Promise<void> {
  await api.post('/auth/password-reset/confirm/', {
    uid,
    token,
    new_password: newPassword,
    new_password2: newPassword2,
  })
}
