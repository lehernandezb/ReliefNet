import { Navigate, Outlet } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

/** Wraps a group of pages: must be logged in AND have one of the allowed roles */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="loading-screen">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
