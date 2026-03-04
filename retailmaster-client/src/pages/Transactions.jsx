import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toFixed(2)}`

function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border
      ${toast.type === 'success' ? 'bg-white text-green-700 border-green-100' : 'bg-white text-red-600 border-red-100'}`}
      style={{ animation: 'slideIn .2s ease' }}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-green-500' : 'bi-exclamation-circle-fill text-red-400'}`} />
      {toast.msg}
    </div>
  )
}

export default function Transactions() {
  const { user } = useAuth()

  const [sales, setSales]         = useState([])
  const [branches, setBranches]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState(null)
  const [detail, setDetail]       = useState(null)   // selected sale for detail modal
  const [detailLoading, setDetailLoading] = useState(false)

  // Filters
  const today = new Date().toISOString().split('T')[0]
  const [from, setFrom]           = useState(today)
  const [to, setTo]               = useState(today)
  const [branchFilter, setBranchFilter] = useState('')
  const [search, setSearch]       = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (user?.isAdmin)
      api.get('/branches').then(r => setBranches(r.data)).catch(() => {})
  }, [user])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Cashier: SaleService auto-scopes to their branch via JWT
      // Admin: optional branchFilter param
      const params = new URLSearchParams({ take: 200 })
      if (user?.isAdmin && branchFilter) params.append('branchId', branchFilter)
      const r = await api.get(`/sales/recent?${params}`)

      // Date filter in-client (simple)
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
    setDetailLoading(true)
    setDetail(sale)
    try {
      const r = await api.get(`/sales/${sale.id}`)
      setDetail(r.data)
    } catch { }
    finally { setDetailLoading(false) }
  }

  const totalRevenue = sales.reduce((s, t) => s + t.finalAmount, 0)
  const totalProfit  = sales.reduce((s, t) => s + (t.totalProfit || 0), 0)

  const selectCls = `px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none
    focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 font-[inherit] cursor-pointer`

  return (
    <div className="max-w-[1100px]">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
            {user?.isAdmin
              ? 'All branches'
              : <><i className="bi bi-building text-blue-400" />{user?.branchName}</>}
            <span className="text-gray-300">·</span>
            {sales.length} transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={selectCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={selectCls} />
          </div>
          {user?.isAdmin && branches.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Branch</label>
              <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className={selectCls}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Search</label>
            <div className="relative">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Invoice, customer, cashier…"
                className={`${selectCls} pl-8 w-full`} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && sales.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { icon: 'bi-receipt',        label: 'Transactions', value: sales.length,   mono: false, color: 'blue'   },
            { icon: 'bi-currency-dollar',label: 'Revenue',      value: fmt(totalRevenue), mono: true, color: 'indigo' },
            { icon: 'bi-graph-up-arrow', label: 'Profit',       value: fmt(totalProfit),  mono: true, color: 'green'  },
          ].map(s => {
            const c = {
              blue:   ['bg-blue-50',   'text-blue-500',   'text-blue-700'],
              indigo: ['bg-indigo-50', 'text-indigo-500', 'text-indigo-700'],
              green:  ['bg-green-50',  'text-green-500',  'text-green-700'],
            }[s.color]
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 ${c[0]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`bi ${s.icon} ${c[1]}`} />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-semibold">{s.label}</div>
                  <div className={`text-xl font-black ${s.mono ? 'font-mono' : ''} ${c[2]}`}>{s.value}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <i className="bi bi-arrow-repeat animate-spin text-2xl block mb-2 text-gray-300" />Loading…
          </div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <i className="bi bi-receipt-cutoff text-5xl block mb-3 text-gray-200" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm mt-1">Try adjusting the date range or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Invoice','Date & Time','Branch','Cashier','Customer','Items','Total','Profit',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((tx, i) => (
                  <tr key={tx.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => openDetail(tx)}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">
                        {tx.invoiceNo}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs font-semibold text-gray-700">{new Date(tx.saleDate).toLocaleDateString()}</div>
                      <div className="text-[10px] text-gray-400">{new Date(tx.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <i className="bi bi-building text-gray-300 text-[10px]" />{tx.branchName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{tx.cashierName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {tx.customerName || <span className="text-gray-300 italic">Walk-in</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 text-center">{tx.items?.length ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-gray-800 whitespace-nowrap">{fmt(tx.finalAmount)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-green-600 whitespace-nowrap">{fmt(tx.totalProfit)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => window.open(`/invoice/${tx.invoiceNo}`, '_blank')}
                        title="Open Invoice"
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-400 flex items-center justify-center text-xs transition-all cursor-pointer border-0">
                        <i className="bi bi-receipt" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl overflow-hidden"
            style={{ animation: 'popIn .18s ease' }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="bg-[#0f1117] px-6 py-5">
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
                <button onClick={() => setDetail(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:bg-white/10 cursor-pointer border-0 bg-transparent text-base">
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <i className="bi bi-arrow-repeat animate-spin text-xl block mb-2" />Loading items…
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="px-6 py-4 max-h-[280px] overflow-y-auto">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] text-[10px] font-bold uppercase text-gray-400 pb-2 mb-1 border-b border-gray-100">
                    <span>Product</span><span className="text-center pr-4">Qty</span><span className="text-right pr-4">Price</span><span className="text-right">Total</span>
                  </div>
                  {detail.items?.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] text-xs py-2 border-b border-gray-50 last:border-0 items-center">
                      <span className="font-medium text-gray-700 truncate pr-3">{item.productName}</span>
                      <span className="text-gray-500 text-center pr-4 font-mono">{item.quantity}</span>
                      <span className="text-gray-500 text-right pr-4 font-mono">{fmt(item.unitPrice)}</span>
                      <span className="font-semibold text-gray-800 text-right font-mono">{fmt(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-6 pb-2 border-t border-gray-100 pt-3 flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span><span className="font-mono">{fmt(detail.totalAmount)}</span>
                  </div>
                  {detail.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span><span className="font-mono">−{fmt(detail.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-1">
                    <span>Total</span><span className="font-mono">{fmt(detail.finalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Profit</span><span className="font-mono font-semibold">{fmt(detail.totalProfit)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-6 pb-5 pt-3">
                  <button onClick={() => setDetail(null)}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">
                    Close
                  </button>
                  <button onClick={() => window.open(`/invoice/${detail.invoiceNo}`, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
                    <i className="bi bi-printer-fill" /> Print Invoice
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn  { from { transform: scale(.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideIn{ from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
