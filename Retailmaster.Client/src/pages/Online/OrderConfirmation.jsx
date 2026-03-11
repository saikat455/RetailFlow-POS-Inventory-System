import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { scaleIn } from '../../motion'
import api from '../../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await api.get(`/online/orders/track/${orderNumber}`)
        setOrder(res.data)
      } catch (err) {
        setError('Order not found')
      } finally {
        setLoading(false)
      }
    }
    loadOrder()
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-5xl text-error/50 block mb-4" />
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-base-content/50 mb-6">{error}</p>
          <Link to="/online" className="btn btn-primary">
            Browse Branches
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          <div className="card bg-base-100 border-2 border-success/20 shadow-xl">
            <div className="card-body text-center p-8">
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-6">
                <i className="bi bi-check-lg text-success text-4xl" />
              </div>

              <h1 className="text-2xl font-bold text-base-content mb-2">
                Order Placed Successfully!
              </h1>
              
              <p className="text-base-content/60 mb-6">
                Thank you for your order. We'll notify you when it's ready.
              </p>

              {/* Order Number */}
              <div className="bg-base-200 rounded-xl p-4 mb-6">
                <div className="text-sm text-base-content/50 mb-1">Order Number</div>
                <div className="text-2xl font-mono font-bold text-primary">
                  {order.orderNumber}
                </div>
              </div>

              {/* Order Details */}
              <div className="text-left border-t border-base-200 pt-6">
                <h3 className="font-bold mb-3">Order Summary</h3>
                
                {order.items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm py-2">
                    <span>
                      {item.productName} <span className="text-base-content/40">×{item.quantity}</span>
                    </span>
                    <span className="font-mono">{fmt(item.subtotal)}</span>
                  </div>
                ))}

                <div className="border-t border-base-200 mt-3 pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary font-mono">{fmt(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Branch Info */}
              <div className="text-left bg-base-200 rounded-xl p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className="bi bi-building text-primary" />
                  <span className="font-semibold">{order.branchName}</span>
                </div>
                {order.branchAddress && (
                  <p className="text-sm text-base-content/60 flex items-start gap-2 ml-6">
                    <i className="bi bi-geo-alt text-xs mt-1" />
                    {order.branchAddress}
                  </p>
                )}
                {order.branchPhone && (
                  <p className="text-sm text-base-content/60 flex items-center gap-2 ml-6">
                    <i className="bi bi-telephone text-xs" />
                    {order.branchPhone}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <Link to="/online" className="btn flex-1 btn-outline gap-2">
                  <i className="bi bi-shop" /> More Branches
                </Link>
                <button
                  onClick={() => window.print()}
                  className="btn flex-1 btn-primary gap-2"
                >
                  <i className="bi bi-printer" /> Print
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}