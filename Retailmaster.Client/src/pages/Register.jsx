// import { useState, useEffect, useRef } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import { motion, AnimatePresence } from 'framer-motion'
// import ThemeToggle from '../components/ThemeToggle'
// import { useAuth } from '../context/AuthContext'
// import GoogleButton from '../components/GoogleButton'
// import { fadeUp, scaleIn, listItem } from '../motion'
// import api from '../services/api'

// const strength = (p) => {
//   if (!p) return null
//   let s = 0
//   if (p.length >= 6) s++; if (p.length >= 10) s++
//   if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++
//   if (/[^A-Za-z0-9]/.test(p)) s++
//   return [null,
//     { label: 'Weak',   pct: 25,  cls: 'progress-error'   },
//     { label: 'Fair',   pct: 50,  cls: 'progress-warning'  },
//     { label: 'Good',   pct: 75,  cls: 'progress-info'     },
//     { label: 'Strong', pct: 100, cls: 'progress-success'  },
//     { label: 'Strong', pct: 100, cls: 'progress-success'  },
//   ][Math.min(s, 5)]
// }

// export default function Register() {
//   const navigate  = useNavigate()
//   const { login } = useAuth()

//   const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', inviteCode: '' })
//   const [showPass, setShowPass]     = useState(false)
//   const [error, setError]           = useState('')
//   const [success, setSuccess]       = useState(false)
//   const [successData, setSuccessData] = useState(null)
//   const [loading, setLoading]       = useState(false)

//   const [googleLoading, setGoogleLoading]   = useState(false)
//   const [googlePending, setGooglePending]   = useState(null)
//   const [gInviteCode, setGInviteCode]       = useState('')
//   const [gInviteLoading, setGInviteLoading] = useState(false)
//   const [gInviteError, setGInviteError]     = useState('')

//   const [codeStatus, setCodeStatus]   = useState(null)
//   const [gCodeStatus, setGCodeStatus] = useState(null)
//   const codeTimer  = useRef(null)
//   const gCodeTimer = useRef(null)

//   const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

//   useEffect(() => {
//     const code = form.inviteCode.trim()
//     if (!code) { setCodeStatus(null); return }
//     setCodeStatus('checking')
//     clearTimeout(codeTimer.current)
//     codeTimer.current = setTimeout(async () => {
//       try {
//         const r = await api.get(`/branches/validate-invite/${code}`)
//         setCodeStatus({ ok: true, companyName: r.data.companyName, branchName: r.data.branchName })
//       } catch { setCodeStatus({ ok: false }) }
//     }, 500)
//   }, [form.inviteCode])

//   const handleGInviteChange = (raw) => {
//     const code = raw.toUpperCase()
//     setGInviteCode(code); setGCodeStatus(null)
//     if (code.length < 6) return
//     setGCodeStatus('checking')
//     clearTimeout(gCodeTimer.current)
//     gCodeTimer.current = setTimeout(async () => {
//       try {
//         const r = await api.get(`/branches/validate-invite/${code}`)
//         setGCodeStatus({ ok: true, companyName: r.data.companyName, branchName: r.data.branchName })
//       } catch { setGCodeStatus({ ok: false }) }
//     }, 500)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault(); setError('')
//     if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return }
//     if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
//     if (!codeStatus?.ok) { setError('Enter a valid branch invite code first.'); return }
//     setLoading(true)
//     try {
//       await api.post('/auth/register', {
//         name: form.name, email: form.email,
//         password: form.password,
//         inviteCode: form.inviteCode.toUpperCase().trim(),
//       })
//       setSuccessData(codeStatus); setSuccess(true)
//       setTimeout(() => navigate('/login'), 2500)
//     } catch (err) {
//       setError(err.response?.data?.message || 'Registration failed.')
//     } finally { setLoading(false) }
//   }

