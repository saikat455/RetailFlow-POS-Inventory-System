import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative flex items-center gap-2 rounded-xl border transition-all cursor-pointer
        font-[inherit] overflow-hidden
        ${compact
          ? 'w-8 h-8 justify-center bg-transparent border-white/10 hover:bg-white/10'
          : 'px-3 py-2 bg-base-200 border-base-300 hover:border-primary/40 hover:bg-base-300'
        }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{    rotate:  90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            className={`flex items-center gap-2 ${compact ? 'text-yellow-400' : 'text-yellow-500'}`}
          >
            <i className="bi bi-sun-fill text-sm" />
            {!compact && <span className="text-xs font-semibold text-base-content">Light</span>}
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            initial={{ rotate: 90,  opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0,   opacity: 1, scale: 1   }}
            exit={{    rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.22 }}
            className={`flex items-center gap-2 ${compact ? 'text-white/60' : 'text-base-content/60'}`}
          >
            <i className="bi bi-moon-fill text-sm" />
            {!compact && <span className="text-xs font-semibold text-base-content">Dark</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}