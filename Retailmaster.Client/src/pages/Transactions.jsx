import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn, listItem } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

export default function Transactions() {
  const { user } = useAuth()

  const [sales, setSales]       = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [detail, setDetail]     = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [from, setFrom]               = useState(today)
  const [to, setTo]                   = useState(today)
  const [branchFilter, setBranchFilter] = useState('')
  const [search, setSearch]           = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (user?.isAdmin) api.get('/branches').then(r => setBranches(r.data)).catch(() => {})
  }, [user])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ take: 200 })
      if (user?.isAdmin && branchFilter) params.append('branchId', branchFilter)
      const r = await api.get(`/sales/recent?${params}`)
      let data = r.data
      if (from) data = data.filter(s => new Date(s.saleDate) >= new Date(from))
      if (to)   data = data.filter(s => new Date(s.saleDate) <= new Date(to + 'T23:59:59'))
      if (search) {
        const q = search.toLowerCase()
        data = data.filter(s =>
          s.invoiceNo.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          s.cashierName.toLowerCase().includes(q))
      }
      setSales(data)
    } catch { showToast('Failed to load transactions.', 'error') }
    finally { setLoading(false) }
  }, [from, to, branchFilter, search, user])

  useEffect(() => { load() }, [load])

  const openDetail = async (sale) => {
    setDetailLoading(true); setDetail(sale)
    try { const r = await api.get(`/sales/${sale.id}`); setDetail(r.data) }
    catch {}
    finally { setDetailLoading(false) }
  }

  const totalRevenue = sales.reduce((s, t) => s + t.finalAmount, 0)
  const totalProfit  = sales.reduce((s, t) => s + (t.totalProfit || 0), 0)

  return (
    <div className="max-w-[1100px]">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
            className={`fixed top-5 right-5 z-[9999] alert text-sm shadow-xl w-auto ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content tracking-tight">Transactions</h1>
          <p className="text-sm text-base-content/50 mt-0.5 flex items-center gap-1.5">
            {user?.isAdmin ? 'All branches' : <><i className="bi bi-building text-primary" />{user?.branchName}</>}
            <span className="text-base-content/20">·</span>{sales.length} transactions
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="card bg-base-100 border border-base-300 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {[
            { label: 'From', type: 'date', value: from, onChange: setFrom },
            { label: 'To',   type: 'date', value: to,   onChange: setTo   },
          ].map(f => (
            <div key={f.label} className="form-control">
              <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-wide">{f.label}</span></label>
              <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)}
                className="input input-bordered input-sm" />
            </div>
          ))}
          {user?.isAdmin && branches.length > 0 && (
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Branch</span></label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="select select-bordered select-sm">
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-control flex-1 min-w-[200px]">
            <label className="label py-1"><span className="label-text text-[11px] font-bold uppercase tracking-wide">Search</span></label>
            <label className="input input-bordered input-sm flex items-center gap-2">
              <i className="bi bi-search text-base-content/30 text-xs" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Invoice, customer, cashier…" className="grow text-sm" />
            </label>
          </div>
        </div>
      </motion.div>

      {/* Summary cards */}
      {!loading && sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { icon: 'bi-receipt',        label: 'Transactions', value: sales.length,      mono: false, color: 'text-primary',   bg: 'bg-primary/10'   },
            { icon: 'bi-currency-dollar',label: 'Revenue',      value: fmt(totalRevenue), mono: true,  color: 'text-secondary', bg: 'bg-secondary/10' },
            { icon: 'bi-graph-up-arrow', label: 'Profit',       value: fmt(totalProfit),  mono: true,  color: 'text-success',   bg: 'bg-success/10'   },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}
              className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-4 flex-row items-center gap-3">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`bi ${s.icon} ${s.color}`} />
                </div>
                <div>
                  <div className="text-xs text-base-content/50 font-semibold">{s.label}</div>
                  <div className={`text-xl font-black ${s.mono ? 'font-mono' : ''} ${s.color}`}>{s.value}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Table */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
        className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-base-content/50 text-sm">
            <span className="loading loading-spinner loading-md text-primary block mx-auto mb-2" />Loading…
          </div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center text-base-content/40">
            <i className="bi bi-receipt-cutoff text-5xl block mb-3 text-base-content/20" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm mt-1">Try adjusting the date range or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  {['Invoice','Date & Time','Branch','Cashier','Customer','Items','Total','Profit',''].map(h => (
                    <th key={h} className="text-[11px] font-bold uppercase tracking-wide text-base-content/50 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((tx, i) => (
                  <motion.tr key={tx.id} variants={listItem} initial="hidden" animate="visible" custom={i}
                    className="hover cursor-pointer" onClick={() => openDetail(tx)}>
                    <td><span className="badge badge-primary badge-outline font-mono text-xs">{tx.invoiceNo}</span></td>
                    <td className="whitespace-nowrap">
                      <div className="text-xs font-semibold">{new Date(tx.saleDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-base-content/40">{new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="text-xs whitespace-nowrap"><i className="bi bi-building text-base-content/30 mr-1 text-[10px]" />{tx.branchName}</td>
                    <td className="text-xs">{tx.cashierName}</td>
                    <td className="text-xs text-base-content/50">{tx.customerName || <span className="italic text-base-content/30">Walk-in</span>}</td>
                    <td className="text-xs text-center">{tx.items?.length ?? '—'}</td>
                    <td className="text-xs font-mono font-bold">{fmt(tx.finalAmount)}</td>
                    <td className="text-xs font-mono text-success">{fmt(tx.totalProfit)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <button onClick={() => window.open(`/invoice/${tx.invoiceNo}`, '_blank')}
                        className="btn btn-xs btn-ghost border border-base-300">
                        <i className="bi bi-receipt" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
            onClick={() => setDetail(null)}>
            <div className="card bg-base-100 w-full max-w-[520px] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="bg-neutral px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-white font-bold text-base">{detail.invoiceNo}</div>
                    <div className="text-white/40 text-xs mt-0.5 flex items-center gap-2">
                      <span><i className="bi bi-building mr-1" />{detail.branchName}</span>
                      <span>·</span>
                      <span>{new Date(detail.saleDate).toLocaleString()}</span>
                    </div>
                    <div className="text-white/30 text-xs mt-0.5">
                      Cashier: {detail.cashierName}
                      {detail.customerName && <> · Customer: {detail.customerName}</>}
                    </div>
                  </div>
                  <button onClick={() => setDetail(null)} className="btn btn-ghost btn-sm btn-square text-white/40">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="p-8 text-center text-base-content/50 text-sm">
                  <span className="loading loading-spinner loading-md block mx-auto mb-2" />Loading items…
                </div>
              ) : (
                <>
                  <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
                    <div className="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold uppercase text-base-content/40 pb-2 mb-1 border-b border-base-300">
                      <span>Product</span><span className="text-center pr-4">Qty</span><span className="text-right pr-4">Price</span><span className="text-right">Total</span>
                    </div>
                    {detail.items?.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] text-xs py-2 border-b border-base-200 last:border-0 items-center">
                        <span className="font-medium text-base-content truncate pr-3">{item.productName}</span>
                        <span className="text-base-content/50 text-center pr-4 font-mono">{item.quantity}</span>
                        <span className="text-base-content/50 text-right pr-4 font-mono">{fmt(item.unitPrice)}</span>
                        <span className="font-semibold text-base-content text-right font-mono">{fmt(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-6 pb-2 border-t border-base-300 pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm text-base-content/60">
                      <span>Subtotal</span><span className="font-mono">{fmt(detail.totalAmount)}</span>
                    </div>
                    {detail.discount > 0 && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount</span><span className="font-mono">−{fmt(detail.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-base-300 pt-2 mt-1">
                      <span>Total</span><span className="font-mono">{fmt(detail.finalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-success">
                      <span>Profit</span><span className="font-mono font-semibold">{fmt(detail.totalProfit)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 px-6 pb-5 pt-3">
                    <button onClick={() => setDetail(null)} className="btn flex-1 btn-ghost border border-base-300">Close</button>
                    <button onClick={() => window.open(`/invoice/${detail.invoiceNo}`, '_blank')}
                      className="btn btn-primary flex-1 gap-2">
                      <i className="bi bi-printer-fill" /> Print Invoice
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}