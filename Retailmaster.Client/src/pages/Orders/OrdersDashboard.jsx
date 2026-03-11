import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { fadeUp, scaleIn, listItem } from '../../motion'
import api from '../../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

function StatusBadge({ status }) {
  const statusConfig = {
    Pending: { color: 'badge-warning', icon: 'bi-hourglass-split', label: 'Pending' },
    Accepted: { color: 'badge-info', icon: 'bi-check-circle', label: 'Accepted' },
    ReadyForPickup: { color: 'badge-success', icon: 'bi-bag-check', label: 'Ready for Pickup' },
    OutForDelivery: { color: 'badge-secondary', icon: 'bi-truck', label: 'Out for Delivery' },
    Delivered: { color: 'badge-success', icon: 'bi-check-all', label: 'Delivered' },
    Cancelled: { color: 'badge-error', icon: 'bi-x-circle', label: 'Cancelled' }
  }

  const config = statusConfig[status] || statusConfig.Pending

  return (
    <span className={`badge ${config.color} gap-1 py-3 px-3`}>
      <i className={`bi ${config.icon} text-xs`} />
      {config.label}
    </span>
  )
}

function OrderCard({ order, onClick }) {
  return (
    <motion.div
      variants={listItem}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.01 }}
      onClick={() => onClick(order)}
      className="card bg-base-100 border border-base-300 hover:border-primary/30 cursor-pointer transition-all"
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-primary text-sm">
                {order.orderNumber}
              </span>
              {order.isNew && (
                <span className="badge badge-error badge-sm gap-1 animate-pulse">
                  <i className="bi bi-bell-fill text-[10px]" /> New
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base-content">{order.customerName}</h3>
            <p className="text-xs text-base-content/60 flex items-center gap-1 mt-1">
              <i className="bi bi-telephone" /> {order.customerPhone}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-2 text-sm">
          <p className="text-base-content/70 flex items-start gap-1">
            <i className="bi bi-geo-alt mt-1 flex-shrink-0" />
            <span className="text-xs">{order.deliveryAddress}</span>
          </p>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-base-200">
          <div className="flex items-center gap-2 text-xs text-base-content/50">
            <i className="bi bi-box-seam" />
            {order.itemCount} items
          </div>
          <div className="font-bold text-primary font-mono">
            {fmt(order.totalAmount)}
          </div>
        </div>

        <div className="text-[10px] text-base-content/40 mt-2">
          {new Date(order.createdAt).toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}

function OrderDetailModal({ order, onClose, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fullOrder, setFullOrder] = useState(null)

  // Fetch full order details when modal opens
  useEffect(() => {
    const fetchFullOrder = async () => {
      if (!order?.id) return
      
      setLoading(true)
      try {
        const res = await api.get(`/orders/${order.id}`)
        setFullOrder(res.data)
      } catch (err) {
        console.error('Failed to fetch order details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFullOrder()
  }, [order?.id])

  const statusMap = {
  'Pending': 0,
  'Accepted': 1,
  'Preparing': 2,
  'ReadyForPickup': 3,
  'OutForDelivery': 4,
  'Delivered': 5,
  'Cancelled': 6,
  'Rejected': 7
}

  const handleStatusChange = async (newStatus) => {
  setUpdating(true)
  try {
    const dto = {
      status: statusMap[newStatus] 
    }

    if (newStatus === 'Cancelled') {
      if (!cancellationReason.trim()) {
        alert('Please provide a cancellation reason')
        setUpdating(false)
        return
      }
      dto.cancellationReason = cancellationReason.trim()
    }

    console.log('Sending status update:', JSON.stringify(dto, null, 2))

    const res = await api.put(`/orders/${order.id}/status`, dto)
    
    console.log('Update response:', res.data)
    
    onStatusUpdate(res.data)
    setShowCancelInput(false)
    setCancellationReason('')
    setFullOrder(res.data)
  } catch (err) {
    console.error('Failed to update order:', err)
    console.error('Error response status:', err.response?.status)
    console.error('Error response data:', err.response?.data) // This will show the exact error message
    alert(`Error: ${err.response?.data?.message || 'Failed to update order'}`)
  } finally {
    setUpdating(false)
  }
}

  const getNextActions = () => {
    const currentStatus = fullOrder?.status || order?.status
    
    switch (currentStatus) {
      case 'Pending':
        return (
          <div className="flex flex-col gap-2">
            {showCancelInput ? (
  <div className="space-y-2">
    <textarea
      value={cancellationReason}
      onChange={(e) => setCancellationReason(e.target.value)}
      placeholder="Reason for cancellation..."
      className="textarea textarea-bordered textarea-sm w-full"
      rows={2}
      required={true}
    />
    <div className="flex gap-2">
      <button
        onClick={() => handleStatusChange('Cancelled')}
        disabled={updating || !cancellationReason.trim()}
        className="btn btn-error btn-sm flex-1"
      >
        {updating ? <span className="loading loading-spinner loading-xs" /> : 'Confirm Cancel'}
      </button>
      <button
        onClick={() => {
          setShowCancelInput(false)
          setCancellationReason('')
        }}
        className="btn btn-ghost btn-sm"
      >
        Back
      </button>
    </div>
  </div>
) : (
  <div className="flex gap-2">
    <button
      onClick={() => setShowCancelInput(true)}
      className="btn btn-error btn-sm flex-1"
    >
      <i className="bi bi-x-circle" /> Cancel
    </button>
    <button
      onClick={() => handleStatusChange('Accepted')}
      disabled={updating}
      className="btn btn-success btn-sm flex-1"
    >
      {updating ? <span className="loading loading-spinner loading-xs" /> : 'Accept Order'}
    </button>
  </div>
)}
          </div>
        )
      case 'Accepted':
        return (
          <button
            onClick={() => handleStatusChange('ReadyForPickup')}
            disabled={updating}
            className="btn btn-primary w-full"
          >
            {updating ? <span className="loading loading-spinner loading-xs" /> : 'Ready for Pickup'}
          </button>
        )
      case 'ReadyForPickup':
        return (
          <button
            onClick={() => handleStatusChange('OutForDelivery')}
            disabled={updating}
            className="btn btn-primary w-full"
          >
            {updating ? <span className="loading loading-spinner loading-xs" /> : 'Out for Delivery'}
          </button>
        )
      case 'OutForDelivery':
        return (
          <button
            onClick={() => handleStatusChange('Delivered')}
            disabled={updating}
            className="btn btn-success w-full"
          >
            {updating ? <span className="loading loading-spinner loading-xs" /> : 'Mark Delivered'}
          </button>
        )
      default:
        return null
    }
  }

  // Use fullOrder if available, otherwise fall back to the passed order
  const displayOrder = fullOrder || order

  if (!displayOrder) return null

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div className="bg-base-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-5 text-white sticky top-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-lg">{displayOrder.orderNumber}</span>
                <StatusBadge status={displayOrder.status} />
              </div>
              <p className="text-white/80 text-sm">
                {new Date(displayOrder.createdAt).toLocaleString()}
              </p>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-square text-white">
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-base-200 p-4 rounded-xl">
                <div className="text-xs text-base-content/50 mb-1">Customer</div>
                <div className="font-semibold">{displayOrder.customerName}</div>
                <div className="text-sm text-base-content/60 flex items-center gap-1 mt-1">
                  <i className="bi bi-telephone" /> {displayOrder.customerPhone}
                </div>
                <div className="text-sm text-base-content/60 flex items-center gap-1 mt-1">
                  <i className="bi bi-envelope" /> {displayOrder.customerEmail}
                </div>
              </div>
              
              <div className="bg-base-200 p-4 rounded-xl">
                <div className="text-xs text-base-content/50 mb-1">Delivery Address</div>
                <div className="font-semibold">{displayOrder.deliveryAddress}</div>
                {displayOrder.deliveryInstructions && (
                  <div className="text-sm text-base-content/60 mt-2 italic">
                    "{displayOrder.deliveryInstructions}"
                  </div>
                )}
              </div>
            </div>

            {/* Items - Safe check with optional chaining */}
            <div>
              <h3 className="font-bold mb-3">Order Items</h3>
              <div className="space-y-2">
                {displayOrder.items && displayOrder.items.length > 0 ? (
                  displayOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-base-200">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-sm text-base-content/50 ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-mono">{fmt(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base-content/50 py-4">No items found</p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-base-200 p-4 rounded-xl">
              <h3 className="font-bold mb-3">Order Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <i className="bi bi-clock-history text-base-content/40" />
                  <span>Order placed at {new Date(displayOrder.createdAt).toLocaleTimeString()}</span>
                </div>
                {displayOrder.acceptedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-check-circle-fill text-success" />
                    <span>Accepted by {displayOrder.acceptedBy} at {new Date(displayOrder.acceptedAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {displayOrder.readyForPickupAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-bag-check-fill text-success" />
                    <span>Ready for pickup at {new Date(displayOrder.readyForPickupAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {displayOrder.outForDeliveryAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-truck text-secondary" />
                    <span>Out for delivery at {new Date(displayOrder.outForDeliveryAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {displayOrder.deliveredAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-check-all-fill text-success" />
                    <span>Delivered by {displayOrder.deliveredBy} at {new Date(displayOrder.deliveredAt).toLocaleTimeString()}</span>
                  </div>
                )}
                {displayOrder.cancelledAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <i className="bi bi-x-circle-fill text-error" />
                    <span>Cancelled: {displayOrder.cancellationReason}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-base-200 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-base-content/60">Subtotal</span>
                <span className="font-mono">{fmt(displayOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-base-content/60">Delivery Fee</span>
                <span className="font-mono text-success">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span className="text-primary font-mono">{fmt(displayOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            {getNextActions() && (
              <div className="border-t border-base-200 pt-4">
                {getNextActions()}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function OrdersDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [newOrders, setNewOrders] = useState([])

  const loadOrders = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : ''
      const [ordersRes, statsRes] = await Promise.all([
        api.get(`/orders${params}`),
        api.get('/orders/stats')
      ])
      setOrders(ordersRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkNewOrders = async () => {
    try {
      const res = await api.get('/orders/new')
      if (res.data.length > 0) {
        setNewOrders(res.data)
        loadOrders() // Refresh orders list
      }
    } catch (err) {
      console.error('Failed to check new orders:', err)
    }
  }

  useEffect(() => {
    loadOrders()
    
    // Poll for new orders every 30 seconds
    const interval = setInterval(checkNewOrders, 30000)
    return () => clearInterval(interval)
  }, [statusFilter])

  const statusTabs = [
    { value: '', label: 'All', icon: 'bi-list' },
    { value: 'Pending', label: 'Pending', icon: 'bi-hourglass-split' },
    { value: 'Accepted', label: 'Accepted', icon: 'bi-check-circle' },
    { value: 'ReadyForPickup', label: 'Ready', icon: 'bi-bag-check' },
    { value: 'OutForDelivery', label: 'Out for Delivery', icon: 'bi-truck' },
    { value: 'Delivered', label: 'Delivered', icon: 'bi-check-all' }
  ]

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start justify-between mb-5 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            Online Orders
          </h1>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
            {user?.isAdmin ? 'All branches' : user?.branchName}
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
          <div className="stat-card bg-base-100 border border-base-300 rounded-xl p-3">
            <div className="text-warning text-lg font-bold">{stats.pendingCount}</div>
            <div className="text-xs text-base-content/50">Pending</div>
          </div>
          <div className="stat-card bg-base-100 border border-base-300 rounded-xl p-3">
            <div className="text-info text-lg font-bold">{stats.acceptedCount}</div>
            <div className="text-xs text-base-content/50">Accepted</div>
          </div>
          <div className="stat-card bg-base-100 border border-base-300 rounded-xl p-3">
            <div className="text-success text-lg font-bold">{stats.readyCount}</div>
            <div className="text-xs text-base-content/50">Ready</div>
          </div>
          <div className="stat-card bg-base-100 border border-base-300 rounded-xl p-3">
            <div className="text-secondary text-lg font-bold">{stats.outForDeliveryCount}</div>
            <div className="text-xs text-base-content/50">Out for Delivery</div>
          </div>
          <div className="stat-card bg-base-100 border border-base-300 rounded-xl p-3">
            <div className="text-success text-lg font-bold">৳{stats.todayRevenue.toFixed(0)}</div>
            <div className="text-xs text-base-content/50">Today's Revenue</div>
          </div>
        </motion.div>
      )}

      {/* Status Tabs */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
        className="mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-1 min-w-max">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`btn btn-sm gap-1.5 ${statusFilter === tab.value ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
            >
              <i className={`bi ${tab.icon}`} />
              {tab.label}
              {tab.value === 'Pending' && stats?.pendingCount > 0 && (
                <span className="badge badge-error badge-sm ml-1">{stats.pendingCount}</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* New Orders Alert */}
      <AnimatePresence>
        {newOrders.length > 0 && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="alert alert-success mb-4"
          >
            <div className="flex-1">
              <i className="bi bi-bell-fill mr-2" />
              {newOrders.length} new order{newOrders.length > 1 ? 's' : ''} received!
            </div>
            <button
              onClick={() => {
                setNewOrders([])
                loadOrders()
              }}
              className="btn btn-sm btn-ghost"
            >
              View
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <i className="bi bi-inbox text-5xl text-base-content/20 block mb-3" />
          <p className="text-base-content/50">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onStatusUpdate={(updatedOrder) => {
              setSelectedOrder(updatedOrder)
              loadOrders() // Refresh the list
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}