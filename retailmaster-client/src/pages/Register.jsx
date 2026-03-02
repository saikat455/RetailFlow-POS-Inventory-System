import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const roles = [
  { value: 'Cashier', label: 'Cashier', icon: 'bi-person-badge', desc: 'Process sales, view products' },
  { value: 'Admin',   label: 'Admin',   icon: 'bi-shield-check', desc: 'Full access, manage products' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'Cashier',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const passwordStrength = (p) => {
    if (!p) return null
    let score = 0
    if (p.length >= 6) score++
    if (p.length >= 10) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Weak', color: 'bg-red-400', w: 'w-1/4', text: 'text-red-500' }
    if (score <= 2) return { label: 'Fair', color: 'bg-amber-400', w: 'w-2/4', text: 'text-amber-500' }
    if (score <= 3) return { label: 'Good', color: 'bg-blue-400', w: 'w-3/4', text: 'text-blue-500' }
    return { label: 'Strong', color: 'bg-green-400', w: 'w-full', text: 'text-green-500' }
  }

  const strength = passwordStrength(form.password)
  const passwordMatch = form.confirmPassword && form.password === form.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email,
        password: form.password, role: form.role,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all
    font-[inherit] bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:bg-white`

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-[popIn_0.4s_ease]">
            <i className="bi bi-check-lg text-green-500 text-4xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Account created!</h2>
          <p className="text-sm text-gray-400">Redirecting to login page...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full animate-[progress_2s_linear]" />
            </div>
          </div>
        </div>
        <style>{`
          @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes progress { from { width: 0%; } to { width: 100%; } }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-[#13151f] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/30">P</div>
          <span className="text-white font-bold text-xl tracking-tight">POSPro</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-6">
            <i className="bi bi-person-plus-fill text-blue-400" />
            Join your team
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Create your<br />
            <span className="text-blue-400">account today</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Get access to inventory management, sales tracking, and real-time reports.
          </p>

          {/* Steps */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: 'bi-person-fill', text: 'Fill in your details' },
              { icon: 'bi-shield-lock-fill', text: 'Choose your role' },
              { icon: 'bi-rocket-takeoff-fill', text: 'Start managing your store' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`bi ${step.icon} text-blue-400 text-xs`} />
                </div>
                <span className="text-white/60 text-sm">{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-white/25 text-xs">
          © {new Date().getFullYear()} POSPro. All rights reserved.
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
        <div className="w-full max-w-[440px] py-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white shadow-md shadow-blue-500/30">P</div>
            <span className="text-gray-900 font-bold text-xl tracking-tight">POSPro</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Create account</h1>
            <p className="text-sm text-gray-400">Fill in the form to register a new user</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <i className="bi bi-person absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange} required
                  placeholder="John Doe"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required
                  placeholder="john@example.com"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Role selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
              <div className="grid grid-cols-2 gap-2.5">
                {roles.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`flex flex-col gap-1 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer font-[inherit]
                      ${form.role === r.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <i className={`bi ${r.icon} text-sm ${form.role === r.value ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${form.role === r.value ? 'text-blue-600' : 'text-gray-700'}`}>
                        {r.label}
                      </span>
                      {form.role === r.value && (
                        <i className="bi bi-check-circle-fill text-blue-500 text-xs ml-auto" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 leading-tight">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password</label>
              <div className="relative">
                <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password" value={form.password}
                  onChange={handleChange} required minLength={6}
                  placeholder="Min 6 characters"
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-sm transition-colors">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {/* Strength bar */}
              {form.password && strength && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                  </div>
                  <span className={`text-[11px] font-semibold ${strength.text}`}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password</label>
              <div className="relative">
                <i className="bi bi-lock-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} required
                  placeholder="Repeat password"
                  className={`${inputCls} pr-10 ${form.confirmPassword && !passwordMatch ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : form.confirmPassword && passwordMatch ? 'border-green-300' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-sm transition-colors">
                  <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {form.confirmPassword && (
                <p className={`text-[11px] font-medium flex items-center gap-1 ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
                  <i className={`bi ${passwordMatch ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                  {passwordMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="mt-1 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-blue-200 cursor-pointer border-0 font-[inherit]">
              {loading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Creating account...</>
                : <><i className="bi bi-person-plus-fill" /> Create Account</>
              }
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold no-underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}