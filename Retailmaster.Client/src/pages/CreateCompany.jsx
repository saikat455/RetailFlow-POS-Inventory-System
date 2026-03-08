// import { useState } from 'react'
// import { useNavigate, Link } from 'react-router-dom'
// import { motion, AnimatePresence } from 'framer-motion'
// import ThemeToggle from '../components/ThemeToggle'
// import { useAuth } from '../context/AuthContext'
// import { fadeUp, scaleIn } from '../motion'
// import api from '../services/api'

// export default function CreateCompany() {
//   const { login } = useAuth()
//   const navigate = useNavigate()
//   const [form, setForm] = useState({
//     companyName: '', address: '', phone: '',
//     adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
//   })
//   const [showPass, setShowPass] = useState(false)
//   const [error, setError]   = useState('')
//   const [loading, setLoading] = useState(false)
//   const [step, setStep]     = useState(1)

//   const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

//   const handleNext = (e) => {
//     e.preventDefault()
//     if (!form.companyName.trim()) { setError('Company name is required.'); return }
//     setError(''); setStep(2)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault(); setError('')
//     if (form.adminPassword !== form.confirmPassword) { setError('Passwords do not match.'); return }
//     if (form.adminPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
//     setLoading(true)
//     try {
//       const res = await api.post('/auth/create-company', {
//         companyName: form.companyName,
//         address: form.address || null,
//         phone: form.phone || null,
//         adminName: form.adminName,
//         adminEmail: form.adminEmail,
//         adminPassword: form.adminPassword,
//       })
//       login(res.data); navigate('/dashboard')
//     } catch (err) {
//       setError(err.response?.data?.message || 'Failed to create company.')
//     } finally { setLoading(false) }
//   }

//   return (
//     <div className="min-h-screen flex">
//       {/* Left panel */}
//       <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-neutral flex-col justify-between p-12 relative overflow-hidden">
//         <div className="absolute inset-0 pointer-events-none overflow-hidden">
//           <div className="absolute -top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
//           <div className="absolute bottom-10 -right-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
//         </div>
//         <motion.div variants={fadeUp} initial="hidden" animate="visible"
//           className="relative flex items-center gap-3">
//           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center font-black text-white text-lg">P</div>
//           <span className="text-white font-bold text-xl tracking-tight">POSPro</span>
//         </motion.div>
//         <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
//           <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white/60 mb-6">
//             <i className="bi bi-building-fill text-primary" /> For business owners
//           </div>
//           <h2 className="text-4xl font-bold text-white leading-tight mb-4">
//             Launch your<br /><span className="text-primary">business today</span>
//           </h2>
//           <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
//             Create your company workspace. You'll get an invite code to share with your cashiers.
//           </p>
//           {/* Steps */}
//           <div className="flex flex-col gap-3">
//             {[
//               { n: 1, label: 'Company information' },
//               { n: 2, label: 'Admin account setup' },
//               { n: 3, label: 'Get your invite code' },
//             ].map(s => (
//               <motion.div key={s.n} variants={fadeUp} initial="hidden" animate="visible" custom={s.n + 2}
//                 className={`flex items-center gap-3 transition-all ${step >= s.n ? 'opacity-100' : 'opacity-30'}`}>
//                 <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
//                   ${step > s.n ? 'bg-success text-white' : step === s.n ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
//                   {step > s.n ? <i className="bi bi-check" /> : s.n}
//                 </div>
//                 <span className={`text-sm ${step === s.n ? 'text-white font-semibold' : 'text-white/50'}`}>{s.label}</span>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//         <div className="relative text-white/25 text-xs">© {new Date().getFullYear()} POSPro</div>
//       </div>

//       {/* Right form */}
//       <div className="flex-1 flex items-center justify-center bg-base-200 p-6 overflow-y-auto">
//         <div className="absolute top-5 right-5 z-10"><ThemeToggle /></div>
//         <motion.div variants={scaleIn} initial="hidden" animate="visible"
//           className="w-full max-w-[440px] py-8">
//           <div className="flex items-center gap-2.5 mb-8 lg:hidden">
//             <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white">P</div>
//             <span className="text-base-content font-bold text-xl">POSPro</span>
//           </div>

//           {/* Mobile step indicator */}
//           <div className="flex items-center gap-2 mb-6 lg:hidden">
//             {[1,2].map(n => (
//               <div key={n} className={`h-1.5 flex-1 rounded-full transition-all ${step >= n ? 'bg-primary' : 'bg-base-300'}`} />
//             ))}
//           </div>

