import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

const strength = (p) => {
  if (!p) return null
  let s = 0
  if (p.length >= 6) s++; if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return [null,
    { label: 'Weak',   bar: 'w-1/4', color: 'bg-red-400',   text: 'text-red-500'   },
    { label: 'Fair',   bar: 'w-2/4', color: 'bg-amber-400',  text: 'text-amber-500' },
    { label: 'Good',   bar: 'w-3/4', color: 'bg-blue-400',   text: 'text-blue-500'  },
    { label: 'Strong', bar: 'w-full', color: 'bg-green-400', text: 'text-green-500' },
    { label: 'Strong', bar: 'w-full', color: 'bg-green-400', text: 'text-green-500' },
  ][Math.min(s, 5)]
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirmPassword: '', inviteCode: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [codeStatus, setCodeStatus] = useState(null) // null | 'checking' | {ok,companyName,branchName} | {ok:false}
  const [successData, setSuccessData] = useState(null)
  const codeTimer = useRef(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    const code = form.inviteCode.trim()
    if (!code) { setCodeStatus(null); return }
    setCodeStatus('checking')
    clearTimeout(codeTimer.current)
    codeTimer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/branches/validate-invite/${code}`)
        setCodeStatus({ ok: true, companyName: r.data.companyName, branchName: r.data.branchName })
      } catch {
        setCodeStatus({ ok: false })
      }
    }, 500)
  }, [form.inviteCode])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!codeStatus?.ok) { setError('Enter a valid branch invite code first.'); return }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email,
        password: form.password,
        inviteCode: form.inviteCode.toUpperCase().trim(),
      })
      setSuccessData(codeStatus)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const str   = strength(form.password)
  const match = form.confirmPassword && form.password === form.confirmPassword

  const inputCls = `w-full py-3 px-4 rounded-xl border text-sm outline-none transition-all font-[inherit]
    bg-gray-50 text-gray-800 focus:bg-white focus:ring-3`

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-green-100">
          <i className="bi bi-check-lg text-green-500 text-4xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="text-xs text-gray-400 mb-1">You have been added to</div>
          <div className="font-bold text-gray-800">{successData?.companyName}</div>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <i className="bi bi-building text-blue-400 text-xs" />
            <span className="text-sm text-blue-500 font-semibold">{successData?.branchName}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#0f1117] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-base">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2 text-xs text-white/50 mb-6">
            <i className="bi bi-building-fill text-blue-400 text-xs" /> Branch-based access
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Join your<br /><span className="text-blue-400">branch today</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
            Each branch has its own invite code. Your account will be locked to that branch — you can only see and manage that branch's data.
          </p>

          {/* Steps */}
          <div className="flex flex-col gap-4">
            {[
              { icon: 'bi-key-fill',        color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: 'Get branch invite code', sub: 'Ask your Admin for your branch code' },
              { icon: 'bi-person-fill',     color: 'text-blue-400',   bg: 'bg-blue-400/10',   title: 'Create your account',    sub: 'Fill in your details below' },
              { icon: 'bi-shield-lock-fill',color: 'text-green-400',  bg: 'bg-green-400/10',  title: 'Locked to your branch',  sub: 'You only see your branch data' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-9 h-9 ${s.bg} border border-white/8 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`bi ${s.icon} ${s.color} text-sm`} />
                </div>
                <div>
                  <div className="text-white/80 text-sm font-semibold">{s.title}</div>
                  <div className="text-white/30 text-xs">{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 overflow-y-auto">
        <div className="w-full max-w-[440px] py-8">

          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">P</div>
            <span className="font-bold text-xl text-gray-900">POSPro</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
            <p className="text-sm text-gray-400 mt-1">Enter your branch invite code to get started</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* ── Invite Code — most important field, first ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="bi bi-key-fill text-yellow-500" /> Branch Invite Code *
              </label>
              <div className="relative">
                <input
                  value={form.inviteCode}
                  onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                  required maxLength={6} placeholder="e.g. XK4T2P"
                  className={`${inputCls} pl-4 pr-10 uppercase tracking-[0.2em] font-mono text-base font-bold border-2
                    ${codeStatus?.ok === true  ? 'border-green-400 bg-green-50/50 focus:ring-green-100' :
                      codeStatus?.ok === false ? 'border-red-300 bg-red-50/30 focus:ring-red-100' :
                      'border-gray-200 focus:border-blue-500 focus:ring-blue-100'}`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {codeStatus === 'checking' && <i className="bi bi-arrow-repeat animate-spin text-gray-400" />}
                  {codeStatus?.ok === true   && <i className="bi bi-check-circle-fill text-green-500" />}
                  {codeStatus?.ok === false  && <i className="bi bi-x-circle-fill text-red-400" />}
                </div>
              </div>

              {/* Live preview — shows company + branch name */}
              {codeStatus?.ok === true && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-building-check-fill text-green-600 text-sm" />
                  </div>
                  <div>
                    <div className="text-[11px] text-green-600/70 font-semibold uppercase tracking-wide">You will join</div>
                    <div className="text-sm font-bold text-green-800">{codeStatus.companyName}</div>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <i className="bi bi-building text-xs" />
                      <span>{codeStatus.branchName}</span>
                    </div>
                  </div>
                </div>
              )}
              {codeStatus?.ok === false && (
                <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <i className="bi bi-info-circle" /> Invalid code. Ask your Admin for your branch invite code.
                </div>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 font-medium">Your details</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* ── Full Name ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name *</label>
              <div className="relative">
                <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="text" value={form.name} onChange={set('name')} required
                  placeholder="John Doe"
                  className={`${inputCls} pl-10 border border-gray-200 focus:border-blue-500 focus:ring-blue-100`} />
              </div>
            </div>

            {/* ── Email ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address *</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')} required
                  placeholder="john@example.com"
                  className={`${inputCls} pl-10 border border-gray-200 focus:border-blue-500 focus:ring-blue-100`} />
              </div>
            </div>

            {/* ── Password ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password *</label>
              <div className="relative">
                <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  required minLength={6} placeholder="Min 6 characters"
                  className={`${inputCls} pl-10 pr-11 border border-gray-200 focus:border-blue-500 focus:ring-blue-100`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-pointer text-sm">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {form.password && str && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${str.color} ${str.bar}`} />
                  </div>
                  <span className={`text-[11px] font-bold ${str.text}`}>{str.label}</span>
                </div>
              )}
            </div>

            {/* ── Confirm Password ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirm Password *</label>
              <div className="relative">
                <i className="bi bi-lock-fill absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                  required placeholder="Repeat password"
                  className={`${inputCls} pl-10 border transition-colors
                    ${form.confirmPassword && !match ? 'border-red-300 focus:ring-red-100' :
                      form.confirmPassword &&  match ? 'border-green-400 focus:ring-green-100' :
                      'border-gray-200 focus:border-blue-500 focus:ring-blue-100'}`} />
              </div>
              {form.confirmPassword && (
                <p className={`text-[11px] font-semibold flex items-center gap-1 ${match ? 'text-green-500' : 'text-red-400'}`}>
                  <i className={`bi ${match ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                  {match ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* ── Submit ── */}
            <button type="submit"
              disabled={loading || !codeStatus?.ok}
              className="mt-1 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold
                text-white transition-all cursor-pointer border-0 font-[inherit]
                bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed
                hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5">
              {loading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Creating account...</>
                : <><i className="bi bi-person-plus-fill" /> Create Account</>}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
            <p>
              Own a business?{' '}
              <Link to="/create-company" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Create company</Link>
            </p>
            <p>
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}