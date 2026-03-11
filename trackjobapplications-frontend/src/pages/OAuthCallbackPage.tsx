import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../lib/axios'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    if (!code) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    api.post('/auth/social/token/', { code })
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login?error=oauth_failed', { replace: true }))
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  )
}
