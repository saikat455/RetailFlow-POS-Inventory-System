import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, listItem, scaleIn } from '../../motion'
import api from '../../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function BranchMenu() {
  const { branchId } = useParams()
  const navigate = useNavigate()
  
  const [branch, setBranch] = useState(null)
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Get branch details from branches list
        const branchesRes = await api.get('/online/branches')
        const currentBranch = branchesRes.data.find(b => b.id === parseInt(branchId))
        setBranch(currentBranch)

        // Get products
        const productsRes = await api.get(`/online/branches/${branchId}/products`)
        setProducts(productsRes.data)
        setFiltered(productsRes.data)
        
        // Generate categories from products
        // For now, we'll just use first letter or you can add category to products later
        const cats = ['all', ...new Set(productsRes.data.map(p => p.name[0]))]
        setCategories(cats)
      } catch (err) {
        setError('Failed to load menu. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [branchId])

  useEffect(() => {
    let filteredProducts = products
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filteredProducts = filteredProducts.filter(p => 
        p.name.startsWith(selectedCategory)
      )
    }
    
    // Apply search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      filteredProducts = filteredProducts.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
      )
    }
    
    setFiltered(filteredProducts)
  }, [selectedCategory, search, products])

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQty) return prev
        return prev.map(i => 
          i.productId === product.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: 1,
        maxQty: product.stockQty
      }]
    })
  }

  const updateQuantity = (productId, newQty) => {
    const item = cart.find(i => i.productId === productId)
    if (!item) return
    
    const quantity = Math.max(1, Math.min(parseInt(newQty) || 1, item.maxQty))
    setCart(prev => prev.map(i => 
      i.productId === productId ? { ...i, quantity } : i
    ))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    // Save cart to session storage and navigate to checkout
    sessionStorage.setItem('onlineCart', JSON.stringify(cart))
    sessionStorage.setItem('onlineBranch', JSON.stringify(branch))
    navigate('/online/checkout')
  }

  return (
    <div className="min-h-screen bg-base-200 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/online" className="text-white/80 hover:text-white">
              <i className="bi bi-arrow-left text-xl" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">{branch?.name || 'Menu'}</h1>
              <p className="text-xs text-white/70">{products.length} items available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="container mx-auto px-4 py-4">
        <label className="input input-bordered flex items-center gap-2 bg-base-100">
          <i className="bi bi-search text-base-content/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="grow"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-base-content/30 hover:text-base-content/60">
              <i className="bi bi-x-lg" />
            </button>
          )}
        </label>
      </div>

      {/* Categories */}
      {categories.length > 1 && (
        <div className="container mx-auto px-4 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <i className="bi bi-emoji-frown text-5xl text-base-content/20 block mb-3" />
            <p className="text-base-content/50">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((product, i) => (
              <motion.button
                key={product.id}
                variants={listItem}
                initial="hidden"
                animate="visible"
                custom={i}
                onClick={() => addToCart(product)}
                disabled={product.stockQty === 0}
                className={`card bg-base-100 border-2 p-3 text-left transition-all
                  ${product.stockQty === 0 
                    ? 'opacity-50 cursor-not-allowed border-base-300' 
                    : 'hover:border-primary hover:-translate-y-1 hover:shadow-lg cursor-pointer'}`}
              >
                <div className="font-semibold text-base-content text-sm mb-1 line-clamp-2">
                  {product.name}
                </div>
                <div className="text-lg font-bold text-primary font-mono">
                  {fmt(product.sellingPrice)}
                </div>
                <div className="text-xs text-base-content/40 mt-1">
                  {product.stockQty > 0 ? `${product.stockQty} available` : 'Out of stock'}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-20 right-4 z-40 btn btn-primary rounded-2xl shadow-xl gap-2 px-5"
          >
            <i className="bi bi-cart3" />
            {cartCount} items · {fmt(cartTotal)}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-base-100 rounded-t-2xl shadow-2xl"
              style={{ maxHeight: '85vh' }}
            >
              <div className="w-12 h-1 bg-base-300 rounded-full mx-auto mt-3" />
              
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <h3 className="font-bold text-base-content mb-4 flex items-center gap-2">
                  <i className="bi bi-cart3 text-primary" /> Your Order
                </h3>

                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 py-3 border-b border-base-200">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-xs text-base-content/50">{fmt(item.price)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="btn btn-xs btn-ghost border border-base-300"
                      >−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="btn btn-xs btn-ghost border border-base-300"
                      >+</button>
                    </div>
                    <div className="font-mono font-bold text-primary w-16 text-right">
                      {fmt(item.price * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-base-content/30 hover:text-error"
                    >
                      <i className="bi bi-trash3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-base-200">
                <div className="flex justify-between font-bold text-base mb-4">
                  <span>Total</span>
                  <span className="text-primary font-mono">{fmt(cartTotal)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="btn btn-primary w-full gap-2"
                >
                  <i className="bi bi-bag-check" /> Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}