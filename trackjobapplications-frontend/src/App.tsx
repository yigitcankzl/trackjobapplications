import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import PrivateRoute from './components/auth/PrivateRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

const WelcomePage = lazy(() => import('./pages/WelcomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'))
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const CoverLettersPage = lazy(() => import('./pages/CoverLettersPage'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetailPage /></PrivateRoute>} />
              <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
              <Route path="/cover-letters" element={<PrivateRoute><CoverLettersPage /></PrivateRoute>} />
              <Route path="/compare" element={<PrivateRoute><ComparisonPage /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
