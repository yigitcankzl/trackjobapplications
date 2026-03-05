import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import Header from '../components/dashboard/Header'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { updateProfile, changePassword } from '../services/auth'
import { getAvatarColor } from '../lib/avatar'
import { CameraIcon, UploadIcon, DownloadIcon } from '../components/icons'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const { addToast } = useToast()

  const [firstName, setFirstName] = useState(user?.first_name ?? '')
  const [lastName, setLastName] = useState(user?.last_name ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

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
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('first_name', firstName)
      fd.append('last_name', lastName)
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

  const avatarSrc = avatarPreview || user?.avatar || null

  return (
    <DashboardLayout>
      <Header title={t('profile.title')} />
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        {/* Profile Info */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${colorClass}`}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"
              >
                <CameraIcon />
              </button>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('profile.firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('profile.lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Resume */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">{t('profile.resume')}</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => resumeInput.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <UploadIcon />
                {t('profile.uploadResume')}
              </button>
              {resumeFile && <span className="text-xs text-gray-400">{resumeFile.name}</span>}
              {!resumeFile && user?.resume && (
                <a
                  href={user.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <DownloadIcon />
                  {t('profile.downloadResume')}
                </a>
              )}
              <input ref={resumeInput} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50"
          >
            {saving ? '...' : t('profile.saveProfile')}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">{t('profile.changePassword')}</h2>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('profile.oldPassword')}</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('profile.newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('profile.confirmNewPassword')}</label>
              <input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50"
          >
            {changingPassword ? '...' : t('profile.changePassword')}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