//           <AnimatePresence>
//             {error && (
//               <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
//                 className="alert alert-error text-sm mb-5 py-3">
//                 <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <AnimatePresence mode="wait">
//             {step === 1 && (
//               <motion.form key="step1" variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, x: -20 }}
//                 onSubmit={handleNext} className="flex flex-col gap-4">
//                 <div className="mb-2">
//                   <h1 className="text-2xl font-bold text-base-content tracking-tight mb-1">Company information</h1>
//                   <p className="text-sm text-base-content/50">Tell us about your business</p>
//                 </div>

//                 <div className="form-control">
//                   <label className="label pb-1.5">
//                     <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">Company Name *</span>
//                   </label>
//                   <label className="input input-bordered flex items-center gap-2">
//                     <i className="bi bi-building text-base-content/30" />
//                     <input name="companyName" value={form.companyName} onChange={handleChange} required
//                       placeholder="e.g. My Retail Store" className="grow text-sm" />
//                   </label>
//                 </div>

//                 <div className="form-control">
//                   <label className="label pb-1.5">
//                     <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">Address <span className="normal-case font-normal text-base-content/30">(optional)</span></span>
//                   </label>
//                   <label className="input input-bordered flex items-center gap-2">
//                     <i className="bi bi-geo-alt text-base-content/30" />
//                     <input name="address" value={form.address} onChange={handleChange}
//                       placeholder="123 Main Street, City" className="grow text-sm" />
//                   </label>
//                 </div>

//                 <div className="form-control">
//                   <label className="label pb-1.5">
//                     <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">Phone <span className="normal-case font-normal text-base-content/30">(optional)</span></span>
//                   </label>
//                   <label className="input input-bordered flex items-center gap-2">
//                     <i className="bi bi-telephone text-base-content/30" />
//                     <input name="phone" value={form.phone} onChange={handleChange}
//                       placeholder="+880 1700 000000" className="grow text-sm" />
//                   </label>
//                 </div>

//                 <button type="submit" className="btn btn-primary w-full gap-2 mt-2">
//                   Next — Admin Account <i className="bi bi-arrow-right" />
//                 </button>
//               </motion.form>
//             )}

//             {step === 2 && (
//               <motion.form key="step2" variants={fadeUp} initial={{ opacity: 0, x: 20 }} animate="visible" exit={{ opacity: 0, x: 20 }}
//                 onSubmit={handleSubmit} className="flex flex-col gap-4">
//                 <div className="mb-2">
//                   <button type="button" onClick={() => { setStep(1); setError('') }}
//                     className="btn btn-ghost btn-xs gap-1 mb-3 text-base-content/50 px-0">
//                     <i className="bi bi-arrow-left" /> Back
//                   </button>
//                   <h1 className="text-2xl font-bold text-base-content tracking-tight mb-1">Admin account</h1>
//                   <p className="text-sm text-base-content/50">
//                     Owner of <strong className="text-base-content/80">{form.companyName}</strong>
//                   </p>
//                 </div>

//                 {[
//                   { name: 'adminName',  label: 'Your Name *',      ph: 'Your full name',    icon: 'bi-person',   type: 'text' },
//                   { name: 'adminEmail', label: 'Email Address *',   ph: 'owner@example.com', icon: 'bi-envelope', type: 'email' },
//                 ].map(f => (
//                   <div key={f.name} className="form-control">
//                     <label className="label pb-1.5">
//                       <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">{f.label}</span>
//                     </label>
//                     <label className="input input-bordered flex items-center gap-2">
//                       <i className={`bi ${f.icon} text-base-content/30`} />
//                       <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange}
//                         required placeholder={f.ph} className="grow text-sm" />
//                     </label>
//                   </div>
//                 ))}

//                 <div className="form-control">
//                   <label className="label pb-1.5">
//                     <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">Password *</span>
//                   </label>
//                   <label className="input input-bordered flex items-center gap-2">
//                     <i className="bi bi-lock text-base-content/30" />
//                     <input type={showPass ? 'text' : 'password'} name="adminPassword" value={form.adminPassword}
//                       onChange={handleChange} required minLength={6} placeholder="Min 6 characters" className="grow text-sm" />
//                     <button type="button" onClick={() => setShowPass(p => !p)}
//                       className="text-base-content/30 hover:text-base-content/60 bg-transparent border-0 cursor-pointer text-sm">
//                       <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
//                     </button>
//                   </label>
//                 </div>

//                 <div className="form-control">
//                   <label className="label pb-1.5">
//                     <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/60">Confirm Password *</span>
//                   </label>
//                   <label className={`input flex items-center gap-2
//                     ${form.confirmPassword && form.adminPassword !== form.confirmPassword ? 'input-error' : form.confirmPassword ? 'input-success' : 'input-bordered'}`}>
//                     <i className="bi bi-lock-fill text-base-content/30" />
//                     <input type="password" name="confirmPassword" value={form.confirmPassword}
//                       onChange={handleChange} required placeholder="Repeat password" className="grow text-sm" />
//                   </label>
//                 </div>