//   const handleGoogleToken = async (idToken) => {
//     setError(''); setGoogleLoading(true)
//     try {
//       const r = await api.post('/auth/google', { idToken })
//       if (r.data.needsInviteCode) {
//         setGooglePending({ email: r.data.email, name: r.data.name, idToken })
//         setGoogleLoading(false); return
//       }
//       login(r.data); navigate('/dashboard')
//     } catch (err) {
//       setError(err.response?.data?.message || 'Google sign-in failed.')
//     } finally { setGoogleLoading(false) }
//   }

//   const handleGoogleRegister = async (e) => {
//     e.preventDefault(); setGInviteError('')
//     if (!gCodeStatus?.ok) { setGInviteError('Enter a valid branch invite code.'); return }
//     setGInviteLoading(true)
//     try {
//       const r = await api.post('/auth/google', { idToken: googlePending.idToken, inviteCode: gInviteCode })
//       login(r.data); navigate('/dashboard')
//     } catch (err) {
//       setGInviteError(err.response?.data?.message || 'Registration failed.')
//     } finally { setGInviteLoading(false) }
//   }

//   const str   = strength(form.password)
//   const match = form.confirmPassword && form.password === form.confirmPassword

//   /* ── Success screen ── */
//   if (success) return (
//     <div className="min-h-screen flex items-center justify-center bg-base-200">
//       <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
//       <motion.div variants={scaleIn} initial="hidden" animate="visible" className="text-center max-w-sm px-6">
//         <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
//           <i className="bi bi-check-lg text-success text-4xl" />
//         </div>
//         <h2 className="text-xl font-bold text-base-content mb-2">Account Created!</h2>
//         <div className="card bg-base-100 border border-base-300 shadow-sm p-4 mb-4">
//           <div className="text-xs text-base-content/50 mb-1">You have been added to</div>
//           <div className="font-bold text-base-content">{successData?.companyName}</div>
//           <div className="flex items-center justify-center gap-1.5 mt-1.5">
//             <i className="bi bi-building text-primary text-xs" />
//             <span className="text-sm text-primary font-semibold">{successData?.branchName}</span>
//           </div>
//         </div>
//         <p className="text-sm text-base-content/50">Redirecting to login…</p>
//       </motion.div>
//     </div>
//   )

//   /* ── Google invite step ── */
//   if (googlePending) return (
//     <div className="min-h-screen flex items-center justify-center bg-base-200 p-5">
//       <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
//       <motion.div variants={scaleIn} initial="hidden" animate="visible"
//         className="card bg-base-100 w-full max-w-[420px] shadow-xl overflow-hidden">
//         <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
//           <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white">
//             {googlePending.name?.charAt(0).toUpperCase()}
//           </div>
//           <div className="text-white font-bold">{googlePending.name}</div>
//           <div className="text-white/70 text-sm">{googlePending.email}</div>
//           <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs text-white/80">
//             <i className="bi bi-google" /> Signed in with Google
//           </div>
//         </div>
//         <div className="card-body p-6">
//           <div className="text-center mb-5">
//             <div className="font-bold text-base-content text-base mb-1">Almost there!</div>
//             <div className="text-sm text-base-content/60">Enter your branch invite code to complete registration.</div>
//           </div>
//           <AnimatePresence>
//             {gInviteError && (
//               <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
//                 className="alert alert-error text-sm mb-4 py-2.5">
//                 <i className="bi bi-exclamation-circle-fill" />{gInviteError}
//               </motion.div>
//             )}
//           </AnimatePresence>
//           <form onSubmit={handleGoogleRegister} className="flex flex-col gap-4">
//             <div>
//               <label className="label pb-1.5">
//                 <span className="label-text text-[11px] font-bold uppercase tracking-wide">
//                   <i className="bi bi-key-fill text-warning mr-1" /> Branch Invite Code *
//                 </span>
//               </label>
//               <div className="relative">
//                 <input value={gInviteCode} onChange={e => handleGInviteChange(e.target.value)}
//                   maxLength={6} placeholder="e.g. XK4T2P" required
//                   className={`input w-full text-center text-base font-black font-mono tracking-[0.25em] uppercase
//                     ${gCodeStatus?.ok ? 'input-success' : gInviteCode.length === 6 && gCodeStatus?.ok === false ? 'input-error' : 'input-bordered'}`} />
//                 <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
//                   {gCodeStatus === 'checking' && <span className="loading loading-spinner loading-xs" />}
//                   {gCodeStatus?.ok === true   && <i className="bi bi-check-circle-fill text-success" />}
//                   {gCodeStatus?.ok === false  && <i className="bi bi-x-circle-fill text-error" />}
//                 </div>
//               </div>
//               <AnimatePresence>
//                 {gCodeStatus?.ok && (
//                   <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
//                     className="mt-2 flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3">
//                     <i className="bi bi-building-check-fill text-success" />
//                     <div>
//                       <div className="text-sm font-bold text-base-content">{gCodeStatus.companyName}</div>
//                       <div className="text-xs text-success">{gCodeStatus.branchName}</div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//             <button type="submit" disabled={gInviteLoading || !gCodeStatus?.ok} className="btn btn-primary w-full gap-2">
//               {gInviteLoading ? <><span className="loading loading-spinner loading-sm" /> Creating account…</> : <><i className="bi bi-person-check-fill" /> Complete Registration</>}
//             </button>
//             <button type="button"
//               onClick={() => { setGooglePending(null); setGInviteCode(''); setGCodeStatus(null); setGInviteError('') }}
//               className="btn btn-ghost btn-sm text-base-content/50">← Back</button>
//           </form>
//         </div>
//       </motion.div>
//     </div>
//   )

