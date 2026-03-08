
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

function TxCard({ tx, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-2 p-3 sm:p-4 bg-base-100 border border-base-300
        rounded-xl cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all active:scale-[.99]">
      <div className="flex items-start justify-between gap-2">
        <span className="badge badge-primary badge-outline font-mono text-xs">
          {tx.invoiceNo}
        </span>
        <span className="text-xs font-mono font-bold text-base-content">
          {fmt(tx.finalAmount)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-base-content truncate">
            {tx.customerName || <span className="italic text-base-content/40">Walk-in</span>}
          </span>
          <span className="text-[10px] text-base-content/50">
            <i className="bi bi-person text-base-content/30 mr-1" />{tx.cashierName}
            {tx.branchName && <> · <i className="bi bi-building text-base-content/30 mx-1" />{tx.branchName}</>}
          </span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[10px] font-semibold text-base-content/60">
            {new Date(tx.saleDate).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-base-content/40">
            {new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-base-200">
        <span className="text-[10px] text-base-content/50">
          {tx.items?.length ?? 0} items · Profit:
          <span className="text-success font-semibold ml-1">{fmt(tx.totalProfit)}</span>
        </span>
        <button
          onClick={e => { e.stopPropagation(); window.open(`/invoice/${tx.invoiceNo}`, '_blank') }}
          className="btn btn-xs btn-ghost border border-base-300 gap-1">
          <i className="bi bi-receipt" /> Invoice
        </button>
      </div>
    </div>
  )
}

export default function Transactions() {
  const { user } = useAuth()

  const [sales, setSales]       = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [toast, setToast]       = useState(null)
  const [detail, setDetail]     = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const [from, setFrom]             = useState(today)
  const [to, setTo]                 = useState(today)
  const [branchFilter, setBranchFilter] = useState('')
  const [search, setSearch]         = useState('')

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
          s.cashierName.toLowerCase().includes(q)
        )
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
    <div className="max-w-[1100px] pb-20 lg:pb-0">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className={`fixed top-5 right-5 z-[9999] alert text-sm shadow-xl
              w-auto max-w-[85vw] ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start justify-between mb-5 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            Transactions
          </h1>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
            {user?.isAdmin
              ? 'All branches'
              : <><i className="bi bi-building text-primary mr-1" />{user?.branchName}</>}
            {' '}· {sales.length} transactions
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="card bg-base-100 border border-base-300 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">From</span>
            </label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="input input-bordered input-sm w-full" />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">To</span>
            </label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="input input-bordered input-sm w-full" />
          </div>

          {user?.isAdmin && branches.length > 0 && (
            <div className="form-control col-span-2 sm:col-span-1">
              <label className="label py-1">
                <span className="label-text text-[11px] font-bold uppercase tracking-wide">Branch</span>
              </label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
                className="select select-bordered select-sm w-full">
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-control col-span-2 sm:col-span-1 sm:flex-1 sm:min-w-[180px]">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">Search</span>
            </label>
            <label className="input input-bordered input-sm flex items-center gap-2">
              <i className="bi bi-search text-base-content/30 text-xs" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Invoice, customer…" className="grow text-sm min-w-0" />
            </label>
          </div>

        </div>
      </motion.div>

      {/* Summary cards — icon + stacked label/value, vertical on mobile */}
      {!loading && sales.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-5">
          {[
            { icon: 'bi-receipt',         label: 'Txns',    value: sales.length,      bg: 'bg-primary/10',   color: 'text-primary'   },
            { icon: 'bi-currency-dollar', label: 'Revenue', value: fmt(totalRevenue), bg: 'bg-secondary/10', color: 'text-secondary' },
            { icon: 'bi-graph-up-arrow',  label: 'Profit',  value: fmt(totalProfit),  bg: 'bg-success/10',   color: 'text-success'   },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}
              className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-2 sm:p-4 gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <div className={`w-7 h-7 sm:w-10 sm:h-10 ${s.bg} rounded-lg sm:rounded-xl
                  flex items-center justify-center flex-shrink-0`}>
                  <i className={`bi ${s.icon} ${s.color} text-xs sm:text-base`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] text-base-content/50 font-semibold
                    uppercase tracking-wide leading-tight">
                    {s.label}
                  </div>
                  <div className={`text-xs sm:text-lg font-black font-mono truncate ${s.color}`}>
                    {s.value}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
        </div>
      ) : sales.length === 0 ? (
        <div className="card bg-base-100 border border-base-300 py-14 sm:py-16 text-center">
          <i className="bi bi-receipt-cutoff text-4xl sm:text-5xl text-base-content/20 block mb-3" />
          <p className="font-medium text-sm text-base-content/50">No transactions found</p>
          <p className="text-xs text-base-content/40 mt-1">Try adjusting the date range or filters</p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {sales.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}>
                <TxCard tx={tx} onClick={() => openDetail(tx)} />
              </motion.div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
            <table className="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  {['Invoice','Date & Time','Branch','Cashier','Customer','Items','Total','Profit',''].map(h => (
                    <th key={h} className="text-[11px] font-bold uppercase tracking-wide text-base-content/50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((tx, i) => (
                  <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover cursor-pointer" onClick={() => openDetail(tx)}>
                    <td>
                      <span className="badge badge-primary badge-outline font-mono text-xs">
                        {tx.invoiceNo}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs font-semibold">
                        {new Date(tx.saleDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-base-content/40">
                        {new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="text-xs">
                      <i className="bi bi-building text-base-content/30 mr-1 text-[10px]" />
                      {tx.branchName}
                    </td>
                    <td className="text-xs">{tx.cashierName}</td>
                    <td className="text-xs text-base-content/50">
                      {tx.customerName || <span className="italic text-base-content/30">Walk-in</span>}
                    </td>
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
        </>
      )}

      {/* Detail Modal — always centered */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center
              justify-center z-[1000] p-4"
            onClick={() => setDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="bg-base-100 w-full max-w-[460px] shadow-2xl rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="bg-neutral px-4 sm:px-5 py-3.5 flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-white font-bold text-sm truncate">{detail.invoiceNo}</div>
                  <div className="text-white/40 text-[11px] mt-0.5 truncate">
                    {detail.branchName} · {new Date(detail.saleDate).toLocaleString()}
                  </div>
                  <div className="text-white/30 text-[11px] truncate">
                    {detail.cashierName}
                    {detail.customerName && ` · ${detail.customerName}`}
                  </div>
                </div>
                <button onClick={() => setDetail(null)}
                  className="btn btn-ghost btn-xs btn-square text-white/40 flex-shrink-0 ml-2">
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-6 text-center text-base-content/50 text-sm">
                  <span className="loading loading-spinner loading-md block mx-auto mb-2" />
                  Loading…
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="p-4 max-h-[40vh] overflow-y-auto flex flex-col gap-0">
                    {detail.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-2
                        py-2 border-b border-base-200 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-base-content truncate">
                            {item.productName}
                          </div>
                          <div className="text-[10px] text-base-content/50 font-mono">
                            {fmt(item.unitPrice)} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-xs font-bold font-mono text-base-content flex-shrink-0">
                          {fmt(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="px-4 pb-1 border-t border-base-200 pt-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs sm:text-sm text-base-content/60">
                      <span>Subtotal</span>
                      <span className="font-mono">{fmt(detail.totalAmount)}</span>
                    </div>
                    {detail.discount > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm text-success">
                        <span>Discount</span>
                        <span className="font-mono">−{fmt(detail.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm
                      border-t border-base-300 pt-2 mt-0.5">
                      <span>Total</span>
                      <span className="font-mono">{fmt(detail.finalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm text-success">
                      <span>Profit</span>
                      <span className="font-mono font-semibold">{fmt(detail.totalProfit)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 p-4 pt-3">
                    <button onClick={() => setDetail(null)}
                      className="btn flex-1 btn-ghost border border-base-300 btn-sm">
                      Close
                    </button>
                    <button onClick={() => window.open(`/invoice/${detail.invoiceNo}`, '_blank')}
                      className="btn btn-primary flex-1 gap-2 btn-sm">
                      <i className="bi bi-printer-fill" /> Print
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}