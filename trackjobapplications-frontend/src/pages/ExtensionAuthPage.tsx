import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/axios'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function ExtensionAuthPage() {
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function fetchToken() {
      try {
        const { data } = await api.post('/auth/extension-token/')
        if (cancelled) return
        // Put tokens in hash so the extension's tab watcher can read them.
        // The hash is never sent to the server — stays client-side only.
        const params = new URLSearchParams({
          access: data.access,
          refresh: data.refresh,
          email: data.email,
        })
        window.location.hash = params.toString()
        // Clear hash after a short delay to reduce token exposure in browser history.
        // The extension's tab watcher reads the URL before this fires.
        setTimeout(() => { window.location.hash = ''; history.replaceState(null, '', window.location.pathname); }, 500)
      } catch {
        if (cancelled) return
        // Not authenticated — redirect to login with ?next= so user comes back here
        navigate('/login?next=/extension-auth', { replace: true })
      }
    }

    fetchToken()
    return () => { cancelled = true }
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-950 gap-4">
      <LoadingSpinner />
      <p className="text-stone-500 text-sm">Connecting extension...</p>
    </div>
  )
}
