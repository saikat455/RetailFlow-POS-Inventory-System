import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeUp, scaleIn } from '../../motion'
import api from '../../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function Checkout() {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [branch, setBranch] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryAddress: '',
    deliveryInstructions: '',
    paymentMethod: 'CashOnDelivery'
  })

  useEffect(() => {
    // Load cart and branch from session storage
    const savedCart = sessionStorage.getItem('onlineCart')
    const savedBranch = sessionStorage.getItem('onlineBranch')
    
    if (!savedCart || !savedBranch) {
      navigate('/online')
      return
    }
    
    setCart(JSON.parse(savedCart))
    setBranch(JSON.parse(savedBranch))
  }, [navigate])

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = 0
  const total = subtotal + deliveryFee

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!form.customerName.trim()) errors.customerName = 'Name is required'
    if (!form.customerEmail.trim()) errors.customerEmail = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.customerEmail)) errors.customerEmail = 'Email is invalid'
    
    if (!form.customerPhone.trim()) errors.customerPhone = 'Phone is required'
    else if (!/^[0-9+\-\s]+$/.test(form.customerPhone)) errors.customerPhone = 'Phone is invalid'
    
    if (!form.deliveryAddress.trim()) errors.deliveryAddress = 'Delivery address is required'
    
    if (!cart.length) errors.cart = 'Cart is empty'
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setError('Please fix the errors above')
      return
    }
    
    setError('')
    setSubmitting(true)

    try {
      const orderData = {
        branchId: Number(branch.id),
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim().toLowerCase(),
        customerPhone: form.customerPhone.trim(),
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryInstructions: form.deliveryInstructions?.trim() || null,
        paymentMethod: form.paymentMethod,
        items: cart.map(item => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity)
        }))
      }

      console.log('Sending order data:', JSON.stringify(orderData, null, 2))
      
      const res = await api.post('/online/orders', orderData)
      
      // Clear cart
      sessionStorage.removeItem('onlineCart')
      sessionStorage.removeItem('onlineBranch')
      
      // Navigate to confirmation page with order details
      navigate(`/online/order-confirmation/${res.data.orderNumber}`)
    } catch (err) {
      console.error('Order error:', err)
      console.error('Error response:', err.response?.data)
      
      // Show the specific error message from the server
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.map(e => e.message).join(', ') ||
                          'Failed to place order. Please try again.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (!cart.length || !branch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-white border-b border-base-300 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to={`/online/branch/${branch.id}`} className="text-base-content/60 hover:text-primary">
              <i className="bi bi-arrow-left text-xl" />
            </Link>
            <h1 className="font-bold text-lg">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <motion.div variants={scaleIn} initial="hidden" animate="visible">
          {error && (
            <div className="alert alert-error mb-6">
              <i className="bi bi-exclamation-triangle-fill" />
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="md:col-span-2">
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body">
                  <h3 className="font-bold text-base-content mb-4">Order Summary</h3>
                  
                  {cart.map(item => (
                    <div key={item.productId} className="flex justify-between py-2 border-b border-base-200 last:border-0">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-base-content/50 ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-mono">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-base-200">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-base-content/60">Subtotal</span>
                      <span className="font-mono">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-base-content/60">Delivery Fee</span>
                      <span className="font-mono text-success">Free</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-base-200">
                      <span>Total</span>
                      <span className="text-primary font-mono">{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Info */}
              <div className="card bg-base-100 border border-base-300 mt-4">
                <div className="card-body">
                  <h3 className="font-bold text-base-content mb-2">Pickup from</h3>
                  <p className="font-medium">{branch.name}</p>
                  {branch.address && (
                    <p className="text-sm text-base-content/60 flex items-start gap-1 mt-1">
                      <i className="bi bi-geo-alt mt-0.5" />
                      {branch.address}
                    </p>
                  )}
                  {branch.phone && (
                    <p className="text-sm text-base-content/60 flex items-center gap-1">
                      <i className="bi bi-telephone" />
                      {branch.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="md:col-span-1">
              <form onSubmit={handleSubmit} className="card bg-base-100 border border-base-300 sticky top-24">
                <div className="card-body">
                  <h3 className="font-bold text-base-content mb-4">Your Details</h3>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Name *</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={form.customerName}
                      onChange={handleChange}
                      required
                      className={`input input-bordered input-sm ${validationErrors.customerName ? 'input-error' : ''}`}
                      placeholder="Your full name"
                    />
                    {validationErrors.customerName && (
                      <label className="label">
                        <span className="label-text-alt text-error">{validationErrors.customerName}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Email *</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={form.customerEmail}
                      onChange={handleChange}
                      required
                      className={`input input-bordered input-sm ${validationErrors.customerEmail ? 'input-error' : ''}`}
                      placeholder="you@example.com"
                    />
                    {validationErrors.customerEmail && (
                      <label className="label">
                        <span className="label-text-alt text-error">{validationErrors.customerEmail}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Phone *</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={handleChange}
                      required
                      className={`input input-bordered input-sm ${validationErrors.customerPhone ? 'input-error' : ''}`}
                      placeholder="+880 1700 000000"
                    />
                    {validationErrors.customerPhone && (
                      <label className="label">
                        <span className="label-text-alt text-error">{validationErrors.customerPhone}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Delivery Address *</span>
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={form.deliveryAddress}
                      onChange={handleChange}
                      required
                      rows={2}
                      className={`textarea textarea-bordered textarea-sm ${validationErrors.deliveryAddress ? 'textarea-error' : ''}`}
                      placeholder="Your complete address"
                    />
                    {validationErrors.deliveryAddress && (
                      <label className="label">
                        <span className="label-text-alt text-error">{validationErrors.deliveryAddress}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Instructions (optional)</span>
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      value={form.deliveryInstructions}
                      onChange={handleChange}
                      rows={2}
                      className="textarea textarea-bordered textarea-sm"
                      placeholder="Any special instructions?"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Payment Method *</span>
                    </label>
                    <select
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      required
                      className="select select-bordered select-sm"
                    >
                      <option value="CashOnDelivery">Cash on Delivery</option>
                      <option value="CardOnDelivery">Card on Delivery</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary mt-4"
                  >
                    {submitting ? (
                      <><span className="loading loading-spinner loading-sm" /> Placing Order…</>
                    ) : (
                      <><i className="bi bi-check-lg" /> Place Order — {fmt(total)}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}