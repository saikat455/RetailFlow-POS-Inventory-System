import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (hasError) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all font-[inherit] bg-gray-50 text-gray-800
    ${hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-3 focus:ring-red-100'
      : 'border-gray-200 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:bg-white'
    }`

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex w-[480px] flex-shrink-0 bg-[#13151f] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(79,124,255,0.05) 0%, transparent 70%)'
            }} />
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">
            P
          </div>
          <span className="text-white font-bold text-xl tracking-tight">POSPro</span>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-6">
            <i className="bi bi-lightning-charge-fill text-yellow-400" />
            Smart retail management
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Manage your<br />
            <span className="text-blue-400">store smarter</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Track inventory, process sales, and monitor profits — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Real-time stock', 'Sales analytics', 'Low stock alerts', 'Role-based access'].map(f => (
              <span key={f} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-1.5 rounded-full">
                <i className="bi bi-check-circle-fill text-green-400 text-[10px]" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} POSPro. All rights reserved.
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-blue-500/30">P</div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">POSPro</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400">Sign in to your account to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required
                  placeholder="admin@example.com"
                  className={inputCls(false)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required
                  placeholder="••••••••"
                  className={`${inputCls(false)} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-sm transition-colors"
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-200 cursor-pointer border-0 font-[inherit]"
            >
              {loading ? (
                <><i className="bi bi-arrow-repeat animate-spin" /> Signing in...</>
              ) : (
                <><i className="bi bi-box-arrow-in-right" /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold no-underline transition-colors">
                Register here
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold mb-1.5">
              <i className="bi bi-info-circle mr-1.5" />Demo credentials
            </p>
            <p className="text-xs text-blue-500/80 font-mono">
              Email: admin@example.com<br />
              Password: password123
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}