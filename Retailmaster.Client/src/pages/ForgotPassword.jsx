import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '../components/ThemeToggle'
import { fadeUp, scaleIn } from '../motion'
import api from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
            Forgot your<br /><span className="text-primary">password?</span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
            No worries! Enter your email and we'll send you a reset link.
          </p>
          <div className="flex flex-col gap-3">
            {[
              'Secure password reset',
              'Link expires in 1 hour',
              'Check your spam folder',
            ].map((f, i) => (
              <motion.div key={f} variants={fadeUp} initial="hidden" animate="visible" custom={i + 2}
                className="flex items-center gap-2.5 text-white/50 text-sm">
                <i className="bi bi-check-circle-fill text-primary text-xs flex-shrink-0" />{f}
              </motion.div>
            ))}
          </div>
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
                Reset password
              </h1>
              <p className="text-xs sm:text-sm text-base-content/50 mt-1">
                Enter your email and we'll send you instructions
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

            {submitted ? (
              <motion.div variants={fadeUp} initial="hidden" animate="visible"
                className="card bg-base-200 border border-base-300 p-6 text-center">
                <div className="w-14 h-14 mx-auto bg-success/20 rounded-full
                  flex items-center justify-center mb-4">
                  <i className="bi bi-envelope-check-fill text-success text-2xl" />
                </div>
                <h3 className="font-bold text-base-content text-base mb-2">Check your email</h3>
                <p className="text-sm text-base-content/60 mb-4">
                  We've sent a password reset link to<br />
                  <strong className="text-primary break-all">{email}</strong>
                </p>
                <p className="text-xs text-base-content/40 mb-5">
                  The link will expire in 1 hour.
                </p>
                <div className="divider text-xs text-base-content/30">Didn't receive it?</div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn btn-ghost btn-sm w-full border border-base-300 mt-2">
                  Try a different email
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label pb-1.5">
                    <span className="label-text text-xs font-bold uppercase tracking-wide
                      text-base-content/60">Email Address</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <i className="bi bi-envelope text-base-content/30 flex-shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="grow text-sm"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full gap-2 mt-2">
                  {loading ? (
                    <><span className="loading loading-spinner loading-sm" /> Sending…</>
                  ) : (
                    <><i className="bi bi-send-fill" /> Send reset link</>
                  )}
                </button>

                <div className="text-center text-xs sm:text-sm text-base-content/50 pt-4">
                  Remember your password?{' '}
                  <Link to="/login" className="link link-primary font-semibold no-underline">
                    Sign in
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