//   /* ── Main register ── */
//   return (
//     <div className="min-h-screen flex">
//       {/* Left panel */}
//       <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-neutral flex-col justify-between p-12 relative overflow-hidden">
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
//           <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/8 rounded-full blur-3xl" />
//         </div>
//         <motion.div variants={fadeUp} initial="hidden" animate="visible"
//           className="relative flex items-center gap-3">
//           <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white text-base">P</div>
//           <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
//         </motion.div>
//         <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
//           <h2 className="text-3xl font-bold text-white leading-snug mb-4">
//             Join your<br /><span className="text-primary">branch today</span>
//           </h2>
//           <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
//             Register with Google or email. You'll need a branch invite code from your Admin.
//           </p>
//           <div className="flex flex-col gap-4">
//             {[
//               { icon: 'bi-google',           color: 'text-error',   bg: 'bg-error/10',   title: 'Sign up with Google',    sub: 'Fastest — one click' },
//               { icon: 'bi-key-fill',         color: 'text-warning', bg: 'bg-warning/10', title: 'Get branch invite code', sub: 'Ask your Admin for the code' },
//               { icon: 'bi-shield-lock-fill', color: 'text-success', bg: 'bg-success/10', title: 'Locked to your branch',  sub: 'You only see your branch data' },
//             ].map((s, i) => (
//               <motion.div key={i} variants={listItem} initial="hidden" animate="visible" custom={i + 2}
//                 className="flex items-center gap-3">
//                 <div className={`w-9 h-9 ${s.bg} border border-white/8 rounded-xl flex items-center justify-center flex-shrink-0`}>
//                   <i className={`bi ${s.icon} ${s.color} text-sm`} />
//                 </div>
//                 <div>
//                   <div className="text-white/80 text-sm font-semibold">{s.title}</div>
//                   <div className="text-white/30 text-xs">{s.sub}</div>
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//         <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
//       </div>

//       {/* Right form */}
//       <div className="flex-1 flex items-center justify-center bg-base-100 p-6 overflow-y-auto">
//         <div className="absolute top-5 right-5 z-10"><ThemeToggle /></div>
//         <motion.div variants={scaleIn} initial="hidden" animate="visible"
//           className="w-full max-w-[440px] py-8">
//           <div className="flex items-center gap-2.5 mb-8 lg:hidden">
//             <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white">P</div>
//             <span className="font-bold text-xl text-base-content">POSPro</span>
//           </div>
//           <div className="mb-6">
//             <h1 className="text-2xl font-bold text-base-content tracking-tight">Create account</h1>
//             <p className="text-sm text-base-content/50 mt-1">Sign up with Google or fill in the form below</p>
//           </div>

