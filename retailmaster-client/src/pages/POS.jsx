import { useEffect, useState, useRef } from 'react'
import api from '../services/api'
import './POS.css'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function POS() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const searchRef = useRef(null)

  useEffect(() => {
    api.get('/products').then(res => {
      setProducts(res.data)
      setFilteredProducts(res.data)
    })
    searchRef.current?.focus()
  }, [])

  // Search/filter products
  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products)
      return
    }
    const q = search.toLowerCase()
    setFilteredProducts(products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q))
    ))
  }, [search, products])

  const addToCart = (product) => {
    if (product.stockQty === 0) return
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQty) return prev
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        maxQty: product.stockQty,
        quantity: 1,
      }]
    })
    setSearch('')
    searchRef.current?.focus()
  }

  const updateQty = (productId, qty) => {
    const item = cart.find(i => i.productId === productId)
    if (!item) return
    const newQty = Math.max(1, Math.min(parseInt(qty) || 1, item.maxQty))
    setCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: newQty } : i))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  const clearCart = () => { setCart([]); setDiscount(0); setError('') }

  const totalAmount = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const discountAmt = Math.min(parseFloat(discount) || 0, totalAmount)
  const finalAmount = totalAmount - discountAmt

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/sales', {
        discount: discountAmt,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity }))
      })
      setReceipt(res.data)
      // Refresh product stock
      const updated = await api.get('/products')
      setProducts(updated.data)
      setCart([])
      setDiscount(0)
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintReceipt = () => window.print()

  return (
    <div className="pos-page">
      {/* Left: Product search + grid */}
      <div className="pos-left">
        <div className="pos-search-wrap">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="pos-search-icon">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={searchRef}
            type="text"
            className="pos-search"
            placeholder="Search product or scan barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && filteredProducts.length === 1) addToCart(filteredProducts[0])
            }}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
        </div>

        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <div className="grid-empty">No products found</div>
          ) : (
            filteredProducts.map(p => (
              <button
                key={p.id}
                className={`product-tile ${p.stockQty === 0 ? 'tile-out' : ''} ${cart.find(i => i.productId === p.id) ? 'tile-incart' : ''}`}
                onClick={() => addToCart(p)}
                disabled={p.stockQty === 0}
              >
                <div className="tile-name">{p.name}</div>
                <div className="tile-price">{fmt(p.sellingPrice)}</div>
                <div className={`tile-stock ${p.isLowStock ? 'low' : ''}`}>
                  {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} in stock`}
                </div>
                {cart.find(i => i.productId === p.id) && (
                  <div className="tile-badge">{cart.find(i => i.productId === p.id)?.quantity}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Cart + Checkout */}
      <div className="pos-right">
        <div className="cart-header">
          <h2 className="cart-title">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
            </svg>
            Cart
            {cart.length > 0 && <span className="cart-count">{cart.reduce((s,i) => s + i.quantity, 0)}</span>}
          </h2>
          {cart.length > 0 && (
            <button className="clear-btn" onClick={clearCart}>Clear</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <div>Cart is empty</div>
            <div className="cart-empty-hint">Click a product or scan barcode to add items</div>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity - 1)}>−</button>
                  <input
                    type="number"
                    className="qty-input"
                    value={item.quantity}
                    min={1} max={item.maxQty}
                    onChange={e => updateQty(item.productId, e.target.value)}
                  />
                  <button className="qty-btn" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                </div>
                <div className="cart-item-subtotal">{fmt(item.unitPrice * item.quantity)}</div>
                <button className="remove-btn" onClick={() => removeFromCart(item.productId)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="cart-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span className="mono">{fmt(totalAmount)}</span>
          </div>
          <div className="total-row discount-row">
            <span>Discount (৳)</span>
            <input
              type="number"
              className="discount-input"
              value={discount}
              min={0} max={totalAmount}
              onChange={e => setDiscount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="total-row total-final">
            <span>Total</span>
            <span className="mono">{fmt(finalAmount)}</span>
          </div>
        </div>

        {error && <div className="checkout-error">{error}</div>}

        <button
          className="checkout-btn"
          onClick={handleCheckout}
          disabled={cart.length === 0 || loading}
        >
          {loading ? (
            <span>Processing...</span>
          ) : (
            <>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
              Complete Sale — {fmt(finalAmount)}
            </>
          )}
        </button>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div className="modal-overlay" onClick={() => setReceipt(null)}>
          <div className="receipt-box" onClick={e => e.stopPropagation()}>
            <div className="receipt-header">
              <div className="receipt-logo">🏪 POSPro</div>
              <div className="receipt-title">Sale Receipt</div>
              <div className="receipt-meta">
                <span>#{receipt.id}</span>
                <span>{new Date(receipt.saleDate).toLocaleString()}</span>
              </div>
              <div className="receipt-cashier">Cashier: {receipt.cashierName}</div>
            </div>

            <div className="receipt-items">
              <div className="receipt-item-header">
                <span>Item</span><span>Qty</span><span>Price</span><span>Total</span>
              </div>
              {receipt.items.map((item, i) => (
                <div key={i} className="receipt-item">
                  <span>{item.productName}</span>
                  <span>{item.quantity}</span>
                  <span>{fmt(item.unitPrice)}</span>
                  <span>{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div className="receipt-row"><span>Subtotal</span><span>{fmt(receipt.totalAmount)}</span></div>
              {receipt.discount > 0 && <div className="receipt-row discount"><span>Discount</span><span>−{fmt(receipt.discount)}</span></div>}
              <div className="receipt-row receipt-final"><span>TOTAL</span><span>{fmt(receipt.finalAmount)}</span></div>
            </div>

            <div className="receipt-profit">
              Profit on this sale: <strong>{fmt(receipt.totalProfit)}</strong>
            </div>

            <div className="receipt-footer">Thank you for your purchase!</div>

            <div className="receipt-actions">
              <button className="btn btn-ghost" onClick={() => setReceipt(null)}>Close</button>
              <button className="btn btn-primary" onClick={handlePrintReceipt}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
