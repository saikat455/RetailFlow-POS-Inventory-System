import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const emptyForm = {
  name: '', barcode: '', purchasePrice: '', sellingPrice: '',
  stockQty: '', lowStockThreshold: 5,
}

function Toast({ toast }) {
  if (!toast) return null
  const colors = {
    success: 'bg-green-50 text-green-700 border border-green-200',
    error: 'bg-red-50 text-red-600 border border-red-200',
  }
  return (
    <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg animate-[slideIn_0.2s_ease] ${colors[toast.type]}`}>
      {toast.type === 'success' ? <i className="bi bi-check-circle-fill mr-2" /> : <i className="bi bi-exclamation-circle-fill mr-2" />}
      {toast.msg}
    </div>
  )
}

function StatusBadge({ product }) {
  if (product.stockQty === 0)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-500 border border-red-100"><i className="bi bi-x-circle-fill" /> Out of stock</span>
  if (product.isLowStock)
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100"><i className="bi bi-exclamation-triangle-fill" /> Low stock</span>
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100"><i className="bi bi-check-circle-fill" /> In stock</span>
}

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
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
    setForm(emptyForm); setFormError(''); setEditTarget(null); setModal('create')
  }
  const openEdit = (p) => {
    setForm({ name: p.name, barcode: p.barcode || '', purchasePrice: p.purchasePrice, sellingPrice: p.sellingPrice, stockQty: p.stockQty, lowStockThreshold: p.lowStockThreshold })
    setFormError(''); setEditTarget(p); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditTarget(null) }

  const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
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
      closeModal(); fetchProducts(search)
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget.id}`)
      showToast(`"${deleteTarget.name}" moved to trash.`)
      setDeleteTarget(null); fetchProducts(search)
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      setDeleteTarget(null)
    }
  }

  const margin = (p) => {
    if (!p.purchasePrice) return '—'
    return `${((p.sellingPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(1)}%`
  }

  const liveMargin = () => {
    const buy = parseFloat(form.purchasePrice), sell = parseFloat(form.sellingPrice)
    if (!buy || !sell || buy <= 0) return null
    return { diff: (sell - buy).toFixed(2), pct: ((sell - buy) / buy * 100).toFixed(1) }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-[inherit]"

  return (
    <div className="max-w-[1100px]">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products in inventory</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-[9px] text-sm font-semibold transition-colors cursor-pointer border-0">
            <i className="bi bi-plus-lg" /> Add Product
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          type="text" value={search} onChange={handleSearch}
          placeholder="Search by name or barcode..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-[inherit]"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-11 rounded-lg bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <i className="bi bi-box-seam text-4xl text-gray-300" />
            <p className="text-gray-400 text-sm">No products found</p>
            {isAdmin && (
              <button onClick={openCreate}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold border-0 cursor-pointer hover:bg-blue-600 transition-colors">
                <i className="bi bi-plus-lg" /> Add first product
              </button>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['#','Product','Barcode','Buy Price','Sell Price','Margin','Stock','Status', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors ${p.isLowStock ? 'bg-amber-50/40' : 'hover:bg-gray-50/60'}`}>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.barcode || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">৳{p.purchasePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-green-600">৳{p.sellingPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{margin(p)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.stockQty}</td>
                  <td className="px-4 py-3"><StatusBadge product={p} /></td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Edit button — Bootstrap pencil icon */}
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit product"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all cursor-pointer text-sm"
                        >
                          <i className="bi bi-pencil-fill" />
                        </button>
                        {/* Delete button — Bootstrap trash icon */}
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Delete product (soft)"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer text-sm"
                        >
                          <i className="bi bi-trash3-fill" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-[540px] shadow-2xl animate-[popIn_0.2s_ease]"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <h3 className="text-base font-bold text-gray-900">
                {modal === 'create'
                  ? <><i className="bi bi-plus-circle-fill text-blue-500 mr-2" />Add New Product</>
                  : <><i className="bi bi-pencil-fill text-blue-500 mr-2" />Edit Product</>
                }
              </h3>
              <button onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent text-base transition-colors">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
                <i className="bi bi-exclamation-circle-fill mr-2" />{formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Product Name *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} required placeholder="e.g. Coca Cola 1L" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Barcode</label>
                  <input name="barcode" value={form.barcode} onChange={handleFormChange} placeholder="e.g. 5000112637922" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Purchase Price (৳) *</label>
                  <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleFormChange} required min="0" step="0.01" placeholder="0.00" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Selling Price (৳) *</label>
                  <input type="number" name="sellingPrice" value={form.sellingPrice} onChange={handleFormChange} required min="0" step="0.01" placeholder="0.00" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Stock Quantity *</label>
                  <input type="number" name="stockQty" value={form.stockQty} onChange={handleFormChange} required min="0" placeholder="0" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Low Stock Threshold</label>
                  <input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleFormChange} min="0" className={inputCls} />
                </div>
              </div>

              {/* Live margin preview */}
              {liveMargin() && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-sm px-4 py-2.5 rounded-lg font-medium">
                  <i className="bi bi-graph-up-arrow" />
                  Margin: <strong>৳{liveMargin().diff}</strong>&nbsp;({liveMargin().pct}%)
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent transition-colors font-[inherit]">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold cursor-pointer border-0 transition-colors font-[inherit]">
                  {formLoading
                    ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving...</>
                    : modal === 'create'
                      ? <><i className="bi bi-plus-lg" /> Create Product</>
                      : <><i className="bi bi-check-lg" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Soft Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl animate-[popIn_0.2s_ease] overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Red header strip */}
            <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="bi bi-trash3-fill text-red-500 text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Delete Product?</h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                <strong className="text-gray-800">"{deleteTarget.name}"</strong> will be hidden from the system.
                <br />
                <span className="text-xs text-gray-400 mt-1 inline-block">
                  <i className="bi bi-info-circle mr-1" />
                  The record is kept in the database (soft delete) and can be restored if needed.
                </span>
              </p>
            </div>

            <div className="flex gap-2 px-6 pb-5">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent transition-colors font-[inherit]">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold cursor-pointer border-0 transition-colors font-[inherit]">
                <i className="bi bi-trash3-fill" /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(16px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes popIn  { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}