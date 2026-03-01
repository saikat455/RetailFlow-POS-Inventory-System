import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-dark bg-primary px-4">
        <span className="navbar-brand fw-bold">🏪 POS System</span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white small">
            👤 {user?.name} &nbsp;
            <span className={`badge ${user?.role === 'Admin' ? 'bg-warning text-dark' : 'bg-light text-dark'}`}>
              {user?.role}
            </span>
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container mt-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <h2 className="fw-bold text-success mb-2">✅ Authentication Successful!</h2>
            <p className="text-muted">You're logged in as <strong>{user?.name}</strong> with role <strong>{user?.role}</strong>.</p>
            <p className="text-muted">Dashboard coming in next step — Products, POS, Reports.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
