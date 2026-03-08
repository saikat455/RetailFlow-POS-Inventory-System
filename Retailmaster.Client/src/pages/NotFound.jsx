// import { Link } from 'react-router-dom'
// import { motion } from 'framer-motion'
// import { scaleIn, fadeUp } from '../motion'

// export default function NotFound() {
//   return (
//     <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
//       <motion.div variants={scaleIn} initial="hidden" animate="visible"
//         className="text-center max-w-md">
//         <div className="relative mb-6">
//           <div className="text-[140px] font-black text-base-300 leading-none select-none">404</div>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
//               <i className="bi bi-compass text-primary text-5xl" />
//             </div>
//           </div>
//         </div>

//         <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
//           <h1 className="text-2xl font-bold text-base-content mb-2 tracking-tight">Page not found</h1>
//           <p className="text-sm text-base-content/50 mb-8 leading-relaxed">
//             The page you're looking for doesn't exist or has been moved.
//           </p>
//           <div className="flex items-center justify-center gap-3">
//             <Link to="/dashboard" className="btn btn-primary gap-2">
//               <i className="bi bi-house-fill" /> Go to Dashboard
//             </Link>
//             <button onClick={() => window.history.back()} className="btn btn-ghost gap-2 border border-base-300">
//               <i className="bi bi-arrow-left" /> Go back
//             </button>
//           </div>
//         </motion.div>
//       </motion.div>
//     </div>
//   )
// }


import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { scaleIn, fadeUp } from '../motion'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6">
      <motion.div variants={scaleIn} initial="hidden" animate="visible"
        className="text-center max-w-sm w-full">

        {/* Number + icon stack */}
        <div className="relative mb-4 sm:mb-6 flex items-center justify-center">
          <div className="text-[100px] sm:text-[140px] font-black text-base-300
            leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full
              flex items-center justify-center">
              <i className="bi bi-compass text-primary text-3xl sm:text-5xl" />
            </div>
          </div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <h1 className="text-xl sm:text-2xl font-bold text-base-content mb-2 tracking-tight">
            Page not found
          </h1>
          <p className="text-xs sm:text-sm text-base-content/50 mb-6 sm:mb-8 leading-relaxed px-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <Link to="/dashboard"
              className="btn btn-primary btn-sm sm:btn-md gap-2">
              <i className="bi bi-house-fill" /> Go to Dashboard
            </Link>
            <button onClick={() => window.history.back()}
              className="btn btn-ghost btn-sm sm:btn-md gap-2 border border-base-300">
              <i className="bi bi-arrow-left" /> Go back
            </button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}