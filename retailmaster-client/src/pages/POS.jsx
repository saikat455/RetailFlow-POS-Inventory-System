import { useEffect, useState, useRef } from 'react'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [filtered, setFiltered] = useState([])
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/products').then(res => { setProducts(res.data); setFiltered(res.data) })
    searchRef.current?.focus()
  }, [])

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
      return [...prev, { productId: product.id, name: product.name, unitPrice: product.sellingPrice, purchasePrice: product.purchasePrice, maxQty: product.stockQty, quantity: 1 }]
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
  const clearCart = () => { setCart([]); setDiscount(0); setError('') }

  const totalAmount = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountAmt = Math.min(parseFloat(discount) || 0, totalAmount)
  const finalAmount = totalAmount - discountAmt

  const handleCheckout = async () => {
    if (!cart.length) return
    setError(''); setLoading(true)
    try {
      const res = await api.post('/sales', {
        discount: discountAmt,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
      })
      setReceipt(res.data)
      const updated = await api.get('/products')
      setProducts(updated.data)
      setCart([]); setDiscount(0)
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  const inCart = (id) => cart.find(i => i.productId === id)

  return (
    <div className="grid grid-cols-[1fr_360px] gap-5 h-[calc(100vh-64px)] max-h-[860px]">

      {/* ── Left: Products ── */}
      <div className="flex flex-col gap-3 overflow-hidden">

        {/* Search */}
        <div className="relative flex-shrink-0">
          <i className="bi bi-upc-scan absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef} type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && filtered.length === 1) addToCart(filtered[0]) }}
            placeholder="Search product or scan barcode… (Enter to add)"
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl text-sm bg-white outline-none transition-all font-[inherit]"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-sm">
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        {/* Product tiles */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(138px,1fr))] gap-2.5 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-10 text-sm text-gray-400">
              <i className="bi bi-search text-3xl block mb-2 text-gray-200" />
              No products found
            </div>
          ) : filtered.map(p => {
            const cartItem = inCart(p.id)
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stockQty === 0}
                className={`relative text-left p-3.5 rounded-xl border-2 transition-all duration-150 cursor-pointer font-[inherit]
                  ${p.stockQty === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' :
                    cartItem ? 'border-blue-500 bg-blue-50' :
                    'bg-white border-gray-100 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-md'}`}
              >
                {cartItem && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {cartItem.quantity}
                  </div>
                )}
                <div className="text-xs font-semibold text-gray-800 mb-2 leading-tight">{p.name}</div>
                <div className="text-base font-bold text-blue-500 font-mono">{fmt(p.sellingPrice)}</div>
                <div className={`text-[10px] mt-1 ${p.isLowStock ? 'text-amber-500' : 'text-gray-400'}`}>
                  {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} in stock`}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">

        {/* Cart header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <i className="bi bi-cart3 text-blue-500" />
            Cart
            {cart.length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart}
              className="text-red-400 hover:text-red-500 text-xs font-semibold bg-transparent border-0 cursor-pointer font-[inherit]">
              <i className="bi bi-trash3 mr-1" />Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
            <i className="bi bi-cart text-4xl text-gray-200" />
            <span className="text-sm font-medium">Cart is empty</span>
            <span className="text-xs text-gray-300 text-center max-w-[160px] leading-relaxed">Click a product or scan a barcode to add items</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {cart.map(item => (
              <div key={item.productId}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{item.name}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{fmt(item.unitPrice)} each</div>
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all text-xs cursor-pointer font-bold">
                    −
                  </button>
                  <input
                    type="number" value={item.quantity} min={1} max={item.maxQty}
                    onChange={e => updateQty(item.productId, e.target.value)}
                    className="w-8 text-center border border-gray-200 rounded-md text-xs font-bold font-mono py-0.5 outline-none focus:border-blue-400"
                  />
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-md bg-white text-gray-600 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all text-xs cursor-pointer font-bold">
                    +
                  </button>
                </div>
                <div className="text-xs font-bold font-mono text-blue-500 min-w-[52px] text-right">
                  {fmt(item.unitPrice * item.quantity)}
                </div>
                <button onClick={() => removeFromCart(item.productId)}
                  className="text-gray-300 hover:text-red-400 text-xs ml-0.5 bg-transparent border-0 cursor-pointer transition-colors">
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2 flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-mono font-semibold text-gray-700">{fmt(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 text-xs">Discount (৳)</span>
            <input
              type="number" value={discount} min={0} max={totalAmount}
              onChange={e => setDiscount(e.target.value)}
              placeholder="0"
              className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-bold text-xl font-mono text-blue-500">{fmt(finalAmount)}</span>
          </div>
        </div>

        {error && (
          <div className="mx-3 mb-2 bg-red-50 border border-red-200 text-red-500 text-xs px-3 py-2 rounded-lg">
            <i className="bi bi-exclamation-circle mr-1" />{error}
          </div>
        )}

        {/* Checkout button */}
        <button
          onClick={handleCheckout}
          disabled={!cart.length || loading}
          className="mx-3 mb-3 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 cursor-pointer border-0 font-[inherit]"
        >
          {loading ? (
            <><i className="bi bi-arrow-repeat animate-spin" /> Processing...</>
          ) : (
            <><i className="bi bi-bag-check-fill text-base" /> Complete Sale — {fmt(finalAmount)}</>
          )}
        </button>
      </div>

      {/* ── Receipt Modal ── */}
      {receipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setReceipt(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden"
            style={{ animation: 'popIn 0.2s ease' }}
            onClick={e => e.stopPropagation()}>

            {/* Receipt header */}
            <div className="bg-[#13151f] text-white p-5 text-center">
              <div className="text-lg font-bold mb-0.5">🏪 POSPro</div>
              <div className="text-[11px] uppercase tracking-widest text-white/40">Sale Receipt</div>
              <div className="flex justify-center gap-4 mt-2.5 text-[11px] text-white/50 font-mono">
                <span>#{receipt.id}</span>
                <span>{new Date(receipt.saleDate).toLocaleString()}</span>
              </div>
              <div className="text-[11px] text-white/40 mt-1">Cashier: {receipt.cashierName}</div>
            </div>

            {/* Items */}
            <div className="p-4">
              <div className="grid grid-cols-[2fr_.5fr_1fr_1fr] gap-2 text-[10px] font-semibold uppercase text-gray-400 border-b border-gray-100 pb-2 mb-2">
                <span>Item</span><span>Qty</span><span>Price</span><span className="text-right">Total</span>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[2fr_.5fr_1fr_1fr] gap-2 text-xs py-1.5 border-b border-dashed border-gray-100 last:border-0">
                  <span className="font-medium text-gray-700 truncate">{item.productName}</span>
                  <span className="text-gray-500">{item.quantity}</span>
                  <span className="font-mono text-gray-600">{fmt(item.unitPrice)}</span>
                  <span className="font-mono font-semibold text-right text-gray-800">{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-4 pb-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span className="font-mono">{fmt(receipt.totalAmount)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span className="font-mono">−{fmt(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t-2 border-gray-900 pt-2 mt-1">
                <span>TOTAL</span><span className="font-mono">{fmt(receipt.finalAmount)}</span>
              </div>
            </div>

            {/* Profit */}
            <div className="mx-4 mb-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-600 font-medium flex items-center gap-2">
              <i className="bi bi-graph-up-arrow" />
              Profit on this sale: <strong>{fmt(receipt.totalProfit)}</strong>
            </div>

            <div className="text-center text-[11px] text-gray-400 pb-3">Thank you for your purchase!</div>

            <div className="flex gap-2 px-4 pb-4">
              <button onClick={() => setReceipt(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit] transition-colors">
                Close
              </button>
              <button onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold cursor-pointer border-0 font-[inherit] transition-colors">
                <i className="bi bi-printer-fill" /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}