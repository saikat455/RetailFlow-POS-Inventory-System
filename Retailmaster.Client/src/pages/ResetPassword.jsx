import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'
import { fadeUp, scaleIn } from '../motion'
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

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No reset token provided.')
      setValidating(false)
      return
    }

    const validateToken = async () => {
      try {
        await api.post('/auth/verify-reset-token', { token })
        setTokenValid(true)
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired reset link.')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  const str = strength(form.newPassword)
  const match = form.confirmPassword && form.newPassword === form.confirmPassword

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-base-content/40 text-sm flex items-center gap-2">
          <span className="loading loading-spinner loading-sm" /> Validating reset link…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* Left panel - desktop only */}
      <div className="hidden lg:flex w-[400px] flex-shrink-0 bg-neutral flex-col
        justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/8 rounded-full blur-3xl" />
        </div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible"
          className="relative flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center
            font-black text-white">P</div>
          <span className="text-white font-bold text-lg tracking-tight">POSPro</span>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Create new<br /><span className="text-primary">password</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
            Choose a strong password you haven't used before.
          </p>
        </motion.div>
        <div className="relative text-white/20 text-xs">© {new Date().getFullYear()} POSPro</div>
      </div>

      {/* Right panel */}
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

        {/* Desktop theme toggle */}
        <div className="hidden lg:block absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-start sm:items-center justify-center
          px-4 sm:px-6 py-6 sm:py-8">
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="w-full max-w-[400px]">

            <div className="mb-6 sm:mb-7">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm
                text-base-content/50 hover:text-primary mb-4 no-underline">
                <i className="bi bi-arrow-left" /> Back to login
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
                {success ? 'Password updated!' : 'Set new password'}
              </h1>
              <p className="text-xs sm:text-sm text-base-content/50 mt-1">
                {success 
                  ? 'Redirecting to login...'
                  : tokenValid 
                    ? 'Enter your new password below'
                    : 'Invalid or expired reset link'}
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

            {!tokenValid ? (
              <motion.div variants={fadeUp} initial="hidden" animate="visible"
                className="card bg-base-200 border border-base-300 p-6 text-center">
                <div className="w-14 h-14 mx-auto bg-error/20 rounded-full
                  flex items-center justify-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill text-error text-2xl" />
                </div>
                <h3 className="font-bold text-base-content text-base mb-2">Invalid or expired link</h3>
                <p className="text-sm text-base-content/60 mb-5">
                  This password reset link is no longer valid.
                </p>
                <Link to="/forgot-password" className="btn btn-primary w-full gap-2">
                  <i className="bi bi-envelope-fill" /> Request new link
                </Link>
              </motion.div>
            ) : success ? (
              <motion.div variants={fadeUp} initial="hidden" animate="visible"
                className="card bg-base-200 border border-base-300 p-6 text-center">
                <div className="w-14 h-14 mx-auto bg-success/20 rounded-full
                  flex items-center justify-center mb-4">
                  <i className="bi bi-check-lg text-success text-3xl" />
                </div>
                <h3 className="font-bold text-base-content text-base mb-2">Password reset successful!</h3>
                <p className="text-sm text-base-content/60 mb-2">
                  You can now log in with your new password.
                </p>
                <div className="flex items-center justify-center gap-1 text-xs text-primary">
                  <span className="loading loading-spinner loading-xs" /> Redirecting...
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="label-text text-xs font-bold uppercase tracking-wide
                      text-base-content/60">New Password</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <i className="bi bi-lock text-base-content/30 flex-shrink-0" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
                      className="grow text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="text-base-content/30 hover:text-base-content/60
                        bg-transparent border-0 cursor-pointer text-sm flex-shrink-0">
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  </label>
                  {form.newPassword && str && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <progress className={`progress ${str.cls} h-1.5 flex-1`}
                        value={str.pct} max={100} />
                      <span className="text-[11px] font-bold text-base-content/60">{str.label}</span>
                    </div>
                  )}
                </div>

                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="label-text text-xs font-bold uppercase tracking-wide
                      text-base-content/60">Confirm New Password</span>
                  </label>
                  <label className={`input flex items-center gap-2
                    ${form.confirmPassword && !match
                      ? 'input-error'
                      : form.confirmPassword && match
                        ? 'input-success'
                        : 'input-bordered'}`}>
                    <i className="bi bi-lock-fill text-base-content/30 flex-shrink-0" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Repeat new password"
                      className="grow text-sm"
                    />
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

                <button
                  type="submit"
                  disabled={loading || !match}
                  className="btn btn-primary w-full gap-2 mt-2">
                  {loading ? (
                    <><span className="loading loading-spinner loading-sm" /> Resetting…</>
                  ) : (
                    <><i className="bi bi-check-lg" /> Reset password</>
                  )}
                </button>

                <div className="text-center text-xs sm:text-sm text-base-content/50 pt-4">
                  <Link to="/login" className="link link-primary font-semibold no-underline">
                    <i className="bi bi-arrow-left" /> Back to sign in
                  </Link>
                </div>
              </form>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  )
}