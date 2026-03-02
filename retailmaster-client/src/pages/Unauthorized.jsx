import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Unauthorized() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="relative mb-6">
          <div className="text-[140px] font-black text-gray-100 leading-none select-none">403</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <i className="bi bi-shield-x text-red-400 text-5xl" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-sm text-gray-400 mb-3 leading-relaxed">
          You don't have permission to view this page.
        </p>
        {user && (
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full mb-7">
            <i className="bi bi-person-fill" />
            Logged in as <strong>{user.name}</strong> ({user.role})
          </div>
        )}

        <div className="flex items-center justify-center gap-3 mt-2">
          <Link to="/dashboard"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors">
            <i className="bi bi-house-fill" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
