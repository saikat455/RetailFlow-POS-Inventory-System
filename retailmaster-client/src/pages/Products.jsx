import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border
      ${toast.type === 'success'
        ? 'bg-white text-green-700 border-green-100 shadow-green-100/60'
        : 'bg-white text-red-600  border-red-100  shadow-red-100/60'}`}
      style={{ animation: 'slideIn .2s ease' }}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-green-500' : 'bi-exclamation-circle-fill text-red-400'}`} />
      {toast.msg}
    </div>
  )
}

const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all font-[inherit]
  bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-100 text-gray-800`

/* ══════════════════════════════════════════════════════════════
   ADMIN PRODUCTS PAGE
   - Catalogue list with per-branch stock badges
   - Create product, assign stock to branches, adjust stock
══════════════════════════════════════════════════════════════ */
function AdminProducts() {
  const [products, setProducts]     = useState([])
  const [branches, setBranches]     = useState([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState(null)
  const [expanded, setExpanded]     = useState(null) // expanded product id

  // Modals
  const [createModal, setCreateModal]       = useState(false)
  const [editModal, setEditModal]           = useState(null)   // product
  const [stockModal, setStockModal]         = useState(null)   // { product, branch? }
  const [deleteConfirm, setDeleteConfirm]   = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pr, br] = await Promise.all([
        api.get(`/products/catalogue${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        api.get('/branches'),
      ])
      setProducts(pr.data); setBranches(br.data)
    } catch { showToast('Failed to load products.', 'error') }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (product) => {
    try {
      await api.delete(`/products/${product.id}`)
      showToast(`"${product.name}" deleted from catalogue.`)
      setDeleteConfirm(null); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      setDeleteConfirm(null)
    }
  }

  const handleRemoveFromBranch = async (productId, branchId, branchName) => {
    try {
      await api.delete(`/products/${productId}/branch/${branchId}`)
      showToast(`Removed from ${branchName}.`); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed.', 'error')
    }
  }

  // Branches not yet assigned to this product
  const unassignedBranches = (product) => {
    const assigned = new Set(product.branchStocks?.map(b => b.branchId) || [])
    return branches.filter(b => !assigned.has(b.id))
  }

  return (
    <div className="max-w-[1100px]">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {products.length} products in catalogue · Manage branch stock separately
          </p>
        </div>
        <button onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold
            transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 cursor-pointer border-0 font-[inherit]">
          <i className="bi bi-plus-lg" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or barcode…"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none
            focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all font-[inherit]" />
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <i className="bi bi-box-seam text-5xl text-gray-200 block mb-3" />
          <p className="text-gray-400 font-medium mb-4">No products in catalogue yet</p>
          <button onClick={() => setCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
            <i className="bi bi-plus-lg" /> Add first product
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map(product => (
            <div key={product.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-gray-200">

              {/* Product row */}
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(expanded === product.id ? null : product.id)}>

                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-box-seam-fill text-blue-400 text-base" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{product.name}</span>
                    {product.barcode && (
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{product.barcode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span>Buy: <strong className="text-gray-600">{fmt(product.purchasePrice)}</strong></span>
                    <span>Sell: <strong className="text-blue-500">{fmt(product.sellingPrice)}</strong></span>
                    <span className="text-green-500">Profit: {fmt(product.sellingPrice - product.purchasePrice)}</span>
                  </div>
                </div>

                {/* Branch stock badges */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0 max-w-[300px]">
                  {product.branchStocks?.length === 0 ? (
                    <span className="text-[11px] text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg font-semibold">
                      <i className="bi bi-exclamation-circle mr-1" />No branches assigned
                    </span>
                  ) : product.branchStocks?.map(bs => (
                    <span key={bs.branchId}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1
                        ${bs.isLowStock
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-green-50 text-green-700 border-green-100'}`}>
                      <i className={`bi ${bs.isLowStock ? 'bi-exclamation-triangle-fill' : 'bi-building'} text-[9px]`} />
                      {bs.branchName}: {bs.stockQty}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditModal(product)} title="Edit"
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all cursor-pointer border-0 text-xs">
                    <i className="bi bi-pencil-fill" />
                  </button>
                  <button onClick={() => setDeleteConfirm(product)} title="Delete"
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer border-0 text-xs">
                    <i className="bi bi-trash3-fill" />
                  </button>
                </div>

                <i className={`bi bi-chevron-down text-gray-300 text-xs transition-transform flex-shrink-0 ${expanded === product.id ? 'rotate-180' : ''}`} />
              </div>

              {/* Expanded: branch stock detail */}
              {expanded === product.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Branch Stock</span>
                    {unassignedBranches(product).length > 0 && (
                      <button onClick={() => setStockModal({ product, branch: null, mode: 'assign' })}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white
                          border border-blue-100 hover:border-blue-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer font-[inherit]">
                        <i className="bi bi-plus-lg" /> Assign to Branch
                      </button>
                    )}
                  </div>

                  {product.branchStocks?.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400">
                      <i className="bi bi-building text-2xl block mb-1.5 text-gray-200" />
                      Not assigned to any branch yet.
                      <br />Click "Assign to Branch" to add stock.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {product.branchStocks?.map(bs => (
                        <div key={bs.branchId}
                          className={`flex items-center gap-3 bg-white border rounded-xl px-3.5 py-3
                            ${bs.isLowStock ? 'border-red-100' : 'border-gray-100'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                            ${bs.isLowStock ? 'bg-red-50' : 'bg-green-50'}`}>
                            <i className={`bi bi-building-fill text-xs ${bs.isLowStock ? 'text-red-400' : 'text-green-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-700 truncate">{bs.branchName}</div>
                            <div className={`text-sm font-black font-mono ${bs.isLowStock ? 'text-red-500' : 'text-gray-800'}`}>
                              {bs.stockQty} units
                              {bs.isLowStock && <span className="text-[10px] font-semibold ml-1 text-red-400">Low stock</span>}
                            </div>
                            <div className="text-[10px] text-gray-400">Min: {bs.lowStockThreshold}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setStockModal({ product, bs, mode: 'adjust' })}
                              title="Adjust stock"
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-500 flex items-center justify-center text-xs transition-all cursor-pointer border-0">
                              <i className="bi bi-pencil-fill" />
                            </button>
                            <button
                              onClick={() => handleRemoveFromBranch(product.id, bs.branchId, bs.branchName)}
                              title="Remove from branch"
                              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 flex items-center justify-center text-xs transition-all cursor-pointer border-0">
                              <i className="bi bi-x-lg" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {createModal && (
        <ProductFormModal
          title="Add Product to Catalogue"
          subtitle="After creating, assign stock to each branch separately."
          onClose={() => setCreateModal(false)}
          onSubmit={async (form) => {
            await api.post('/products', form)
            showToast('Product added to catalogue!'); load()
          }}
        />
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <ProductFormModal
          title={`Edit "${editModal.name}"`}
          initial={editModal}
          onClose={() => setEditModal(null)}
          onSubmit={async (form) => {
            await api.put(`/products/${editModal.id}`, form)
            showToast('Product updated!'); setEditModal(null); load()
          }}
        />
      )}

      {/* ── Stock Modal (assign or adjust) ── */}
      {stockModal && (
        <StockModal
          mode={stockModal.mode}
          product={stockModal.product}
          bs={stockModal.bs}
          branches={unassignedBranches(stockModal.product)}
          onClose={() => setStockModal(null)}
          onSubmit={async (form) => {
            if (stockModal.mode === 'assign') {
              await api.post('/products/assign-stock', {
                productId: stockModal.product.id, ...form
              })
              showToast(`Stock assigned!`)
            } else {
              await api.put(`/products/${stockModal.product.id}/stock/${stockModal.bs.branchId}`, form)
              showToast('Stock updated!')
            }
            setStockModal(null); load()
          }}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Product?"
          message={<>Remove <strong>"{deleteConfirm.name}"</strong> from catalogue and all branches?</>}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
      <style>{`
        @keyframes popIn  { from { transform: scale(.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideIn{ from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   CASHIER PRODUCTS PAGE
   - Reads only their branch's products (with branch stock)
   - Read-only view, no add/edit/delete
══════════════════════════════════════════════════════════════ */
function CashierProducts({ branchId, branchName }) {
  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/products?branchId=${branchId}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      setProducts(r.data)
    } catch { }
    finally { setLoading(false) }
  }, [branchId, search])

  useEffect(() => { load() }, [load])

  const low    = products.filter(p => p.isLowStock)
  const inStock = products.filter(p => !p.isLowStock && p.stockQty > 0)
  const outOf   = products.filter(p => p.stockQty === 0)

  return (
    <div className="max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
        <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
          <i className="bi bi-building text-blue-400" />{branchName}
          <span className="text-gray-300">·</span>{products.length} products
          {low.length > 0 && <span className="text-red-400 font-semibold">· {low.length} low stock</span>}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: 'bi-boxes',            label: 'Total',     value: products.length, color: 'blue'   },
          { icon: 'bi-check-circle-fill',label: 'In Stock',  value: inStock.length,  color: 'green'  },
          { icon: 'bi-exclamation-triangle-fill', label: 'Low / Out', value: low.length + outOf.length, color: 'amber' },
        ].map(s => {
          const c = { blue: ['bg-blue-50','text-blue-500','text-blue-700'], green: ['bg-green-50','text-green-500','text-green-700'], amber: ['bg-amber-50','text-amber-500','text-amber-700'] }[s.color]
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 ${c[0]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <i className={`bi ${s.icon} ${c[1]}`} />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-semibold">{s.label}</div>
                <div className={`text-xl font-black font-mono ${c[2]}`}>{s.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search product or barcode…"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-white outline-none
            focus:border-blue-500 focus:ring-3 focus:ring-blue-100 transition-all font-[inherit]" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
          <i className="bi bi-box-seam text-4xl text-gray-200 block mb-2" />
          No products assigned to your branch
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map(p => (
            <div key={p.id}
              className={`bg-white rounded-2xl border-2 p-4 flex flex-col gap-2 transition-all hover:shadow-md
                ${p.stockQty === 0 ? 'border-gray-100 opacity-60' :
                  p.isLowStock    ? 'border-red-100' :
                  'border-gray-100 hover:border-blue-200'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-gray-800 leading-tight">{p.name}</div>
                {p.barcode && (
                  <span className="text-[9px] font-mono bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">{p.barcode}</span>
                )}
              </div>
              <div className="text-lg font-black font-mono text-blue-500">{fmt(p.sellingPrice)}</div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold mt-auto
                ${p.stockQty === 0 ? 'text-gray-400' : p.isLowStock ? 'text-red-500' : 'text-green-600'}`}>
                <i className={`bi ${p.stockQty === 0 ? 'bi-x-circle' : p.isLowStock ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} text-xs`} />
                {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} in stock`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Shared sub-components ── */

function ProductFormModal({ title, subtitle, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: initial?.name || '', barcode: initial?.barcode || '',
    purchasePrice: initial?.purchasePrice || '', sellingPrice: initial?.sellingPrice || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const margin = form.sellingPrice && form.purchasePrice
    ? (((form.sellingPrice - form.purchasePrice) / form.sellingPrice) * 100).toFixed(1)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await onSubmit({ ...form, purchasePrice: parseFloat(form.purchasePrice), sellingPrice: parseFloat(form.sellingPrice) })
      onClose()
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl" style={{animation:'popIn .18s ease'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-0">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent text-base"><i className="bi bi-x-lg" /></button>
        </div>
        {error && <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Product Name *</label>
            <input value={form.name} onChange={set('name')} required placeholder="e.g. Coca Cola 250ml" className={inputCls} />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Barcode</label>
            <input value={form.barcode} onChange={set('barcode')} placeholder="Optional" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Purchase Price *</label>
              <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={set('purchasePrice')} required placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Selling Price *</label>
              <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={set('sellingPrice')} required placeholder="0.00" className={inputCls} />
            </div>
          </div>
          {margin && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700 font-semibold">
              <i className="bi bi-graph-up-arrow text-green-500" />
              Profit margin: {margin}% · Profit per unit: {fmt(form.sellingPrice - form.purchasePrice)}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
              {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving...</> : <><i className="bi bi-check-lg" /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockModal({ mode, product, bs, branches, onClose, onSubmit }) {
  const [form, setForm] = useState({
    branchId: bs?.branchId || branches[0]?.id || '',
    stockQty: bs?.stockQty ?? 0,
    lowStockThreshold: bs?.lowStockThreshold ?? 5,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await onSubmit({ ...form, branchId: parseInt(form.branchId), stockQty: parseInt(form.stockQty), lowStockThreshold: parseInt(form.lowStockThreshold) })
      onClose()
    } catch (err) { setError(err.response?.data?.message || 'Failed.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl" style={{animation:'popIn .18s ease'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-0">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              {mode === 'assign' ? 'Assign to Branch' : `Adjust Stock`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent text-base"><i className="bi bi-x-lg" /></button>
        </div>
        {error && <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-lg"><i className="bi bi-exclamation-circle-fill" />{error}</div>}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {mode === 'assign' && (
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Branch *</label>
              <select value={form.branchId} onChange={e => setForm(f => ({...f, branchId: e.target.value}))} required
                className={`${inputCls} cursor-pointer`}>
                <option value="">Select branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {mode === 'adjust' && (
            <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <i className="bi bi-building-fill text-blue-400" />
              <span className="text-sm font-bold text-blue-700">{bs.branchName}</span>
              <span className="ml-auto text-xs text-blue-400">Current: {bs.stockQty} units</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Stock Qty *</label>
              <input type="number" min="0" value={form.stockQty}
                onChange={e => setForm(f => ({...f, stockQty: e.target.value}))}
                required className={inputCls} />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Low Stock Alert</label>
              <input type="number" min="0" value={form.lowStockThreshold}
                onChange={e => setForm(f => ({...f, lowStockThreshold: e.target.value}))}
                className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
              {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving...</> : <><i className="bi bi-check-lg" /> {mode === 'assign' ? 'Assign Stock' : 'Update Stock'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl overflow-hidden" style={{animation:'popIn .18s ease'}} onClick={e=>e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-trash3-fill text-red-500 text-2xl" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
          <p className="text-sm text-gray-400 mb-5">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">Cancel</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
              <i className="bi bi-trash3-fill mr-2" />Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main export: routes to Admin or Cashier view ── */
export default function Products() {
  const { user } = useAuth()
  if (!user?.isAdmin) {
    return <CashierProducts branchId={user.branchId} branchName={user.branchName} />
  }
  return <AdminProducts />
}