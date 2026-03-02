import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Products.css'

const emptyForm = { name: '', barcode: '', purchasePrice: '', sellingPrice: '', stockQty: '', lowStockThreshold: 5 }

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchProducts = async (q = '') => {
    setLoading(true)
    try {
      const res = await api.get('/products', { params: { search: q } })
      setProducts(res.data)
    } catch {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    fetchProducts(e.target.value)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setFormError('')
    setEditTarget(null)
    setModal('create')
  }

  const openEdit = (p) => {
    setForm({
      name: p.name,
      barcode: p.barcode || '',
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      stockQty: p.stockQty,
      lowStockThreshold: p.lowStockThreshold,
    })
    setFormError('')
    setEditTarget(p)
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditTarget(null) }

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      purchasePrice: parseFloat(form.purchasePrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stockQty: parseInt(form.stockQty),
      lowStockThreshold: parseInt(form.lowStockThreshold),
    }

    try {
      if (modal === 'create') {
        await api.post('/products', payload)
        showToast('Product created successfully!')
      } else {
        await api.put(`/products/${editTarget.id}`, payload)
        showToast('Product updated successfully!')
      }
      closeModal()
      fetchProducts(search)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`)
      showToast('Product deleted.')
      setDeleteId(null)
      fetchProducts(search)
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      setDeleteId(null)
    }
  }

  const margin = (p) => {
    if (!p.purchasePrice) return '—'
    const pct = ((p.sellingPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(1)
    return `${pct}%`
  }

  return (
    <div className="products-page">
      {/* Toast */}
      {toast && (
        <div className={`toast-msg toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} products in inventory</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="search-icon">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or barcode..."
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="table-loading">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton-row" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon">📦</div>
            <div className="empty-text">No products found</div>
            {isAdmin && <button className="btn btn-primary" onClick={openCreate}>Add your first product</button>}
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Barcode</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Margin</th>
                <th>Stock</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className={p.isLowStock ? 'row-warning' : ''}>
                  <td className="td-num">{i + 1}</td>
                  <td className="td-name">{p.name}</td>
                  <td className="td-mono">{p.barcode || <span className="text-muted">—</span>}</td>
                  <td className="td-mono">৳{p.purchasePrice.toFixed(2)}</td>
                  <td className="td-mono td-sell">৳{p.sellingPrice.toFixed(2)}</td>
                  <td className="td-mono">{margin(p)}</td>
                  <td className="td-mono">{p.stockQty}</td>
                  <td>
                    {p.stockQty === 0
                      ? <span className="badge badge-red">Out of stock</span>
                      : p.isLowStock
                        ? <span className="badge badge-yellow">Low stock</span>
                        : <span className="badge badge-green">In stock</span>
                    }
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'create' ? 'Add New Product' : 'Edit Product'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} required placeholder="e.g. Coca Cola 1L" />
                </div>
                <div className="form-group">
                  <label>Barcode</label>
                  <input name="barcode" value={form.barcode} onChange={handleFormChange} placeholder="e.g. 5000112637922" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Price (৳) *</label>
                  <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleFormChange} required min="0" step="0.01" placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Selling Price (৳) *</label>
                  <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleFormChange} required min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input type="number" name="stockQty" value={form.stockQty} onChange={handleFormChange} required min="0" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleFormChange} min="0" />
                </div>
              </div>

              {/* Live margin preview */}
              {form.purchasePrice && form.sellingPrice && (
                <div className="margin-preview">
                  Margin: <strong>৳{(parseFloat(form.sellingPrice||0) - parseFloat(form.purchasePrice||0)).toFixed(2)}</strong>
                  &nbsp;({((parseFloat(form.sellingPrice||0) - parseFloat(form.purchasePrice||0)) / parseFloat(form.purchasePrice||1) * 100).toFixed(1)}%)
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : modal === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm">
              <div className="delete-icon">🗑️</div>
              <h3>Delete Product?</h3>
              <p>This action cannot be undone. Products with sales history cannot be deleted.</p>
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
