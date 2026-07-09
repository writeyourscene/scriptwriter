import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}

export function PublicRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
