import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CreateCompany() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '', address: '', phone: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1 = company info, 2 = admin account

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleNext = (e) => {
    e.preventDefault()
    if (!form.companyName.trim()) { setError('Company name is required.'); return }
    setError(''); setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.adminPassword !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.adminPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/create-company', {
        companyName: form.companyName,
        address: form.address || null,
        phone: form.phone || null,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      })
      login(res.data)          // auto-login after company creation
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all
    font-[inherit] bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:bg-white`

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#13151f] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g2)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-lg">P</div>
          <span className="text-white font-bold text-xl tracking-tight">POSPro</span>
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-6">
            <i className="bi bi-building-fill text-blue-400" /> For business owners
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Launch your<br /><span className="text-blue-400">business today</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
            Create your company workspace. You'll get an invite code to share with your cashiers.
          </p>
          {/* Steps indicator */}
          <div className="flex flex-col gap-3">
            {[
              { n: 1, label: 'Company information' },
              { n: 2, label: 'Admin account setup' },
              { n: 3, label: 'Get your invite code' },
            ].map(s => (
              <div key={s.n} className={`flex items-center gap-3 transition-all ${step >= s.n ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 
                  ${step > s.n ? 'bg-green-500 text-white' : step === s.n ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}`}>
                  {step > s.n ? <i className="bi bi-check" /> : s.n}
                </div>
                <span className={`text-sm ${step === s.n ? 'text-white font-semibold' : 'text-white/50'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-white/25 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 overflow-y-auto">
        <div className="w-full max-w-[440px] py-8">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">P</div>
            <span className="text-gray-900 font-bold text-xl">POSPro</span>
          </div>

          {/* Step indicator (mobile) */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            {[1,2].map(n => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-all ${step >= n ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
            </div>
          )}

          {/* Step 1: Company info */}
          {step === 1 && (
            <form onSubmit={handleNext} className="flex flex-col gap-4">
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Company information</h1>
                <p className="text-sm text-gray-400">Tell us about your business</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company Name *</label>
                <div className="relative">
                  <i className="bi bi-building absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input name="companyName" value={form.companyName} onChange={handleChange} required
                    placeholder="e.g. My Retail Store" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
                <div className="relative">
                  <i className="bi bi-geo-alt absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input name="address" value={form.address} onChange={handleChange}
                    placeholder="123 Main Street, City" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone <span className="text-gray-300 normal-case font-normal">(optional)</span></label>
                <div className="relative">
                  <i className="bi bi-telephone absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+880 1700 000000" className={inputCls} />
                </div>
              </div>

              <button type="submit"
                className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-0 font-[inherit]">
                Next — Admin Account <i className="bi bi-arrow-right" />
              </button>
            </form>
          )}

          {/* Step 2: Admin account */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="mb-2">
                <button type="button" onClick={() => { setStep(1); setError('') }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer font-[inherit] mb-3 p-0">
                  <i className="bi bi-arrow-left" /> Back
                </button>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Admin account</h1>
                <p className="text-sm text-gray-400">This will be the owner/admin of <strong className="text-gray-600">{form.companyName}</strong></p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Name *</label>
                <div className="relative">
                  <i className="bi bi-person absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input name="adminName" value={form.adminName} onChange={handleChange} required
                    placeholder="Your full name" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address *</label>
                <div className="relative">
                  <i className="bi bi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} required
                    placeholder="owner@example.com" className={inputCls} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Password *</label>
                <div className="relative">
                  <i className="bi bi-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} name="adminPassword" value={form.adminPassword}
                    onChange={handleChange} required minLength={6} placeholder="Min 6 characters"
                    className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-sm">
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirm Password *</label>
                <div className="relative">
                  <i className="bi bi-lock-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input type="password" name="confirmPassword" value={form.confirmPassword}
                    onChange={handleChange} required placeholder="Repeat password"
                    className={`${inputCls} ${form.confirmPassword && form.adminPassword !== form.confirmPassword ? 'border-red-300' : form.confirmPassword ? 'border-green-300' : ''}`} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-0 font-[inherit]">
                {loading
                  ? <><i className="bi bi-arrow-repeat animate-spin" /> Creating company...</>
                  : <><i className="bi bi-building-fill-add" /> Launch Company</>
                }
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
