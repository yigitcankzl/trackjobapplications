import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner />
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
