import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSEO } from '../hooks/useSEO'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile, changePassword } from '../services/auth'
import { getAvatarColor } from '../lib/avatar'
import { CameraIcon, UploadIcon, DownloadIcon } from '../components/icons'
import DragDropZone from '../components/profile/DragDropZone'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const { addToast } = useToast()
  const seo = useSEO({ title: t('seo.profile.title'), description: t('seo.profile.description'), path: '/profile', noIndex: true })

  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [notificationEmail, setNotificationEmail] = useState(user?.notification_email ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setNotificationEmail(user.notification_email ?? '')
    }
  }, [user])


  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const avatarInput = useRef<HTMLInputElement>(null)
  const resumeInput = useRef<HTMLInputElement>(null)

  const initials = user ? `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase() : ''
  const colorClass = user ? getAvatarColor(user.first_name) : ''

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('first_name', firstName)
      fd.append('last_name', lastName)
      fd.append('notification_email', notificationEmail)
      if (avatarFile) fd.append('avatar', avatarFile)
      if (resumeFile) fd.append('resume', resumeFile)
      await updateProfile(fd)
      await refreshUser()
      setAvatarFile(null)
      setResumeFile(null)
      addToast(t('profile.profileSaved'), 'success')
    } catch {
      addToast(t('profile.errors.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== newPassword2) {
      addToast(t('profile.errors.passwordMismatch'), 'error')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(oldPassword, newPassword, newPassword2)
      setOldPassword('')
      setNewPassword('')
      setNewPassword2('')
      addToast(t('profile.passwordChanged'), 'success')
    } catch {
      addToast(t('profile.errors.passwordChangeFailed'), 'error')
    } finally {
      setChangingPassword(false)
    }
  }

  // Cleanup avatar preview URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  }, [avatarPreview])

  const avatarSrc = avatarPreview || user?.avatar || null

  return (
    <DashboardLayout>
      {seo}
      <Header title={t('profile.title')} />
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        {/* Profile Info */}
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-6 space-y-6">
          {/* Avatar */}
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-white/70 dark:bg-stone-900/70 backdrop-blur-[2px] rounded-lg z-10 flex flex-col items-center justify-center gap-1">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('comingSoon')}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">{t('comingSoonDesc')}</span>
            </div>
            <DragDropZone
              onFileDrop={file => { setAvatarFile(file); if (avatarPreview) URL.revokeObjectURL(avatarPreview); setAvatarPreview(URL.createObjectURL(file)) }}
              accept="image/*"
              label={t('profile.dropAvatar')}
            >
              <div className="flex items-center gap-5 p-1">
                <div className="relative">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={t('profile.avatarAlt')} className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${colorClass}`}>
                      {initials}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-stone-900 text-white dark:bg-white dark:text-stone-900 flex items-center justify-center hover:bg-stone-800 transition-colors"
                  >
                    <CameraIcon />
                  </button>
                  <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{user?.email}</p>
                </div>
              </div>
            </DragDropZone>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
              />
            </div>
          </div>

          {/* Notification Email */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.notificationEmail')}</label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder={user?.email}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
            />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{t('profile.notificationEmailHint')}</p>
          </div>

          {/* Resume */}
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">{t('profile.resume')}</label>
            <div className="relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-white/70 dark:bg-stone-900/70 backdrop-blur-[2px] rounded-lg z-10 flex flex-col items-center justify-center gap-1">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('comingSoon')}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500">{t('comingSoonDesc')}</span>
              </div>
              <DragDropZone
                onFileDrop={file => setResumeFile(file)}
                accept=".pdf,.doc,.docx"
                label={t('profile.dropResume')}
              >
                <div className="flex items-center gap-3 p-1">
                  <button
                    type="button"
                    onClick={() => resumeInput.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    <UploadIcon />
                    {t('profile.uploadResume')}
                  </button>
                  {resumeFile && <span className="text-xs text-stone-400">{resumeFile.name}</span>}
                  {!resumeFile && user?.resume && (
                    <a
                      href={user.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:underline"
                    >
                      <DownloadIcon />
                      {t('profile.downloadResume')}
                    </a>
                  )}
                  <input ref={resumeInput} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
                </div>
              </DragDropZone>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? '...' : t('profile.saveProfile')}
          </button>
        </form>

        {/* Email Notifications - Coming Soon */}
        <div className="relative bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-6 space-y-5 overflow-hidden">
          {/* Coming Soon overlay */}
          <div className="absolute inset-0 bg-white/70 dark:bg-stone-900/70 backdrop-blur-[2px] rounded-lg z-10 flex flex-col items-center justify-center gap-1.5">
            <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">{t('comingSoon')}</span>
            <span className="text-xs text-stone-400 dark:text-stone-500">{t('profile.notifications.comingSoonDesc')}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{t('profile.notifications.title')}</h2>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{t('profile.notifications.description')}</p>
            </div>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-stone-300 dark:bg-stone-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
              {t('profile.notifications.reminderTime')}
            </label>
            <div className="flex gap-2">
              {[1, 6, 24, 48].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  disabled
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                >
                  {t(`profile.notifications.hours.${hours}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-stone-900 rounded-lg border border-stone-100/60 dark:border-stone-800 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">{t('profile.changePassword')}</h2>
          <div>
            <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.oldPassword')}</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">{t('profile.confirmNewPassword')}</label>
              <input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400/20 focus:border-stone-400"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {changingPassword ? '...' : t('profile.changePassword')}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