//           <AnimatePresence>
//             {error && (
//               <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
//                 className="alert alert-error text-sm mb-5 py-3">
//                 <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <div className="mb-5">
//             {googleLoading ? (
//               <div className="flex items-center justify-center gap-2.5 w-full py-3 border-2 border-base-300 rounded-xl text-sm text-base-content/50 bg-base-200">
//                 <span className="loading loading-spinner loading-sm" /> Connecting to Google…
//               </div>
//             ) : (
//               <div className="flex justify-center">
//                 <GoogleButton onToken={handleGoogleToken} text="signup_with" width={440} />
//               </div>
//             )}
//             <p className="text-center text-xs text-base-content/40 mt-2">Google sign-up still requires a branch invite code</p>
//           </div>

//           <div className="divider text-xs text-base-content/40 font-medium">or register with email</div>

//           <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
//             {/* Invite code */}
//             <div className="form-control">
//               <label className="label pb-1.5">
//                 <span className="label-text text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
//                   <i className="bi bi-key-fill text-warning" /> Branch Invite Code *
//                 </span>
//               </label>
//               <div className="relative">
//                 <input value={form.inviteCode}
//                   onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
//                   required maxLength={6} placeholder="e.g. XK4T2P"
//                   className={`input w-full pr-10 uppercase tracking-[0.2em] font-mono text-base font-bold
//                     ${codeStatus?.ok === true ? 'input-success' : codeStatus?.ok === false ? 'input-error' : 'input-bordered'}`} />
//                 <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
//                   {codeStatus === 'checking'  && <span className="loading loading-spinner loading-xs" />}
//                   {codeStatus?.ok === true    && <i className="bi bi-check-circle-fill text-success" />}
//                   {codeStatus?.ok === false   && <i className="bi bi-x-circle-fill text-error" />}
//                 </div>
//               </div>
//               <AnimatePresence>
//                 {codeStatus?.ok === true && (
//                   <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
//                     className="mt-2 flex items-center gap-3 bg-success/10 border border-success/30 rounded-xl px-4 py-3">
//                     <i className="bi bi-building-check-fill text-success" />
//                     <div>
//                       <div className="text-[11px] text-success/70 font-bold uppercase tracking-wide">You will join</div>
//                       <div className="text-sm font-bold text-base-content">{codeStatus.companyName}</div>
//                       <div className="text-xs text-success">{codeStatus.branchName}</div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             <div className="divider text-xs text-base-content/30 my-0">Your details</div>

//             {/* Name */}
//             <div className="form-control">
//               <label className="label pb-1.5">
//                 <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Full Name *</span>
//               </label>
//               <label className="input input-bordered flex items-center gap-2">
//                 <i className="bi bi-person text-base-content/30" />
//                 <input type="text" value={form.name} onChange={set('name')} required
//                   placeholder="John Doe" className="grow text-sm" />
//               </label>
//             </div>

//             {/* Email */}
//             <div className="form-control">
//               <label className="label pb-1.5">
//                 <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Email *</span>
//               </label>
//               <label className="input input-bordered flex items-center gap-2">
//                 <i className="bi bi-envelope text-base-content/30" />
//                 <input type="email" value={form.email} onChange={set('email')} required
//                   placeholder="you@example.com" className="grow text-sm" />
//               </label>
//             </div>

//             {/* Password */}
//             <div className="form-control">
//               <label className="label pb-1.5">
//                 <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Password *</span>
//               </label>
//               <label className="input input-bordered flex items-center gap-2">
//                 <i className="bi bi-lock text-base-content/30" />
//                 <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
//                   required minLength={6} placeholder="Min 6 characters" className="grow text-sm" />
//                 <button type="button" onClick={() => setShowPass(p => !p)}
//                   className="text-base-content/30 hover:text-base-content/60 bg-transparent border-0 cursor-pointer text-sm">
//                   <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
//                 </button>
//               </label>
//               {form.password && str && (
//                 <div className="flex items-center gap-2 mt-1.5">
//                   <progress className={`progress ${str.cls} h-1.5 flex-1`} value={str.pct} max={100} />
//                   <span className="text-[11px] font-bold text-base-content/60">{str.label}</span>
//                 </div>
//               )}
//             </div>

