import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/GoogleButton'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]       = useState('')

  // Google new-user invite code step
  const [googlePending, setGooglePending]     = useState(null) // { email, name, idToken }
  const [inviteCode, setInviteCode]           = useState('')
  const [inviteLoading, setInviteLoading]     = useState(false)
  const [inviteError, setInviteError]         = useState('')
  const [codePreview, setCodePreview]         = useState(null)   // { companyName, branchName }
  const [codeChecking, setCodeChecking]       = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Email/password login ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await api.post('/auth/login', form)
      login(r.data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  // ── Google token received ─────────────────────────────────
  const handleGoogleToken = async (idToken) => {
    setError(''); setGoogleLoading(true)
    try {
      const r = await api.post('/auth/google', { idToken })
      const data = r.data

      if (data.needsInviteCode) {
        // New user — need branch invite code before we can log them in
        setGooglePending({ email: data.email, name: data.name, idToken })
        setGoogleLoading(false)
        return
      }

      login(data); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.')
    } finally { setGoogleLoading(false) }
  }

  // ── Live invite code preview ──────────────────────────────
  const handleCodeChange = async (code) => {
    setInviteCode(code.toUpperCase())
    setInviteError(''); setCodePreview(null)
    if (code.length < 6) return
    setCodeChecking(true)
    try {
      const r = await api.get(`/branches/validate-invite/${code.toUpperCase()}`)
      setCodePreview(r.data)
    } catch { setCodePreview(null) }
    finally { setCodeChecking(false) }
  }

  // ── Submit invite code for Google new user ────────────────
  const handleInviteSubmit = async (e) => {
    e.preventDefault(); setInviteError('')
    if (!codePreview) { setInviteError('Enter a valid branch invite code.'); return }
    setInviteLoading(true)
    try {
      const r = await api.post('/auth/google', {
        idToken: googlePending.idToken,
        inviteCode,
      })
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Registration failed.')
    } finally { setInviteLoading(false) }
  }

  const inputCls = `w-full py-3 px-4 rounded-xl border text-sm outline-none transition-all font-[inherit]
    bg-gray-50 text-gray-800 focus:bg-white focus:ring-3 border-gray-200 focus:border-blue-500 focus:ring-blue-100`

  // ═══════════════════════════════════════════════════════════
  // Google new-user invite code step
  // ═══════════════════════════════════════════════════════════
  if (googlePending) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30 p-5">
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-xl border border-gray-100 overflow-hidden">
        {/* Google account preview */}
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
            <div className="font-bold text-gray-900 text-base mb-1">One more step!</div>
            <div className="text-sm text-gray-500">
              Enter your branch invite code to join your company. Ask your Admin for the code.
            </div>
          </div>

          {inviteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
              <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{inviteError}
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                <i className="bi bi-key-fill text-yellow-500 mr-1" /> Branch Invite Code *
              </label>
              <div className="relative">
                <input value={inviteCode}
                  onChange={e => handleCodeChange(e.target.value)}
                  maxLength={6} placeholder="e.g. XK4T2P" required
                  className={`w-full py-3 px-4 rounded-xl border-2 text-center text-base font-black font-mono
                    tracking-[0.25em] uppercase outline-none transition-all font-[inherit]
                    ${codePreview ? 'border-green-400 bg-green-50/50 focus:ring-3 focus:ring-green-100' :
                      inviteCode.length === 6 && !codeChecking ? 'border-red-300 bg-red-50/30' :
                      'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-3 focus:ring-blue-100'}`}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {codeChecking && <i className="bi bi-arrow-repeat animate-spin text-gray-400" />}
                  {codePreview  && <i className="bi bi-check-circle-fill text-green-500" />}
                  {!codePreview && inviteCode.length === 6 && !codeChecking && <i className="bi bi-x-circle-fill text-red-400" />}
                </div>
              </div>

              {codePreview && (
                <div className="mt-2 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-building-check-fill text-green-600 text-sm" />
                  </div>
                  <div>
                    <div className="text-[11px] text-green-600/70 font-bold uppercase tracking-wide">Joining</div>
                    <div className="text-sm font-bold text-green-800">{codePreview.companyName}</div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <i className="bi bi-building text-xs" />{codePreview.branchName}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={inviteLoading || !codePreview}
              className="flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-40
                text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit] transition-all
                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200">
              {inviteLoading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Joining…</>
                : <><i className="bi bi-person-check-fill" /> Complete Sign Up</>}
            </button>

            <button type="button" onClick={() => { setGooglePending(null); setInviteCode(''); setCodePreview(null) }}
              className="text-sm text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer font-[inherit]">
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════
  // Main login page
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex">

      {/* ── Left dark panel ── */}
      <div className="hidden lg:flex w-[400px] flex-shrink-0 bg-[#0f1117] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Welcome<br /><span className="text-blue-400">back</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Sign in to manage your POS, inventory, and sales reports across all your branches.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {['Multi-branch management','Branch-level stock control','Professional invoices','Sales reports & analytics'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-white/50 text-sm">
                <i className="bi bi-check-circle-fill text-blue-500 text-xs" />{f}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white">P</div>
            <span className="font-bold text-xl text-gray-900">POSPro</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-sm text-gray-400 mt-1">Welcome back — choose how to sign in</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              <i className="bi bi-exclamation-circle-fill mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          {/* Google button */}
          <div className="mb-5">
            {googleLoading ? (
              <div className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-gray-200 rounded-xl text-sm text-gray-500 bg-gray-50">
                <i className="bi bi-arrow-repeat animate-spin" /> Signing in with Google…
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleButton onToken={handleGoogleToken} text="signin_with" width={400} />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Email</label>
              <div className="relative">
                <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')} required
                  placeholder="you@example.com" className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
              </div>
              <div className="relative">
                <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required
                  placeholder="Your password" className={`${inputCls} pl-10 pr-11`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-pointer text-sm">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white
                bg-blue-500 hover:bg-blue-600 disabled:opacity-50 cursor-pointer border-0 font-[inherit] transition-all
                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200">
              {loading
                ? <><i className="bi bi-arrow-repeat animate-spin" /> Signing in…</>
                : <><i className="bi bi-box-arrow-in-right" /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-gray-400">
            <p>
              New cashier?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Register with invite code</Link>
            </p>
            <p>
              Own a business?{' '}
              <Link to="/create-company" className="text-blue-500 hover:text-blue-600 font-semibold no-underline">Create company</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}