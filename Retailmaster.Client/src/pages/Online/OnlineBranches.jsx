import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, listItem } from '../../motion'
import api from '../../services/api'

export default function OnlineBranches() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await api.get('/online/branches')
        setBranches(res.data)
      } catch (err) {
        setError('Failed to load branches. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadBranches()
  }, [])

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <motion.h1 
            variants={fadeUp} 
            initial="hidden" 
            animate="visible"
            className="text-3xl sm:text-4xl font-bold mb-3"
          >
            Order Online
          </motion.h1>
          <motion.p 
            variants={fadeUp} 
            initial="hidden" 
            animate="visible" 
            custom={1}
            className="text-white/80 text-sm sm:text-base max-w-xl"
          >
            Select a branch to view their menu and place your order for pickup or delivery.
          </motion.p>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {error && (
          <div className="alert alert-error mb-6">
            <i className="bi bi-exclamation-triangle-fill" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="skeleton h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16">
            <i className="bi bi-shop text-6xl text-base-content/20 block mb-4" />
            <h3 className="text-xl font-semibold text-base-content mb-2">No branches available</h3>
            <p className="text-base-content/50">Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch, i) => (
              <motion.div
                key={branch.id}
                variants={listItem}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <Link 
                  to={`/online/branch/${branch.id}`}
                  className="block card bg-base-100 hover:shadow-xl transition-all hover:-translate-y-1 no-underline"
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title text-base-content">{branch.name}</h3>
                        {branch.address && (
                          <p className="text-sm text-base-content/60 mt-1 flex items-start gap-1">
                            <i className="bi bi-geo-alt flex-shrink-0 mt-0.5" />
                            <span>{branch.address}</span>
                          </p>
                        )}
                        {branch.phone && (
                          <p className="text-sm text-base-content/60 mt-1 flex items-center gap-1">
                            <i className="bi bi-telephone" />
                            {branch.phone}
                          </p>
                        )}
                      </div>
                      <div className="badge badge-primary gap-1">
                        <i className="bi bi-bag-check" /> Order
                      </div>
                    </div>
                    <div className="divider my-2" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-base-content/50">Accepting orders</span>
                      <span className="text-success flex items-center gap-1">
                        <i className="bi bi-check-circle-fill text-xs" /> Open
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}