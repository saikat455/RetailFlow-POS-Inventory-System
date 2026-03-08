import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Usage:
// <PrivateRoute>                    → any logged-in user
// <PrivateRoute role="Admin">       → Admin only
export default function PrivateRoute({ children, role }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />

  return children
}