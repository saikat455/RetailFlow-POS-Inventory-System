// import { Link } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// export default function Unauthorized() {
//   const { user } = useAuth()
//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
//       <div className="text-center max-w-md">
//         <div className="relative mb-6">
//           <div className="text-[140px] font-black text-gray-100 leading-none select-none">403</div>
//           <div className="absolute inset-0 flex items-center justify-center">
//             <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
//               <i className="bi bi-shield-x text-red-400 text-5xl" />
//             </div>
//           </div>
//         </div>

//         <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
//         <p className="text-sm text-gray-400 mb-3 leading-relaxed">
//           You don't have permission to view this page.
//         </p>
//         {user && (
//           <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full mb-7">
//             <i className="bi bi-person-fill" />
//             Logged in as <strong>{user.name}</strong> ({user.role})
//           </div>
//         )}

//         <div className="flex items-center justify-center gap-3 mt-2">
//           <Link to="/dashboard"
//             className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-colors">
//             <i className="bi bi-house-fill" /> Dashboard
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }


import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { scaleIn, fadeUp } from '../motion'

export default function Unauthorized() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6">
      <motion.div variants={scaleIn} initial="hidden" animate="visible"
        className="text-center max-w-sm w-full">

        {/* Number + icon stack */}
        <div className="relative mb-4 sm:mb-6 flex items-center justify-center">
          <div className="text-[100px] sm:text-[140px] font-black text-base-300
            leading-none select-none">
            403
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-error/10 rounded-full
              flex items-center justify-center">
              <i className="bi bi-shield-x text-error text-3xl sm:text-5xl" />
            </div>
          </div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <h1 className="text-xl sm:text-2xl font-bold text-base-content mb-2 tracking-tight">
            Access denied
          </h1>
          <p className="text-xs sm:text-sm text-base-content/50 mb-3 leading-relaxed px-2">
            You don't have permission to view this page.
          </p>

          {user && (
            <div className="inline-flex items-center gap-2 bg-base-300 text-base-content/60
              text-xs px-3 py-1.5 rounded-full mb-6 sm:mb-7 max-w-full">
              <i className="bi bi-person-fill flex-shrink-0" />
              <span className="truncate">
                Logged in as <strong>{user.name}</strong> ({user.role})
              </span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mt-2">
            <Link to="/dashboard"
              className="btn btn-primary btn-sm sm:btn-md gap-2">
              <i className="bi bi-house-fill" /> Dashboard
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