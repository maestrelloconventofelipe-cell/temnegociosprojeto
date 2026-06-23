import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return null

  // Lê localStorage como fallback durante atualização de estado
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  const currentUser = user ?? (token && storedUser ? JSON.parse(storedUser) : null)

  if (!currentUser) return <Navigate to="/login" replace />

  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
