import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { scaleIn, listItem } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function POS() {
  const { user } = useAuth()
  const [branches, setBranches]   = useState([])
  const [branchId, setBranchId]   = useState(user?.branchId || null)
  const [products, setProducts]   = useState([])
  const [filtered, setFiltered]   = useState([])
  const [cart, setCart]           = useState([])
  const [search, setSearch]       = useState('')
  const [discount, setDiscount]   = useState(0)
  const [customerName, setCustomerName]   = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading]     = useState(false)
  const [receipt, setReceipt]     = useState(null)
  const [error, setError]         = useState('')
  const searchRef = useRef(null)

  useEffect(() => {
    if (user?.isAdmin) {
      api.get('/branches').then(r => {
        setBranches(r.data)
        if (!branchId && r.data.length > 0) {
          const def = r.data.find(b => b.isDefault) || r.data[0]
          setBranchId(def.id)
        }
      })
    }
  }, [user])

  useEffect(() => {
    if (!branchId) return
    api.get(`/products?branchId=${branchId}`)
      .then(r => { setProducts(r.data); setFiltered(r.data) })
      .catch(() => {})
    setCart([])
    searchRef.current?.focus()
  }, [branchId])

  useEffect(() => {
    if (!search.trim()) { setFiltered(products); return }
    const q = search.toLowerCase()
    setFiltered(products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))))
  }, [search, products])

  const addToCart = (product) => {
    if (product.stockQty === 0) return
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id)
      if (ex) {
        if (ex.quantity >= product.stockQty) return prev
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, maxQty: product.stockQty, quantity: 1 }]
    })
    setSearch(''); searchRef.current?.focus()
  }

  const updateQty = (productId, qty) => {
    const item = cart.find(i => i.productId === productId)
    if (!item) return
    const newQty = Math.max(1, Math.min(parseInt(qty) || 1, item.maxQty))
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: newQty } : i))
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.productId !== productId))

  const clearCart = () => {
    setCart([]); setDiscount(0); setCustomerName(''); setCustomerPhone(''); setError('')
  }

  const totalAmount = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountAmt = Math.min(parseFloat(discount) || 0, totalAmount)
  const finalAmount = totalAmount - discountAmt

  const handleCheckout = async () => {
    if (!cart.length || !branchId) return
    setError(''); setLoading(true)
    try {
      const res = await api.post('/sales', {
        branchId, discount: discountAmt,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
      })
      setReceipt(res.data)
      const updated = await api.get(`/products?branchId=${branchId}`)
      setProducts(updated.data); setFiltered(updated.data)
      clearCart()
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed.')
    } finally { setLoading(false) }
  }

  const inCart = (id) => cart.find(i => i.productId === id)

  if (!branchId) return (
    <div className="flex items-center justify-center h-64 text-base-content/40 text-sm">
      <div className="text-center">
        <i className="bi bi-building text-4xl block mb-2 text-base-content/20" />
        Select a branch to start selling
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-[1fr_380px] gap-5 h-[calc(100vh-64px)] max-h-[860px]">

      {/* ── Left: Products ── */}
      <div className="flex flex-col gap-3 overflow-hidden">

        {user?.isAdmin && branches.length > 0 && (
          <div className="flex items-center gap-2 bg-base-100 rounded-xl border border-base-300 px-3 py-2 flex-shrink-0">
            <i className="bi bi-building-fill text-primary text-sm" />
            <span className="text-xs text-base-content/60 font-semibold">Branch:</span>
            <select value={branchId} onChange={e => setBranchId(parseInt(e.target.value))}
              className="flex-1 text-sm font-semibold text-base-content border-0 outline-none bg-transparent cursor-pointer">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <span className="text-xs text-base-content/30 font-mono">{products.length} products</span>
          </div>
        )}

        {!user?.isAdmin && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 flex-shrink-0">
            <i className="bi bi-building-fill text-primary text-sm" />
            <span className="text-sm font-semibold text-primary">{user?.branchName}</span>
            <span className="ml-auto text-xs text-primary/60">{products.length} products</span>
          </div>
        )}

        <div className="relative flex-shrink-0">
          <label className="input input-bordered border-2 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 flex items-center gap-2 w-full">
            <i className="bi bi-upc-scan text-base-content/30" />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && filtered.length === 1) addToCart(filtered[0]) }}
              placeholder="Search or scan barcode…" className="grow text-sm" />
            {search && (
              <button onClick={() => setSearch('')} className="text-base-content/30 bg-transparent border-0 cursor-pointer text-sm">
                <i className="bi bi-x-lg" />
              </button>
            )}
          </label>
        </div>

        {/* Product tiles */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(135px,1fr))] gap-2.5 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-base-content/40 text-sm">
              <i className="bi bi-search text-3xl block mb-2 text-base-content/20" />No products found
            </div>
          ) : filtered.map((p, i) => {
            const ci = inCart(p.id)
            return (
              <motion.button key={p.id} variants={listItem} initial="hidden" animate="visible" custom={i}
                onClick={() => addToCart(p)} disabled={p.stockQty === 0}
                className={`relative text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer font-[inherit]
                  ${p.stockQty === 0 ? 'opacity-50 cursor-not-allowed bg-base-200 border-base-300' :
                    ci ? 'border-primary bg-primary/10' :
                    'bg-base-100 border-base-300 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md'}`}>
                {ci && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {ci.quantity}
                  </div>
                )}
                <div className="text-xs font-semibold text-base-content mb-2 leading-tight">{p.name}</div>
                <div className="text-base font-bold text-primary font-mono">{fmt(p.sellingPrice)}</div>
                <div className={`text-[10px] mt-1 ${p.stockQty === 0 ? 'text-base-content/40' : p.isLowStock ? 'text-warning' : 'text-base-content/40'}`}>
                  {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} left`}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-base-300 flex-shrink-0">
          <h2 className="text-sm font-bold text-base-content flex items-center gap-2">
            <i className="bi bi-cart3 text-primary" /> Cart
            {cart.length > 0 && (
              <span className="badge badge-primary badge-sm">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="btn btn-ghost btn-xs text-error gap-1">
              <i className="bi bi-trash3" />Clear
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-base-content/20">
            <i className="bi bi-cart text-5xl" /><span className="text-sm font-medium">Cart is empty</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.productId}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 bg-base-200 rounded-xl px-3 py-2.5 border border-base-300">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-base-content truncate">{item.name}</div>
                    <div className="text-[11px] text-base-content/50 font-mono">{fmt(item.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="btn btn-xs btn-ghost border border-base-300 w-6 h-6 min-h-0 p-0 font-bold">−</button>
                    <input type="number" value={item.quantity} min={1} max={item.maxQty}
                      onChange={e => updateQty(item.productId, e.target.value)}
                      className="w-8 text-center border border-base-300 rounded-md text-xs font-bold font-mono py-0.5 outline-none focus:border-primary bg-base-100" />
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="btn btn-xs btn-ghost border border-base-300 w-6 h-6 min-h-0 p-0 font-bold">+</button>
                  </div>
                  <div className="text-xs font-bold font-mono text-primary min-w-[52px] text-right">{fmt(item.unitPrice * item.quantity)}</div>
                  <button onClick={() => removeFromCart(item.productId)}
                    className="btn btn-ghost btn-xs btn-square text-base-content/30 hover:text-error">
                    <i className="bi bi-x-lg" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Customer fields */}
        <div className="px-3 py-2 border-t border-base-300 flex flex-col gap-2 flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (opt.)"
              className="input input-bordered input-xs w-full text-xs" />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone (opt.)"
              className="input input-bordered input-xs w-full text-xs" />
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-base-300 px-4 py-3 flex flex-col gap-2 flex-shrink-0">
          <div className="flex justify-between text-sm">
            <span className="text-base-content/60">Subtotal</span>
            <span className="font-mono font-semibold">{fmt(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-base-content/40 text-xs">Discount (৳)</span>
            <input type="number" value={discount} min={0} max={totalAmount}
              onChange={e => setDiscount(e.target.value)}
              className="w-20 text-right border border-base-300 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-base-100" />
          </div>
          <div className="flex justify-between pt-2 border-t border-dashed border-base-300">
            <span className="font-bold text-base-content">Total</span>
            <span className="font-bold text-xl font-mono text-primary">{fmt(finalAmount)}</span>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-3 mb-2 alert alert-error text-xs py-2">
              <i className="bi bi-exclamation-circle" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleCheckout} disabled={!cart.length || loading}
          className="btn btn-primary mx-3 mb-3 gap-2 hover:-translate-y-0.5">
          {loading
            ? <><span className="loading loading-spinner loading-sm" /> Processing…</>
            : <><i className="bi bi-bag-check-fill text-base" /> Complete Sale — {fmt(finalAmount)}</>}
        </button>
      </div>

      {/* ── Receipt Modal ── */}
      <AnimatePresence>
        {receipt && (
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
            onClick={() => setReceipt(null)}>
            <div className="card bg-base-100 w-full max-w-[420px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-neutral text-white p-5 text-center">
                <div className="text-base font-bold">{receipt.companyName}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest mt-0.5">{receipt.branchName}</div>
                <div className="flex justify-center gap-3 mt-2 text-xs text-white/50 font-mono">
                  <span className="font-bold text-primary">{receipt.invoiceNo}</span>
                  <span>{new Date(receipt.saleDate).toLocaleString()}</span>
                </div>
                <div className="text-xs text-white/35 mt-1">Cashier: {receipt.cashierName}</div>
                {receipt.customerName && <div className="text-xs text-white/35">{receipt.customerName}</div>}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[2fr_.5fr_1fr_1fr] text-[10px] font-bold uppercase text-base-content/40 pb-2 mb-1 border-b border-base-300">
                  <span>Item</span><span>Qty</span><span>Price</span><span className="text-right">Total</span>
                </div>
                {receipt.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-[2fr_.5fr_1fr_1fr] text-xs py-1.5 border-b border-dashed border-base-200 last:border-0">
                    <span className="font-medium text-base-content truncate">{item.productName}</span>
                    <span className="text-base-content/50">{item.quantity}</span>
                    <span className="font-mono text-base-content/60">{fmt(item.unitPrice)}</span>
                    <span className="font-mono font-semibold text-right">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3 flex flex-col gap-1">
                <div className="flex justify-between text-sm text-base-content/60">
                  <span>Subtotal</span><span className="font-mono">{fmt(receipt.totalAmount)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span><span className="font-mono">−{fmt(receipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold border-t-2 border-base-content pt-2 mt-1">
                  <span>TOTAL</span><span className="font-mono">{fmt(receipt.finalAmount)}</span>
                </div>
              </div>
              <div className="mx-4 mb-3 alert alert-success text-xs py-2">
                <i className="bi bi-graph-up-arrow" />Profit: <strong>{fmt(receipt.totalProfit)}</strong>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => setReceipt(null)} className="btn flex-1 btn-ghost border border-base-300">Close</button>
                <button onClick={() => window.open(`/invoice/${receipt.invoiceNo}`, '_blank')}
                  className="btn btn-primary flex-1 gap-2">
                  <i className="bi bi-receipt" /> Full Invoice
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}