//             {/* Confirm */}
//             <div className="form-control">
//               <label className="label pb-1.5">
//                 <span className="label-text text-xs font-bold uppercase tracking-wide text-base-content/60">Confirm Password *</span>
//               </label>
//               <label className={`input flex items-center gap-2
//                 ${form.confirmPassword && !match ? 'input-error' : form.confirmPassword && match ? 'input-success' : 'input-bordered'}`}>
//                 <i className="bi bi-lock-fill text-base-content/30" />
//                 <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required
//                   placeholder="Repeat password" className="grow text-sm" />
//               </label>
//               {form.confirmPassword && (
//                 <label className="label pt-1">
//                   <span className={`label-text-alt font-semibold flex items-center gap-1 ${match ? 'text-success' : 'text-error'}`}>
//                     <i className={`bi ${match ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
//                     {match ? 'Passwords match' : 'Passwords do not match'}
//                   </span>
//                 </label>
//               )}
//             </div>

//             <button type="submit" disabled={loading || !codeStatus?.ok} className="btn btn-primary w-full gap-2 mt-1">
//               {loading ? <><span className="loading loading-spinner loading-sm" /> Creating account…</> : <><i className="bi bi-person-plus-fill" /> Create Account</>}
//             </button>
//           </form>

//           <div className="mt-6 text-center text-sm text-base-content/50">
//             Already have an account? <Link to="/login" className="link link-primary font-semibold no-underline">Sign in</Link>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   )
// }

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/GoogleButton'
import { fadeUp, scaleIn, listItem } from '../motion'
import api from '../services/api'

const strength = (p) => {
  if (!p) return null
  let s = 0
  if (p.length >= 6) s++; if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return [null,
    { label: 'Weak',   pct: 25,  cls: 'progress-error'   },
    { label: 'Fair',   pct: 50,  cls: 'progress-warning'  },
    { label: 'Good',   pct: 75,  cls: 'progress-info'     },
    { label: 'Strong', pct: 100, cls: 'progress-success'  },
    { label: 'Strong', pct: 100, cls: 'progress-success'  },
  ][Math.min(s, 5)]
}

