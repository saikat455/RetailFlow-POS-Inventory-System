import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, listItem } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function StatCard({ icon, label, value, color, sub, index }) {
  const c = {
    blue:   ['bg-primary/10',   'text-primary',   'text-primary'],
    green:  ['bg-success/10',   'text-success',   'text-success'],
    purple: ['bg-secondary/10', 'text-secondary', 'text-secondary'],
    amber:  ['bg-warning/10',   'text-warning',   'text-warning'],
  }[color]
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={index}
      className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-2 sm:p-5 gap-1.5 sm:gap-0 sm:flex-row sm:items-start sm:gap-4">
        <div className={`w-7 h-7 sm:w-11 sm:h-11 ${c[0]} rounded-lg sm:rounded-xl
          flex items-center justify-center flex-shrink-0`}>
          <i className={`bi ${icon} text-xs sm:text-xl ${c[1]}`} />
        </div>
        <div className="min-w-0">
          <div className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide
            text-base-content/50 leading-tight mb-0.5">{label}</div>
          <div className={`text-xs sm:text-2xl font-bold font-mono truncate ${c[2]}`}>{value}</div>
          {sub && (
            <div className="text-[8px] sm:text-xs text-base-content/40 mt-0.5 truncate">{sub}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* Card row for transactions on mobile (no table scroll) */
function TxRow({ tx }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 border-b border-base-200 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-primary text-xs font-bold">{tx.invoiceNo}</span>
        <span className="text-xs font-bold font-mono">{fmt(tx.finalAmount)}</span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-base-content/60 gap-2">
        <span className="truncate">{tx.branchName} · {tx.cashierName}</span>
        <span className="flex-shrink-0">{new Date(tx.saleDate).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-success font-semibold">
          Profit: {fmt(tx.totalProfit)}
        </span>
        <button onClick={() => window.open(`/invoice/${tx.invoiceNo}`, '_blank')}
          className="btn btn-xs btn-ghost border border-base-300 gap-1">
          <i className="bi bi-receipt text-xs" />
        </button>
      </div>
    </div>
  )
}

export default function SalesReport() {
  const today        = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0]

  const [filter, setFilter]     = useState({
    from: firstOfMonth, to: today, branchId: '', cashierId: '', groupBy: 'day',
  })
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [branches, setBranches] = useState([])
  const [cashiers, setCashiers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    api.get('/branches').then(r => setBranches(r.data)).catch(() => {})
    api.get('/reports/cashiers').then(r => setCashiers(r.data)).catch(() => {})
    fetchReport()
  }, [])

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.from)      params.append('from', filter.from)
      if (filter.to)        params.append('to', filter.to)
      if (filter.branchId)  params.append('branchId', filter.branchId)
      if (filter.cashierId) params.append('cashierId', filter.cashierId)
      params.append('groupBy', filter.groupBy)
      const r = await api.get(`/reports/sales?${params}`)
      setReport(r.data)
    } catch {}
    finally { setLoading(false) }
  }, [filter])

  const maxTrend = Math.max(...(report?.trend?.map(t => t.sales) || [1]), 1)

  return (
    <div className="max-w-[1100px] pb-20 lg:pb-0">

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
          Sales Report
        </h1>
        <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
          Track revenue, profit and transactions
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="card bg-base-100 border border-base-300 shadow-sm p-3 sm:p-4 mb-4 sm:mb-5">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">From</span>
            </label>
            <input type="date" value={filter.from}
              onChange={e => setFilter(p => ({ ...p, from: e.target.value }))}
              className="input input-bordered input-sm w-full" />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">To</span>
            </label>
            <input type="date" value={filter.to}
              onChange={e => setFilter(p => ({ ...p, to: e.target.value }))}
              className="input input-bordered input-sm w-full" />
          </div>

          <div className="form-control col-span-2 sm:col-span-1">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">Branch</span>
            </label>
            <select value={filter.branchId}
              onChange={e => setFilter(p => ({ ...p, branchId: e.target.value }))}
              className="select select-bordered select-sm w-full">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">Cashier</span>
            </label>
            <select value={filter.cashierId}
              onChange={e => setFilter(p => ({ ...p, cashierId: e.target.value }))}
              className="select select-bordered select-sm w-full">
              <option value="">All</option>
              {cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">Group</span>
            </label>
            <select value={filter.groupBy}
              onChange={e => setFilter(p => ({ ...p, groupBy: e.target.value }))}
              className="select select-bordered select-sm w-full">
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>
          </div>

          <button onClick={fetchReport} disabled={loading}
            className="btn btn-primary btn-sm gap-1.5 self-end col-span-2 sm:col-span-1 w-full sm:w-auto">
            {loading
              ? <><span className="loading loading-spinner loading-xs" /> Loading…</>
              : <><i className="bi bi-search" /> Apply</>}
          </button>
        </div>
      </motion.div>

      {!report ? (
        <div className="text-center py-16 text-base-content/40">
          <i className="bi bi-bar-chart-line text-4xl block mb-2 text-base-content/20" />
          Apply filters to load report
        </div>
      ) : (
        <>
          {/* Stats — 2×2 mobile, 4 col lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-5">
            <StatCard index={0} icon="bi-currency-dollar" label="Total Sales"
              value={fmt(report.summary.totalSales)} color="blue" />
            <StatCard index={1} icon="bi-graph-up-arrow" label="Total Profit"
              value={fmt(report.summary.totalProfit)} color="green" />
            <StatCard index={2} icon="bi-receipt" label="Transactions"
              value={report.summary.totalTransactions} color="purple" />
            <StatCard index={3} icon="bi-tags" label="Avg. Order"
              value={fmt(report.summary.averageOrderValue)} color="amber"
              sub={`৳${Number(report.summary.totalDiscount || 0).toFixed(2)} discounted`} />
          </div>

          {/* Tabs */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="mb-4 sm:mb-5">
            <div className="flex gap-1 bg-base-200 rounded-xl p-1">
              {[
                ['overview',     'bi-grid',          'Overview'],
                ['transactions', 'bi-receipt-cutoff','Transactions'],
                ['products',     'bi-box-seam',      'Products'],
              ].map(([key, icon, label]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`btn btn-sm gap-1.5 flex-1
                    ${activeTab === key ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/60'}`}>
                  <i className={`bi ${icon}`} />
                  <span className="hidden xs:inline sm:hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <motion.div key="overview" variants={fadeUp} initial="hidden"
                animate="visible" exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

                {/* Trend chart */}
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                  <div className="card-body p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-base-content">Sales Trend</span>
                      <span className="badge badge-primary badge-outline text-[11px]">
                        {report.trend.length} periods
                      </span>
                    </div>
                    {report.trend.length === 0 ? (
                      <div className="text-center py-8 text-base-content/40 text-sm">
                        No data for this period
                      </div>
                    ) : (
                      <div className="flex items-end gap-1 h-32 sm:h-44 pb-5 sm:pb-6">
                        {report.trend.map((row, i) => (
                          <div key={i}
                            className="flex-1 flex flex-col items-center gap-1 relative group
                              min-w-0">
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                              bg-neutral text-white text-[10px] px-2 py-1.5 rounded-lg
                              whitespace-nowrap hidden group-hover:block z-10 pointer-events-none
                              shadow-xl leading-relaxed">
                              <strong>{row.period}</strong><br />
                              Sales: {fmt(row.sales)}<br />
                              Profit: {fmt(row.profit)}<br />
                              Txns: {row.transactions}
                            </div>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max((row.sales / maxTrend) * 100, 4)}%` }}
                              transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                              className="w-full rounded-t-sm cursor-pointer hover:opacity-75
                                transition-opacity"
                              style={{ background: row.sales > 0 ? '#3b82f6' : '#e5e7eb' }} />
                            <span className="text-[8px] text-base-content/40 font-mono truncate
                              w-full text-center">
                              {row.period.split(' ')[0]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* By Branch */}
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                  <div className="card-body p-4 sm:p-5">
                    <div className="text-sm font-bold text-base-content mb-3 sm:mb-4">By Branch</div>
                    {report.byBranch.length === 0 ? (
                      <div className="text-center py-6 text-base-content/40 text-sm">No data</div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {report.byBranch.map((b, i) => (
                          <motion.div key={i} variants={listItem} initial="hidden"
                            animate="visible" custom={i} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-base-content truncate">
                                {b.branchName}
                              </span>
                              <span className="font-mono text-primary font-bold ml-2 flex-shrink-0">
                                {fmt(b.sales)}
                              </span>
                            </div>
                            <progress className="progress progress-primary h-1.5"
                              value={b.sales} max={report.byBranch[0]?.sales || 1} />
                            <div className="flex justify-between text-[10px] text-base-content/40">
                              <span>{b.transactions} txns</span>
                              <span>Profit: {fmt(b.profit)}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transactions tab — card list on mobile, table on desktop */}
            {activeTab === 'transactions' && (
              <motion.div key="transactions" variants={fadeUp} initial="hidden"
                animate="visible" exit={{ opacity: 0 }}
                className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                {report.transactions.length === 0 ? (
                  <div className="text-center py-12 text-base-content/40 text-sm">
                    <i className="bi bi-receipt-cutoff text-3xl block mb-2 text-base-content/20" />
                    No transactions found
                  </div>
                ) : (
                  <>
                    {/* Mobile: stacked cards */}
                    <div className="md:hidden divide-y divide-base-200">
                      {report.transactions.map((tx, i) => (
                        <TxRow key={i} tx={tx} />
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <table className="hidden md:table table-zebra table-sm w-full">
                      <thead>
                        <tr>
                          {['Invoice','Date','Branch','Cashier','Customer','Items','Total','Profit',''].map(h => (
                            <th key={h} className="text-[11px] font-bold uppercase tracking-wide text-base-content/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.transactions.map((tx, i) => (
                          <motion.tr key={i} variants={listItem} initial="hidden"
                            animate="visible" custom={i} className="hover">
                            <td><span className="font-mono text-primary text-xs font-bold">{tx.invoiceNo}</span></td>
                            <td className="text-xs text-base-content/60">{new Date(tx.saleDate).toLocaleDateString()}</td>
                            <td className="text-xs">{tx.branchName}</td>
                            <td className="text-xs">{tx.cashierName}</td>
                            <td className="text-xs text-base-content/50">{tx.customerName || '—'}</td>
                            <td className="text-xs">{tx.items?.length}</td>
                            <td className="text-xs font-mono font-bold">{fmt(tx.finalAmount)}</td>
                            <td className="text-xs font-mono text-success">{fmt(tx.totalProfit)}</td>
                            <td>
                              <button onClick={() => window.open(`/invoice/${tx.invoiceNo}`, '_blank')}
                                className="btn btn-xs btn-ghost border border-base-300">
                                <i className="bi bi-receipt" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </motion.div>
            )}

            {/* Products tab — stacked list, no table scroll */}
            {activeTab === 'products' && (
              <motion.div key="products" variants={fadeUp} initial="hidden"
                animate="visible" exit={{ opacity: 0 }}
                className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                {report.topProducts.length === 0 ? (
                  <div className="text-center py-12 text-base-content/40 text-sm">No product data</div>
                ) : (
                  <>
                    {/* Mobile: card list */}
                    <div className="md:hidden divide-y divide-base-200">
                      {report.topProducts.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                          <span className="text-xs font-bold text-base-content/30 w-6 flex-shrink-0">
                            #{i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-base-content truncate">{p.name}</div>
                            <div className="text-[10px] text-base-content/50 font-mono">
                              {p.qtySold} sold · {fmt(p.revenue)}
                            </div>
                          </div>
                          <div className="text-xs font-mono text-success flex-shrink-0">
                            {fmt(p.profit)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Desktop: table */}
                    <table className="hidden md:table table-zebra table-sm w-full">
                      <thead>
                        <tr>
                          {['#','Product','Qty Sold','Revenue','Profit'].map(h => (
                            <th key={h} className="text-[11px] font-bold uppercase tracking-wide text-base-content/50">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.topProducts.map((p, i) => (
                          <motion.tr key={i} variants={listItem} initial="hidden"
                            animate="visible" custom={i} className="hover">
                            <td className="text-xs text-base-content/40 font-mono">#{i + 1}</td>
                            <td className="text-sm font-semibold">{p.name}</td>
                            <td className="text-sm font-mono">{p.qtySold}</td>
                            <td className="text-sm font-mono font-bold text-primary">{fmt(p.revenue)}</td>
                            <td className="text-sm font-mono text-success">{fmt(p.profit)}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}