//                 <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2 mt-2">
//                   {loading ? <><span className="loading loading-spinner loading-sm" /> Creating company…</> : <><i className="bi bi-building-fill" /> Launch Company</>}
//                 </button>
//               </motion.form>
//             )}
//           </AnimatePresence>

//           <div className="mt-5 text-center">
//             <p className="text-sm text-base-content/50">
//               Already have an account?{' '}
//               <Link to="/login" className="link link-primary font-semibold no-underline">Sign in</Link>
//             </p>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   )
// }


import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn } from '../motion'
import api from '../services/api'

export default function CreateCompany() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm] = useState({
    companyName: '', address: '', phone: '',
    adminName: '', adminEmail: '', adminPassword: '', confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [step, setStep]         = useState(1)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleNext = (e) => {
    e.preventDefault()
    if (!form.companyName.trim()) { setError('Company name is required.'); return }
    setError(''); setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.adminPassword !== form.confirmPassword) {
      setError('Passwords do not match.'); return
    }
    if (form.adminPassword.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/create-company', {
        companyName: form.companyName,
        address:     form.address || null,
        phone:       form.phone   || null,
        adminName:   form.adminName,
        adminEmail:  form.adminEmail,
        adminPassword: form.adminPassword,
      })
      login(res.data); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create company.')
    } finally { setLoading(false) }
  }

  const steps = [
    { n: 1, label: 'Company information' },
    { n: 2, label: 'Admin account setup' },
    { n: 3, label: 'Get your invite code' },
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: desktop only ── */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-neutral flex-col
        justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 -right-20 w-72 h-72 bg-secondary/10
            rounded-full blur-3xl" />
        </div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center
            font-black text-white text-lg">P</div>
          <span className="text-white font-bold text-xl tracking-tight">POSPro</span>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10
            rounded-full px-4 py-2 text-sm text-white/60 mb-6">
            <i className="bi bi-building-fill text-primary" /> For business owners
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Launch your<br /><span className="text-primary">business today</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-8">
            Create your company workspace. You'll get an invite code to share with your cashiers.
          </p>
          {/* Steps */}
          <div className="flex flex-col gap-3">
            {steps.map(s => (
              <motion.div key={s.n} variants={fadeUp} initial="hidden" animate="visible"
                custom={s.n + 2}
                className={`flex items-center gap-3 transition-all
                  ${step >= s.n ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold flex-shrink-0 transition-all
                  ${step > s.n
                    ? 'bg-success text-white'
                    : step === s.n
                      ? 'bg-primary text-white'
                      : 'bg-white/10 text-white/50'}`}>
                  {step > s.n ? <i className="bi bi-check" /> : s.n}
                </div>
                <span className={`text-sm ${step === s.n ? 'text-white font-semibold' : 'text-white/50'}`}>
                  {s.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <div className="relative text-white/25 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* ── Right / full-width form panel ── */}
      <div className="flex-1 flex flex-col bg-base-200 relative">

        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-10 bg-base-200/95 backdrop-blur-sm
          border-b border-base-300 flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center
              font-black text-white text-sm">P</div>
            <span className="font-bold text-base text-base-content tracking-tight">POSPro</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile step progress bar */}
        <div className="lg:hidden px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2].map(n => (
              <div key={n} className={`h-1.5 flex-1 rounded-full transition-all duration-300
                ${step >= n ? 'bg-primary' : 'bg-base-300'}`} />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-base-content/50">
            <span className="font-semibold text-primary">
              Step {step} of 2
            </span>
            <span>{steps[step - 1]?.label}</span>
          </div>
        </div>

        {/* Mobile compact step pills */}
        <div className="lg:hidden flex gap-2 px-4 py-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none' }}>
          {steps.map(s => (
            <div key={s.n}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1
                text-[11px] font-semibold border transition-all
                ${step > s.n
                  ? 'bg-success/10 border-success/30 text-success'
                  : step === s.n
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-base-300/50 border-base-300 text-base-content/40'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px]
                font-black flex-shrink-0
                ${step > s.n ? 'bg-success text-white' : step === s.n ? 'bg-primary text-white' : 'bg-base-300 text-base-content/40'}`}>
                {step > s.n ? <i className="bi bi-check" /> : s.n}
              </div>
              {s.label}
            </div>
          ))}
        </div>

        {/* Desktop theme toggle */}
        <div className="hidden lg:block absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start sm:items-center justify-center
          px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="w-full max-w-[440px]">

            <AnimatePresence>
              {error && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible"
                  exit={{ opacity: 0 }} className="alert alert-error text-xs sm:text-sm mb-4 py-2.5">
                  <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form key="step1" variants={fadeUp} initial="hidden" animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleNext} className="flex flex-col gap-3 sm:gap-4">

                  <div className="mb-1 sm:mb-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-base-content
                      tracking-tight mb-1">
                      Company information
                    </h1>
                    <p className="text-xs sm:text-sm text-base-content/50">
                      Tell us about your business
                    </p>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide
                        text-base-content/60">Company Name *</span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <i className="bi bi-building text-base-content/30 flex-shrink-0" />
                      <input name="companyName" value={form.companyName}
                        onChange={handleChange} required
                        placeholder="e.g. My Retail Store" className="grow text-sm" />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide
                        text-base-content/60">
                        Address{' '}
                        <span className="normal-case font-normal text-base-content/30">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <i className="bi bi-geo-alt text-base-content/30 flex-shrink-0" />
                      <input name="address" value={form.address} onChange={handleChange}
                        placeholder="123 Main Street, City" className="grow text-sm" />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-xs font-semibold uppercase tracking-wide
                        text-base-content/60">
                        Phone{' '}
                        <span className="normal-case font-normal text-base-content/30">
                          (optional)
                        </span>
                      </span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <i className="bi bi-telephone text-base-content/30 flex-shrink-0" />
                      <input name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+880 1700 000000" className="grow text-sm" />
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-full gap-2 mt-1">
                    Next — Admin Account <i className="bi bi-arrow-right" />
                  </button>

                  <div className="text-center text-xs sm:text-sm text-base-content/50 pb-4 sm:pb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="link link-primary font-semibold no-underline">
                      Sign in
                    </Link>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form key="step2" variants={fadeUp}
                  initial={{ opacity: 0, x: 20 }} animate="visible"
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">

                  <div className="mb-1 sm:mb-2">
                    <button type="button" onClick={() => { setStep(1); setError('') }}
                      className="btn btn-ghost btn-xs gap-1 mb-2 sm:mb-3 text-base-content/50 px-0">
                      <i className="bi bi-arrow-left" /> Back
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-base-content
                      tracking-tight mb-1">
                      Admin account
                    </h1>
                    <p className="text-xs sm:text-sm text-base-content/50">
                      Owner of{' '}
                      <strong className="text-base-content/80">{form.companyName}</strong>
                    </p>
                  </div>

                  {[
                    {
                      name: 'adminName',  label: 'Your Name *',
                      ph: 'Your full name',    icon: 'bi-person',   type: 'text',
                    },
                    {
                      name: 'adminEmail', label: 'Email Address *',
                      ph: 'owner@example.com', icon: 'bi-envelope', type: 'email',
                    },
                  ].map(f => (
                    <div key={f.name} className="form-control">
                      <label className="label pb-1.5">
                        <span className="label-text text-xs font-semibold uppercase
                          tracking-wide text-base-content/60">{f.label}</span>
                      </label>
                      <label className="input input-bordered flex items-center gap-2">
                        <i className={`bi ${f.icon} text-base-content/30 flex-shrink-0`} />
                        <input type={f.type} name={f.name} value={form[f.name]}
                          onChange={handleChange} required placeholder={f.ph}
                          className="grow text-sm" />
                      </label>
                    </div>
                  ))}

                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-xs font-semibold uppercase
                        tracking-wide text-base-content/60">Password *</span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <i className="bi bi-lock text-base-content/30 flex-shrink-0" />
                      <input type={showPass ? 'text' : 'password'} name="adminPassword"
                        value={form.adminPassword} onChange={handleChange}
                        required minLength={6} placeholder="Min 6 characters"
                        className="grow text-sm" />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="text-base-content/30 hover:text-base-content/60
                          bg-transparent border-0 cursor-pointer text-sm flex-shrink-0">
                        <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                      </button>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-xs font-semibold uppercase
                        tracking-wide text-base-content/60">Confirm Password *</span>
                    </label>
                    <label className={`input flex items-center gap-2
                      ${form.confirmPassword && form.adminPassword !== form.confirmPassword
                        ? 'input-error'
                        : form.confirmPassword
                          ? 'input-success'
                          : 'input-bordered'}`}>
                      <i className="bi bi-lock-fill text-base-content/30 flex-shrink-0" />
                      <input type="password" name="confirmPassword"
                        value={form.confirmPassword} onChange={handleChange}
                        required placeholder="Repeat password" className="grow text-sm" />
                    </label>
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn btn-primary w-full gap-2 mt-1">
                    {loading
                      ? <><span className="loading loading-spinner loading-sm" /> Creating company…</>
                      : <><i className="bi bi-building-fill" /> Launch Company</>}
                  </button>

                  <div className="text-center text-xs sm:text-sm text-base-content/50 pb-4 sm:pb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="link link-primary font-semibold no-underline">
                      Sign in
                    </Link>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}