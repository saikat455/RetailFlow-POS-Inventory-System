import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-6">
          <div className="text-[140px] font-black text-gray-100 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="bi bi-compass text-blue-500 text-5xl" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Page not found</h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link to="/dashboard"
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors shadow-sm shadow-blue-200">
            <i className="bi bi-house-fill" /> Go to Dashboard
          </Link>
          <button onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer font-[inherit] transition-colors">
            <i className="bi bi-arrow-left" /> Go back
          </button>
        </div>
      </div>
    </div>
  )
}
