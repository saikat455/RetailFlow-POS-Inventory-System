import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn, listItem } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

function Toast({ toast }) {
  if (!toast) return null
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
      className={`fixed top-5 right-5 z-[9999] alert text-sm shadow-xl w-auto ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
      {toast.msg}
    </motion.div>
  )
}

function AdminProducts() {
  const [products, setProducts]   = useState([])
  const [branches, setBranches]   = useState([])
  const [search, setSearch]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState(null)
  const [expanded, setExpanded]   = useState(null)
  const [createModal, setCreateModal]     = useState(false)
  const [editModal, setEditModal]         = useState(null)
  const [stockModal, setStockModal]       = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

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
    } catch (err) { showToast(err.response?.data?.message || 'Failed.', 'error') }
  }

  const unassignedBranches = (product) => {
    const assigned = new Set(product.branchStocks?.map(b => b.branchId) || [])
    return branches.filter(b => !assigned.has(b.id))
  }

  return (
    <div className="max-w-[1100px]">
      <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>

      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">Products</h1>
          <p className="text-sm text-base-content/50 mt-0.5">{products.length} products in catalogue · Manage branch stock separately</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn btn-primary gap-2">
          <i className="bi bi-plus-lg" /> Add Product
        </button>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="relative mb-5">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <i className="bi bi-search text-base-content/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or barcode…" className="grow text-sm" />
        </label>
      </motion.div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card bg-base-100 border border-base-300 py-20 text-center">
          <i className="bi bi-box-seam text-5xl text-base-content/20 block mb-3" />
          <p className="text-base-content/50 font-medium mb-4">No products in catalogue yet</p>
          <button onClick={() => setCreateModal(true)} className="btn btn-primary btn-sm gap-2 mx-auto">
            <i className="bi bi-plus-lg" /> Add first product
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((product, i) => (
            <motion.div key={product.id} variants={listItem} initial="hidden" animate="visible" custom={i}
              className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden hover:border-base-content/20 transition-all">

              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(expanded === product.id ? null : product.id)}>
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-box-seam-fill text-primary text-base" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base-content text-sm">{product.name}</span>
                    {product.barcode && (
                      <span className="badge badge-ghost badge-sm font-mono">{product.barcode}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-base-content/50">
                    <span>Buy: <strong className="text-base-content/70">{fmt(product.purchasePrice)}</strong></span>
                    <span>Sell: <strong className="text-primary">{fmt(product.sellingPrice)}</strong></span>
                    <span className="text-success">Profit: {fmt(product.sellingPrice - product.purchasePrice)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0 max-w-[300px]">
                  {product.branchStocks?.length === 0 ? (
                    <span className="badge badge-warning badge-outline text-[11px]">
                      <i className="bi bi-exclamation-circle mr-1" />No branches
                    </span>
                  ) : product.branchStocks?.map(bs => (
                    <span key={bs.branchId}
                      className={`badge badge-sm ${bs.isLowStock ? 'badge-error badge-outline' : 'badge-success badge-outline'}`}>
                      {bs.branchName}: {bs.stockQty}
                    </span>
                  ))}
                </div>

                <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditModal(product)} className="btn btn-xs btn-ghost border border-base-300 text-primary">
                    <i className="bi bi-pencil-fill" />
                  </button>
                  <button onClick={() => setDeleteConfirm(product)} className="btn btn-xs btn-ghost border border-base-300 text-error">
                    <i className="bi bi-trash3-fill" />
                  </button>
                </div>
                <i className={`bi bi-chevron-down text-base-content/30 text-xs transition-transform flex-shrink-0 ${expanded === product.id ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {expanded === product.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                    className="border-t border-base-300 bg-base-200/50 px-5 py-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-base-content/40">Branch Stock</span>
                      {unassignedBranches(product).length > 0 && (
                        <button onClick={() => setStockModal({ product, branch: null, mode: 'assign' })}
                          className="btn btn-xs btn-primary btn-outline gap-1.5">
                          <i className="bi bi-plus-lg" /> Assign to Branch
                        </button>
                      )}
                    </div>

                    {product.branchStocks?.length === 0 ? (
                      <div className="text-center py-4 text-xs text-base-content/40">
                        <i className="bi bi-building text-2xl block mb-1.5 text-base-content/20" />
                        Not assigned to any branch yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {product.branchStocks?.map(bs => (
                          <div key={bs.branchId}
                            className={`flex items-center gap-3 bg-base-100 border rounded-xl px-3.5 py-3
                              ${bs.isLowStock ? 'border-error/30' : 'border-base-300'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                              ${bs.isLowStock ? 'bg-error/10' : 'bg-success/10'}`}>
                              <i className={`bi bi-building-fill text-xs ${bs.isLowStock ? 'text-error' : 'text-success'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-base-content truncate">{bs.branchName}</div>
                              <div className={`text-sm font-black font-mono ${bs.isLowStock ? 'text-error' : 'text-base-content'}`}>
                                {bs.stockQty} units
                                {bs.isLowStock && <span className="text-[10px] font-semibold ml-1 text-error/70">Low</span>}
                              </div>
                              <div className="text-[10px] text-base-content/40">Min: {bs.lowStockThreshold}</div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setStockModal({ product, bs, mode: 'adjust' })}
                                className="btn btn-xs btn-ghost border border-base-300">
                                <i className="bi bi-pencil-fill" />
                              </button>
                              <button onClick={() => handleRemoveFromBranch(product.id, bs.branchId, bs.branchName)}
                                className="btn btn-xs btn-ghost border border-base-300 text-error">
                                <i className="bi bi-x-lg" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {createModal && (
          <ProductFormModal title="Add Product to Catalogue"
            subtitle="After creating, assign stock to each branch separately."
            onClose={() => setCreateModal(false)}
            onSubmit={async (form) => { await api.post('/products', form); showToast('Product added!'); load() }} />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <ProductFormModal title={`Edit "${editModal.name}"`} initial={editModal}
            onClose={() => setEditModal(null)}
            onSubmit={async (form) => { await api.put(`/products/${editModal.id}`, form); showToast('Product updated!'); setEditModal(null); load() }} />
        )}
      </AnimatePresence>

      {/* Stock Modal */}
      <AnimatePresence>
        {stockModal && (
          <StockModal mode={stockModal.mode} product={stockModal.product} bs={stockModal.bs}
            branches={unassignedBranches(stockModal.product)}
            onClose={() => setStockModal(null)}
            onSubmit={async (form) => {
              if (stockModal.mode === 'assign') {
                await api.post('/products/assign-stock', { productId: stockModal.product.id, ...form })
                showToast('Stock assigned!')
              } else {
                await api.put(`/products/${stockModal.product.id}/stock/${stockModal.bs.branchId}`, form)
                showToast('Stock updated!')
              }
              setStockModal(null); load()
            }} />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <ConfirmModal title="Delete Product?"
            message={<>Remove <strong>"{deleteConfirm.name}"</strong> from catalogue and all branches?</>}
            onConfirm={() => handleDelete(deleteConfirm)}
            onClose={() => setDeleteConfirm(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function CashierProducts({ branchId, branchName }) {
  const [products, setProducts] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api.get(`/products?branchId=${branchId}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
      setProducts(r.data)
    } catch {}
    finally { setLoading(false) }
  }, [branchId, search])

  useEffect(() => { load() }, [load])

  const low     = products.filter(p => p.isLowStock)
  const inStock = products.filter(p => !p.isLowStock && p.stockQty > 0)
  const outOf   = products.filter(p => p.stockQty === 0)

  return (
    <div className="max-w-[900px]">
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <h1 className="text-2xl font-bold text-base-content tracking-tight">Products</h1>
        <p className="text-sm text-base-content/50 mt-0.5 flex items-center gap-1.5">
          <i className="bi bi-building text-primary" />{branchName}
          <span className="text-base-content/20">·</span>{products.length} products
          {low.length > 0 && <span className="text-error font-semibold">· {low.length} low stock</span>}
        </p>
      </motion.div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: 'bi-boxes',                         label: 'Total',      value: products.length,            color: 'primary'  },
          { icon: 'bi-check-circle-fill',             label: 'In Stock',   value: inStock.length,             color: 'success'  },
          { icon: 'bi-exclamation-triangle-fill',     label: 'Low / Out',  value: low.length + outOf.length,  color: 'warning'  },
        ].map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-3.5 flex-row items-center gap-3">
              <div className={`w-9 h-9 bg-${s.color}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <i className={`bi ${s.icon} text-${s.color}`} />
              </div>
              <div>
                <div className="text-xs text-base-content/50 font-semibold">{s.label}</div>
                <div className={`text-xl font-black font-mono text-${s.color}`}>{s.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="relative mb-4">
        <label className="input input-bordered flex items-center gap-2 w-full">
          <i className="bi bi-search text-base-content/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search product or barcode…" className="grow text-sm" />
        </label>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card bg-base-100 border border-base-300 py-16 text-center text-base-content/40">
          <i className="bi bi-box-seam text-4xl text-base-content/20 block mb-2" />
          No products assigned to your branch
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {products.map((p, i) => (
            <motion.div key={p.id} variants={listItem} initial="hidden" animate="visible" custom={i}
              className={`card bg-base-100 border-2 p-4 flex flex-col gap-2 transition-all hover:shadow-md
                ${p.stockQty === 0 ? 'border-base-300 opacity-60' :
                  p.isLowStock    ? 'border-error/30' :
                  'border-base-300 hover:border-primary/30'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-bold text-base-content leading-tight">{p.name}</div>
                {p.barcode && <span className="badge badge-ghost badge-xs font-mono flex-shrink-0">{p.barcode}</span>}
              </div>
              <div className="text-lg font-black font-mono text-primary">{fmt(p.sellingPrice)}</div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold mt-auto
                ${p.stockQty === 0 ? 'text-base-content/40' : p.isLowStock ? 'text-error' : 'text-success'}`}>
                <i className={`bi ${p.stockQty === 0 ? 'bi-x-circle' : p.isLowStock ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} text-xs`} />
                {p.stockQty === 0 ? 'Out of stock' : `${p.stockQty} in stock`}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Shared Modals ── */
function ProductFormModal({ title, subtitle, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: initial?.name || '', barcode: initial?.barcode || '',
    purchasePrice: initial?.purchasePrice || '', sellingPrice: initial?.sellingPrice || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const margin = form.sellingPrice && form.purchasePrice
    ? (((form.sellingPrice - form.purchasePrice) / form.sellingPrice) * 100).toFixed(1) : null

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await onSubmit({ ...form, purchasePrice: parseFloat(form.purchasePrice), sellingPrice: parseFloat(form.sellingPrice) })
      onClose()
    } catch (err) { setError(err.response?.data?.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="card bg-base-100 w-full max-w-[500px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="card-body p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold text-base-content text-base">{title}</h3>
              {subtitle && <p className="text-xs text-base-content/50 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-square"><i className="bi bi-x-lg" /></button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                className="alert alert-error text-sm py-2.5 mt-2">
                <i className="bi bi-exclamation-circle-fill" />{error}
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
            <div className="form-control">
              <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Product Name *</span></label>
              <input value={form.name} onChange={set('name')} required placeholder="e.g. Coca Cola 250ml" className="input input-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Barcode</span></label>
              <input value={form.barcode} onChange={set('barcode')} placeholder="Optional" className="input input-bordered w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Purchase Price *</span></label>
                <input type="number" step="0.01" min="0" value={form.purchasePrice} onChange={set('purchasePrice')} required placeholder="0.00" className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Selling Price *</span></label>
                <input type="number" step="0.01" min="0" value={form.sellingPrice} onChange={set('sellingPrice')} required placeholder="0.00" className="input input-bordered w-full" />
              </div>
            </div>
            {margin && (
              <div className="alert alert-success text-xs py-2">
                <i className="bi bi-graph-up-arrow" />
                Margin: {margin}% · Profit per unit: {fmt(form.sellingPrice - form.purchasePrice)}
              </div>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={onClose} className="btn btn-ghost border border-base-300">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary gap-2">
                {loading ? <><span className="loading loading-spinner loading-sm" /> Saving…</> : <><i className="bi bi-check-lg" /> Save</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
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
    <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="card bg-base-100 w-full max-w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="card-body p-6">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="font-bold text-base-content text-base">
                {mode === 'assign' ? 'Assign to Branch' : 'Adjust Stock'}
              </h3>
              <p className="text-xs text-base-content/50 mt-0.5">{product.name}</p>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm btn-square"><i className="bi bi-x-lg" /></button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                className="alert alert-error text-sm py-2.5 mt-2">
                <i className="bi bi-exclamation-circle-fill" />{error}
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-3">
            {mode === 'assign' && (
              <div className="form-control">
                <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Branch *</span></label>
                <select value={form.branchId} onChange={e => setForm(f => ({...f, branchId: e.target.value}))} required className="select select-bordered w-full">
                  <option value="">Select branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            {mode === 'adjust' && (
              <div className="flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                <i className="bi bi-building-fill text-primary" />
                <span className="text-sm font-bold text-primary">{bs.branchName}</span>
                <span className="ml-auto text-xs text-primary/60">Current: {bs.stockQty} units</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Stock Qty *</span></label>
                <input type="number" min="0" value={form.stockQty}
                  onChange={e => setForm(f => ({...f, stockQty: e.target.value}))} required className="input input-bordered w-full" />
              </div>
              <div className="form-control">
                <label className="label pb-1.5"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Low Stock Alert</span></label>
                <input type="number" min="0" value={form.lowStockThreshold}
                  onChange={e => setForm(f => ({...f, lowStockThreshold: e.target.value}))} className="input input-bordered w-full" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-1">
              <button type="button" onClick={onClose} className="btn btn-ghost border border-base-300">Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary gap-2">
                {loading ? <><span className="loading loading-spinner loading-sm" /> Saving…</> :
                  <><i className="bi bi-check-lg" /> {mode === 'assign' ? 'Assign Stock' : 'Update Stock'}</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  )
}

function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="card bg-base-100 w-full max-w-[380px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="card-body p-6 text-center">
          <div className="w-14 h-14 bg-error/10 border-2 border-error/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-trash3-fill text-error text-2xl" />
          </div>
          <h3 className="font-bold text-base-content text-base mb-1">{title}</h3>
          <p className="text-sm text-base-content/50 mb-5">{message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn flex-1 btn-ghost border border-base-300">Cancel</button>
            <button onClick={onConfirm} className="btn btn-error flex-1 gap-2">
              <i className="bi bi-trash3-fill" />Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Products() {
  const { user } = useAuth()
  if (!user?.isAdmin) return <CashierProducts branchId={user.branchId} branchName={user.branchName} />
  return <AdminProducts />
}