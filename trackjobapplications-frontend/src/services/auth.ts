import api from '../lib/axios'
import { NotificationPreference, User } from '../types'

export async function login(email: string, password: string): Promise<void> {
  // Backend sets httpOnly cookies on success — no tokens to handle here
  await api.post('/auth/login/', { email, password })
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
  try {
    // Backend clears httpOnly cookies and blacklists the refresh token
    await api.post('/auth/logout/', {})
  } catch {
    // Ignore errors — cookies will expire naturally
  }
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
