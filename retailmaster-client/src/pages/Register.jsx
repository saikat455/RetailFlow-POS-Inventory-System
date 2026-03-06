import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/GoogleButton'
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
  const navigate  = useNavigate()
  const { login } = useAuth()

  // Email/password form state
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', inviteCode: '' })
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [loading, setLoading]     = useState(false)

  // Google flow state
  const [googleLoading, setGoogleLoading]   = useState(false)
  const [googlePending, setGooglePending]   = useState(null)  // { email, name, idToken }
  const [gInviteCode, setGInviteCode]       = useState('')
  const [gInviteLoading, setGInviteLoading] = useState(false)
  const [gInviteError, setGInviteError]     = useState('')

  // Invite code preview (shared logic)
  const [codeStatus, setCodeStatus]   = useState(null)  // null | 'checking' | {ok,..} | {ok:false}
  const [gCodeStatus, setGCodeStatus] = useState(null)
  const codeTimer  = useRef(null)
  const gCodeTimer = useRef(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Live validate email/password flow invite code
  useEffect(() => {
    const code = form.inviteCode.trim()
    if (!code) { setCodeStatus(null); return }
    setCodeStatus('checking')
    clearTimeout(codeTimer.current)
    codeTimer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/branches/validate-invite/${code}`)
        setCodeStatus({ ok: true, companyName: r.data.companyName, branchName: r.data.branchName })
      } catch { setCodeStatus({ ok: false }) }
    }, 500)
  }, [form.inviteCode])

  // Live validate Google flow invite code
  const handleGInviteChange = (raw) => {
    const code = raw.toUpperCase()
    setGInviteCode(code)
    setGCodeStatus(null)
    if (code.length < 6) return
    setGCodeStatus('checking')
    clearTimeout(gCodeTimer.current)
    gCodeTimer.current = setTimeout(async () => {
      try {
        const r = await api.get(`/branches/validate-invite/${code}`)
        setGCodeStatus({ ok: true, companyName: r.data.companyName, branchName: r.data.branchName })
      } catch { setGCodeStatus({ ok: false }) }
    }, 500)
  }

  // ── Email/password register ───────────────────────────────
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

  // ── Google token received on Register page ────────────────
  const handleGoogleToken = async (idToken) => {
    setError(''); setGoogleLoading(true)
    try {
      const r = await api.post('/auth/google', { idToken })
      const data = r.data

      if (data.needsInviteCode) {
        // New user — show invite code step
        setGooglePending({ email: data.email, name: data.name, idToken })
        setGoogleLoading(false)
        return
      }

      // Existing user who hit Register by mistake — just log them in
      login(data); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.')
    } finally { setGoogleLoading(false) }
  }

  // ── Submit Google + invite code ───────────────────────────
  const handleGoogleRegister = async (e) => {
    e.preventDefault(); setGInviteError('')
    if (!gCodeStatus?.ok) { setGInviteError('Enter a valid branch invite code.'); return }
    setGInviteLoading(true)
    try {
      const r = await api.post('/auth/google', {
        idToken: googlePending.idToken,
        inviteCode: gInviteCode,
      })
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setGInviteError(err.response?.data?.message || 'Registration failed.')
    } finally { setGInviteLoading(false) }
  }

  const str   = strength(form.password)
  const match = form.confirmPassword && form.password === form.confirmPassword

  const inputCls = `w-full py-3 px-4 rounded-xl border text-sm outline-none transition-all font-[inherit]
    bg-gray-50 text-gray-800 focus:bg-white focus:ring-3 border-gray-200 focus:border-blue-500 focus:ring-blue-100`

  // ── Success screen ────────────────────────────────────────
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
        <p className="text-sm text-gray-400">Redirecting to login…</p>
      </div>
    </div>
  )

  // ── Google new user: invite code step ─────────────────────
  if (googlePending) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white">
            {googlePending.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-white font-bold">{googlePending.name}</div>
          <div className="text-blue-100 text-sm">{googlePending.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs text-white/80">
            <i className="bi bi-google" /> Signed in with Google
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-5">
            <div className="font-bold text-gray-900 text-base mb-1">Almost there!</div>
            <div className="text-sm text-gray-500">Enter your branch invite code to complete registration.</div>
          </div>

          {gInviteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{gInviteError}
            </div>
          )}

          <form onSubmit={handleGoogleRegister} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <i className="bi bi-key-fill text-yellow-500" /> Branch Invite Code *
              </label>
              <div className="relative">
                <input value={gInviteCode} onChange={e => handleGInviteChange(e.target.value)}
                  maxLength={6} placeholder="e.g. XK4T2P" required
                  className={`w-full py-3 px-4 rounded-xl border-2 text-center text-base font-black font-mono
                    tracking-[0.25em] uppercase outline-none transition-all font-[inherit]
                    ${gCodeStatus?.ok ? 'border-green-400 bg-green-50/50 focus:ring-3 focus:ring-green-100' :
                      gInviteCode.length === 6 && gCodeStatus?.ok === false ? 'border-red-300 bg-red-50/30' :
                      'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-3 focus:ring-blue-100'}`} />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {gCodeStatus === 'checking'  && <i className="bi bi-arrow-repeat animate-spin text-gray-400" />}
                  {gCodeStatus?.ok === true    && <i className="bi bi-check-circle-fill text-green-500" />}
                  {gCodeStatus?.ok === false   && <i className="bi bi-x-circle-fill text-red-400" />}
                </div>
              </div>

              {gCodeStatus?.ok && (
                <div className="mt-2 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-building-check-fill text-green-600 text-sm" />
                  </div>
                  <div>
                    <div className="text-[11px] text-green-600/70 font-bold uppercase tracking-wide">Joining</div>
                    <div className="text-sm font-bold text-green-800">{gCodeStatus.companyName}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <i className="bi bi-building text-xs" />{gCodeStatus.branchName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={gInviteLoading || !gCodeStatus?.ok}
              className="flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600
                disabled:opacity-40 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]
                transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200">
              {gInviteLoading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Creating account…</>
                : <><i className="bi bi-person-check-fill" /> Complete Registration</>}
            </button>

            <button type="button"
              onClick={() => { setGooglePending(null); setGInviteCode(''); setGCodeStatus(null); setGInviteError('') }}
              className="text-sm text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer font-[inherit]">
              ← Back
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  // ── Main register page ────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#0f1117] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white text-base">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-4 py-2 text-xs text-white/50 mb-6">
            <i className="bi bi-building-fill text-blue-400" /> Branch-based access
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Join your<br /><span className="text-blue-400">branch today</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
            Register with Google or email. You'll need a branch invite code from your Admin to get started.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: 'bi-google',          color: 'text-red-400',    bg: 'bg-red-400/10',    title: 'Sign up with Google',      sub: 'Fastest — one click' },
              { icon: 'bi-key-fill',        color: 'text-yellow-400', bg: 'bg-yellow-400/10', title: 'Get branch invite code',   sub: 'Ask your Admin for the code' },
              { icon: 'bi-shield-lock-fill',color: 'text-green-400',  bg: 'bg-green-400/10',  title: 'Locked to your branch',    sub: 'You only see your branch data' },
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

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
            <p className="text-sm text-gray-400 mt-1">Sign up with Google or fill in the form below</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          {/* ── Google button ── */}
          <div className="mb-5">
            {googleLoading ? (
              <div className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50">
                <i className="bi bi-arrow-repeat animate-spin" /> Connecting to Google…
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleButton onToken={handleGoogleToken} text="signup_with" width={440} />
              </div>
            )}
            <p className="text-center text-xs text-gray-400 mt-2">
              Google sign-up still requires a branch invite code
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or register with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* ── Email/password form ── */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Invite code — first */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <i className="bi bi-key-fill text-yellow-500" /> Branch Invite Code *
              </label>
              <div className="relative">
                <input value={form.inviteCode}
                  onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                  required maxLength={6} placeholder="e.g. XK4T2P"
                  className={`${inputCls} pr-10 uppercase tracking-[0.2em] font-mono text-base font-bold border-2
                    ${codeStatus?.ok === true  ? 'border-green-400 bg-green-50/50 focus:ring-green-100' :
                      codeStatus?.ok === false ? 'border-red-300   bg-red-50/30   focus:ring-red-100' :
                      'border-gray-200 focus:border-blue-500 focus:ring-blue-100'}`} />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {codeStatus === 'checking'  && <i className="bi bi-arrow-repeat animate-spin text-gray-400" />}
                  {codeStatus?.ok === true    && <i className="bi bi-check-circle-fill text-green-500" />}
                  {codeStatus?.ok === false   && <i className="bi bi-x-circle-fill text-red-400" />}
                </div>
              </div>
              {codeStatus?.ok === true && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-building-check-fill text-green-600 text-sm" />
                  </div>
                  <div>
                    <div className="text-[11px] text-green-600/70 font-bold uppercase tracking-wide">You will join</div>
                    <div className="text-sm font-bold text-green-800">{codeStatus.companyName}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <i className="bi bi-building" />{codeStatus.branchName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300 font-medium">Your details</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name *</label>
              <div className="relative">
                <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="text" value={form.name} onChange={set('name')} required
                  placeholder="John Doe" className={`${inputCls} pl-10`} />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email *</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')} required
                  placeholder="you@example.com" className={`${inputCls} pl-10`} />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password *</label>
              <div className="relative">
                <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  required minLength={6} placeholder="Min 6 characters" className={`${inputCls} pl-10 pr-11`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-pointer text-sm">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {form.password && str && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${str.color} ${str.bar}`} />
                  </div>
                  <span className={`text-[11px] font-bold ${str.text}`}>{str.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Confirm Password *</label>
              <div className="relative">
                <i className="bi bi-lock-fill absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required
                  placeholder="Repeat password"
                  className={`${inputCls} pl-10 border
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

            <button type="submit" disabled={loading || !codeStatus?.ok}
              className="mt-1 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold
                text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed
                transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200
                cursor-pointer border-0 font-[inherit]">
              {loading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Creating account…</>
                : <><i className="bi bi-person-plus-fill" /> Create Account</>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}