export default function Register() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', inviteCode: '',
  })
  const [showPass, setShowPass]         = useState(false)
  const [error, setError]               = useState('')
  const [success, setSuccess]           = useState(false)
  const [successData, setSuccessData]   = useState(null)
  const [loading, setLoading]           = useState(false)

  const [googleLoading, setGoogleLoading]   = useState(false)
  const [googlePending, setGooglePending]   = useState(null)
  const [gInviteCode, setGInviteCode]       = useState('')
  const [gInviteLoading, setGInviteLoading] = useState(false)
  const [gInviteError, setGInviteError]     = useState('')

  const [codeStatus, setCodeStatus]   = useState(null)
  const [gCodeStatus, setGCodeStatus] = useState(null)
  const codeTimer  = useRef(null)
  const gCodeTimer = useRef(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

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

  const handleGInviteChange = (raw) => {
    const code = raw.toUpperCase()
    setGInviteCode(code); setGCodeStatus(null)
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
      setSuccessData(codeStatus); setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.')
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

  const handleGoogleRegister = async (e) => {
    e.preventDefault(); setGInviteError('')
    if (!gCodeStatus?.ok) { setGInviteError('Enter a valid branch invite code.'); return }
    setGInviteLoading(true)
    try {
      const r = await api.post('/auth/google', { idToken: googlePending.idToken, inviteCode: gInviteCode })
      login(r.data); navigate('/dashboard')
    } catch (err) {
      setGInviteError(err.response?.data?.message || 'Registration failed.')
    } finally { setGInviteLoading(false) }
  }

  const str   = strength(form.password)
  const match = form.confirmPassword && form.password === form.confirmPassword

  /* ── Success screen ── */
  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <motion.div variants={scaleIn} initial="hidden" animate="visible"
        className="text-center max-w-sm w-full px-4 sm:px-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-success/20 rounded-full flex items-center
          justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
          <i className="bi bi-check-lg text-success text-3xl sm:text-4xl" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-base-content mb-2">Account Created!</h2>
        <div className="card bg-base-100 border border-base-300 shadow-sm p-4 mb-4">
          <div className="text-xs text-base-content/50 mb-1">You have been added to</div>
          <div className="font-bold text-base-content">{successData?.companyName}</div>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <i className="bi bi-building text-primary text-xs" />
            <span className="text-sm text-primary font-semibold">{successData?.branchName}</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-base-content/50">Redirecting to login…</p>
      </motion.div>
    </div>
  )

  /* ── Google invite step ── */
  if (googlePending) return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <motion.div variants={scaleIn} initial="hidden" animate="visible"
        className="card bg-base-100 w-full max-w-[420px] shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-5 sm:p-6 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center
            justify-center mx-auto mb-3 text-xl sm:text-2xl font-black text-white">
            {googlePending.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-white font-bold">{googlePending.name}</div>
          <div className="text-white/70 text-sm">{googlePending.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 rounded-full
            px-3 py-1 text-xs text-white/80">
            <i className="bi bi-google" /> Signed in with Google
          </div>
        </div>
        <div className="card-body p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-5">
            <div className="font-bold text-base-content text-base mb-1">Almost there!</div>
            <div className="text-sm text-base-content/60">
              Enter your branch invite code to complete registration.
            </div>
          </div>
          <AnimatePresence>
            {gInviteError && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible"
                exit={{ opacity: 0 }} className="alert alert-error text-sm mb-4 py-2.5">
                <i className="bi bi-exclamation-circle-fill" />{gInviteError}
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleGoogleRegister} className="flex flex-col gap-4">
            <div>
              <label className="label pb-1.5">
                <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                  <i className="bi bi-key-fill text-warning mr-1" /> Branch Invite Code *
                </span>
              </label>
              <div className="relative">
                <input value={gInviteCode} onChange={e => handleGInviteChange(e.target.value)}
                  maxLength={6} placeholder="e.g. XK4T2P" required
                  className={`input w-full text-center text-base font-black font-mono
                    tracking-[0.25em] uppercase
                    ${gCodeStatus?.ok
                      ? 'input-success'
                      : gInviteCode.length === 6 && gCodeStatus?.ok === false
                        ? 'input-error'
                        : 'input-bordered'}`} />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {gCodeStatus === 'checking' && <span className="loading loading-spinner loading-xs" />}
                  {gCodeStatus?.ok === true   && <i className="bi bi-check-circle-fill text-success" />}
                  {gCodeStatus?.ok === false  && <i className="bi bi-x-circle-fill text-error" />}
                </div>
              </div>
              <AnimatePresence>
                {gCodeStatus?.ok && (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible"
                    exit={{ opacity: 0 }}
                    className="mt-2 flex items-center gap-3 bg-success/10 border border-success/30
                      rounded-xl px-4 py-3">
                    <i className="bi bi-building-check-fill text-success flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-base-content truncate">
                        {gCodeStatus.companyName}
                      </div>
                      <div className="text-xs text-success truncate">{gCodeStatus.branchName}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button type="submit" disabled={gInviteLoading || !gCodeStatus?.ok}
              className="btn btn-primary w-full gap-2">
              {gInviteLoading
                ? <><span className="loading loading-spinner loading-sm" /> Creating account…</>
                : <><i className="bi bi-person-check-fill" /> Complete Registration</>}
            </button>
            <button type="button"
              onClick={() => {
                setGooglePending(null); setGInviteCode(''); setGCodeStatus(null); setGInviteError('')
              }}
              className="btn btn-ghost btn-sm text-base-content/50">← Back</button>
          </form>
        </div>
      </motion.div>
    </div>
  )

  /* ── Main register ── */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: desktop only ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-neutral flex-col
        justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/8 rounded-full blur-3xl" />
        </div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center
            font-black text-white text-base">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Join your<br /><span className="text-primary">branch today</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8 max-w-xs">
            Register with Google or email. You'll need a branch invite code from your Admin.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { icon: 'bi-google',           color: 'text-error',   bg: 'bg-error/10',
                title: 'Sign up with Google',    sub: 'Fastest — one click' },
              { icon: 'bi-key-fill',         color: 'text-warning', bg: 'bg-warning/10',
                title: 'Get branch invite code', sub: 'Ask your Admin for the code' },
              { icon: 'bi-shield-lock-fill', color: 'text-success', bg: 'bg-success/10',
                title: 'Locked to your branch',  sub: 'You only see your branch data' },
            ].map((s, i) => (
              <motion.div key={i} variants={listItem} initial="hidden" animate="visible" custom={i + 2}
                className="flex items-center gap-3">
                <div className={`w-9 h-9 ${s.bg} border border-white/8 rounded-xl
                  flex items-center justify-center flex-shrink-0`}>
                  <i className={`bi ${s.icon} ${s.color} text-sm`} />
                </div>
                <div>
                  <div className="text-white/80 text-sm font-semibold">{s.title}</div>
                  <div className="text-white/30 text-xs">{s.sub}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* ── Right / full-width form panel ── */}
      <div className="flex-1 flex flex-col bg-base-100 relative">

        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 bg-base-100/95 backdrop-blur-sm
          border-b border-base-300 flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center
              font-black text-white text-sm">P</div>
            <span className="font-bold text-base text-base-content tracking-tight">POSPro</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile info strip */}
        <div className="lg:hidden bg-neutral/5 border-b border-base-200 px-4 py-3">
          <div className="flex gap-3">
            {[
              { icon: 'bi-google',        color: 'text-error',   text: 'Google signup' },
              { icon: 'bi-key-fill',      color: 'text-warning', text: 'Invite code' },
              { icon: 'bi-shield-check',  color: 'text-success', text: 'Branch locked' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-base-content/50">
                <i className={`bi ${s.icon} ${s.color} text-xs`} />
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden lg:block absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start sm:items-center justify-center
          px-4 sm:px-6 py-5 sm:py-8 overflow-y-auto">
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="w-full max-w-[440px]">

            <div className="mb-5 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
                Create account
              </h1>
              <p className="text-xs sm:text-sm text-base-content/50 mt-1">
                Sign up with Google or fill in the form below
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible"
                  exit={{ opacity: 0 }} className="alert alert-error text-xs sm:text-sm mb-4 py-2.5">
                  <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-4 sm:mb-5">
              {googleLoading ? (
                <div className="flex items-center justify-center gap-2.5 w-full h-12
                  border-2 border-base-300 rounded-xl text-sm text-base-content/50 bg-base-200">
                  <span className="loading loading-spinner loading-sm" /> Connecting to Google…
                </div>
              ) : (
                <div className="flex justify-center">
                  <GoogleButton onToken={handleGoogleToken} text="signup_with" />
                </div>
              )}
              <p className="text-center text-xs text-base-content/40 mt-2">
                Google sign-up still requires a branch invite code
              </p>
            </div>

            <div className="divider text-xs text-base-content/40 font-medium">
              or register with email
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 mt-3 sm:mt-4">

              {/* Invite code */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="label-text text-xs font-bold uppercase tracking-wide
                    flex items-center gap-1.5">
                    <i className="bi bi-key-fill text-warning" /> Branch Invite Code *
                  </span>
                </label>
                <div className="relative">
                  <input value={form.inviteCode}
                    onChange={e => setForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))}
                    required maxLength={6} placeholder="e.g. XK4T2P"
                    className={`input w-full pr-10 uppercase tracking-[0.2em] font-mono
                      text-base font-bold
                      ${codeStatus?.ok === true
                        ? 'input-success'
                        : codeStatus?.ok === false
                          ? 'input-error'
                          : 'input-bordered'}`} />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {codeStatus === 'checking'  && <span className="loading loading-spinner loading-xs" />}
                    {codeStatus?.ok === true    && <i className="bi bi-check-circle-fill text-success" />}
                    {codeStatus?.ok === false   && <i className="bi bi-x-circle-fill text-error" />}
                  </div>
                </div>
                <AnimatePresence>
                  {codeStatus?.ok === true && (
                    <motion.div variants={fadeUp} initial="hidden" animate="visible"
                      exit={{ opacity: 0 }}
                      className="mt-2 flex items-center gap-3 bg-success/10 border border-success/30
                        rounded-xl px-3 sm:px-4 py-2.5 sm:py-3">
                      <i className="bi bi-building-check-fill text-success flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] text-success/70 font-bold uppercase tracking-wide">
                          You will join
                        </div>
                        <div className="text-sm font-bold text-base-content truncate">
                          {codeStatus.companyName}
                        </div>
                        <div className="text-xs text-success truncate">{codeStatus.branchName}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="divider text-xs text-base-content/30 my-0">Your details</div>

              {/* Name */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="label-text text-xs font-bold uppercase tracking-wide
                    text-base-content/60">Full Name *</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <i className="bi bi-person text-base-content/30" />
                  <input type="text" value={form.name} onChange={set('name')} required
                    placeholder="John Doe" className="grow text-sm" />
                </label>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="label-text text-xs font-bold uppercase tracking-wide
                    text-base-content/60">Email *</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <i className="bi bi-envelope text-base-content/30" />
                  <input type="email" value={form.email} onChange={set('email')} required
                    placeholder="you@example.com" className="grow text-sm" />
                </label>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="label-text text-xs font-bold uppercase tracking-wide
                    text-base-content/60">Password *</span>
                </label>
                <label className="input input-bordered flex items-center gap-2">
                  <i className="bi bi-lock text-base-content/30" />
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={set('password')} required minLength={6}
                    placeholder="Min 6 characters" className="grow text-sm" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="text-base-content/30 hover:text-base-content/60
                      bg-transparent border-0 cursor-pointer text-sm flex-shrink-0">
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </label>
                {form.password && str && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <progress className={`progress ${str.cls} h-1.5 flex-1`}
                      value={str.pct} max={100} />
                    <span className="text-[11px] font-bold text-base-content/60">{str.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div className="form-control">
                <label className="label pb-1.5">
                  <span className="label-text text-xs font-bold uppercase tracking-wide
                    text-base-content/60">Confirm Password *</span>
                </label>
                <label className={`input flex items-center gap-2
                  ${form.confirmPassword && !match
                    ? 'input-error'
                    : form.confirmPassword && match
                      ? 'input-success'
                      : 'input-bordered'}`}>
                  <i className="bi bi-lock-fill text-base-content/30" />
                  <input type="password" value={form.confirmPassword}
                    onChange={set('confirmPassword')} required
                    placeholder="Repeat password" className="grow text-sm" />
                </label>
                {form.confirmPassword && (
                  <label className="label pt-1">
                    <span className={`label-text-alt font-semibold flex items-center gap-1
                      ${match ? 'text-success' : 'text-error'}`}>
                      <i className={`bi ${match ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
                      {match ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </label>
                )}
              </div>

              <button type="submit" disabled={loading || !codeStatus?.ok}
                className="btn btn-primary w-full gap-2 mt-1">
                {loading
                  ? <><span className="loading loading-spinner loading-sm" /> Creating account…</>
                  : <><i className="bi bi-person-plus-fill" /> Create Account</>}
              </button>
            </form>

            <div className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-base-content/50
              pb-6 sm:pb-0">
              Already have an account?{' '}
              <Link to="/login" className="link link-primary font-semibold no-underline">
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}