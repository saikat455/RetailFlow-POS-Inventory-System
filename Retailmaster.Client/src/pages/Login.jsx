import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/GoogleButton'
import { fadeUp, scaleIn } from '../motion'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]         = useState('')

  const [googlePending, setGooglePending]   = useState(null)
  const [inviteCode, setInviteCode]         = useState('')
  const [inviteLoading, setInviteLoading]   = useState(false)
  const [inviteError, setInviteError]       = useState('')
  const [codePreview, setCodePreview]       = useState(null)
  const [codeChecking, setCodeChecking]     = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const r = await api.post('/auth/login', form)
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  const handleGoogleToken = async (idToken) => {
    setError(''); setGoogleLoading(true)
    try {
      const r = await api.post('/auth/google', { idToken })
      if (r.data.needsInviteCode) {
        setGooglePending({ email: r.data.email, name: r.data.name, idToken })
        setGoogleLoading(false); return
      }
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed.')
    } finally { setGoogleLoading(false) }
  }

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

  const handleInviteSubmit = async (e) => {
    e.preventDefault(); setInviteError('')
    if (!codePreview) { setInviteError('Enter a valid branch invite code.'); return }
    setInviteLoading(true)
    try {
      const r = await api.post('/auth/google', { idToken: googlePending.idToken, inviteCode })
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Registration failed.')
    } finally { setInviteLoading(false) }
  }

  /* ── Google invite step ── */
  if (googlePending) return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-5">
      <motion.div variants={scaleIn} initial="hidden" animate="visible"
        className="card bg-base-100 w-full max-w-[420px] shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white">
            {googlePending.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-white font-bold">{googlePending.name}</div>
          <div className="text-white/70 text-sm">{googlePending.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs text-white/80">
            <i className="bi bi-google" /> Signed in with Google
          </div>
        </div>
        <div className="card-body p-6">
          <div className="text-center mb-5">
            <div className="font-bold text-base-content text-base mb-1">One more step!</div>
            <div className="text-sm text-base-content/60">Enter your branch invite code to join your company.</div>
          </div>
          <AnimatePresence>
            {inviteError && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                className="alert alert-error text-sm mb-4 py-2.5">
                <i className="bi bi-exclamation-circle-fill" />{inviteError}
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label pb-1.5">
                <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                  <i className="bi bi-key-fill text-warning mr-1" /> Branch Invite Code *
                </span>
              </label>
              <div className="relative">
                <input value={inviteCode} onChange={e => handleCodeChange(e.target.value)}
                  maxLength={6} placeholder="e.g. XK4T2P" required
                  className={`input w-full text-center text-base font-black font-mono tracking-[0.25em] uppercase
                    ${codePreview ? 'input-success' : inviteCode.length === 6 && !codeChecking ? 'input-error' : 'input-bordered'}`} />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {codeChecking && <span className="loading loading-spinner loading-xs text-base-content/40" />}
                  {codePreview  && <i className="bi bi-check-circle-fill text-success" />}
                  {!codePreview && inviteCode.length === 6 && !codeChecking && <i className="bi bi-x-circle-fill text-error" />}
                </div>
              </div>
              <AnimatePresence>
                {codePreview && (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                    className="mt-2 flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="bi bi-building-check-fill text-success text-sm" />
                    </div>
                    <div>
                      <div className="text-[11px] text-success/70 font-bold uppercase tracking-wide">Joining</div>
                      <div className="text-sm font-bold text-base-content">{codePreview.companyName}</div>
                      <div className="text-xs text-success flex items-center gap-1">
                        <i className="bi bi-building text-xs" />{codePreview.branchName}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="submit" disabled={inviteLoading || !codePreview}
              className="btn btn-primary w-full gap-2">
              {inviteLoading ? <><span className="loading loading-spinner loading-sm" /> Joining…</> : <><i className="bi bi-person-check-fill" /> Complete Sign Up</>}
            </button>
            <button type="button" onClick={() => { setGooglePending(null); setInviteCode(''); setCodePreview(null) }}
              className="btn btn-ghost btn-sm text-base-content/50">
              ← Back to login
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )

  /* ── Main login ── */
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[400px] flex-shrink-0 bg-neutral flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/8 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>
        </div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Welcome<br /><span className="text-primary">back</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
            Sign in to manage your POS, inventory, and sales reports across all your branches.
          </p>
          <div className="flex flex-col gap-3">
            {['Multi-branch management','Branch-level stock control','Professional invoices','Sales reports & analytics'].map((f, i) => (
              <motion.div key={f} variants={fadeUp} initial="hidden" animate="visible" custom={i + 2}
                className="flex items-center gap-2.5 text-white/50 text-sm">
                <i className="bi bi-check-circle-fill text-primary text-xs" />{f}
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center bg-base-100 p-6">
        <motion.div variants={scaleIn} initial="hidden" animate="visible"
          className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white">P</div>
            <span className="font-bold text-xl text-base-content">POSPro</span>
          </div>
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-base-content tracking-tight">Sign in</h1>
            <p className="text-sm text-base-content/50 mt-1">Welcome back — choose how to sign in</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                className="alert alert-error text-sm mb-5 py-3">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-5">
            {googleLoading ? (
              <div className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-base-300 rounded-xl text-sm text-base-content/50 bg-base-200">
                <span className="loading loading-spinner loading-sm" /> Signing in with Google…
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleButton onToken={handleGoogleToken} text="signin_with" width={400} />
              </div>
            )}
          </div>

          <div className="divider text-xs text-base-content/40 font-medium">or sign in with email</div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="form-control">
              <label className="label pb-1.5">
                <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Email</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <i className="bi bi-envelope text-base-content/30" />
                <input type="email" value={form.email} onChange={set('email')} required
                  placeholder="you@example.com" className="grow text-sm" />
              </label>
            </div>
            <div className="form-control">
              <label className="label pb-1.5">
                <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Password</span>
              </label>
              <label className="input input-bordered flex items-center gap-2">
                <i className="bi bi-lock text-base-content/30" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} required
                  placeholder="Your password" className="grow text-sm" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="text-base-content/30 hover:text-base-content/60 bg-transparent border-0 cursor-pointer text-sm">
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </label>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2 mt-1">
              {loading ? <><span className="loading loading-spinner loading-sm" /> Signing in…</> : <><i className="bi bi-box-arrow-in-right" /> Sign In</>}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm text-base-content/50">
            <p>New cashier? <Link to="/register" className="link link-primary font-semibold no-underline">Register with invite code</Link></p>
            <p>Own a business? <Link to="/create-company" className="link link-primary font-semibold no-underline">Create company</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}