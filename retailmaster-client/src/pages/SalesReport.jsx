import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function StatCard({ icon, label, value, color, sub }) {
  const c = { blue: ['bg-blue-50','text-blue-500','text-blue-600'], green: ['bg-green-50','text-green-500','text-green-600'],
    purple: ['bg-purple-50','text-purple-500','text-purple-600'], amber: ['bg-amber-50','text-amber-500','text-amber-600'] }[color]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 ${c[0]} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${icon} text-xl ${c[1]}`} />
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
        <div className={`text-2xl font-bold font-mono ${c[2]}`}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function SalesReport() {
  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [filter, setFilter] = useState({ from: firstOfMonth, to: today, branchId: '', cashierId: '', groupBy: 'day' })
  const [report, setReport]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [branches, setBranches] = useState([])
  const [cashiers, setCashiers] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // overview | transactions | products

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
    } catch { }
    finally { setLoading(false) }
  }, [filter])

  const selectCls = `px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none
    focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-700 font-[inherit] cursor-pointer`

  const maxTrend = Math.max(...(report?.trend?.map(t => t.sales) || [1]), 1)

  return (
    <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track revenue, profit and transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">From</label>
            <input type="date" value={filter.from}
              onChange={e => setFilter(f => ({...f, from: e.target.value}))}
              className={selectCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">To</label>
            <input type="date" value={filter.to}
              onChange={e => setFilter(f => ({...f, to: e.target.value}))}
              className={selectCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Branch</label>
            <select value={filter.branchId} onChange={e => setFilter(f => ({...f, branchId: e.target.value}))} className={selectCls}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Cashier</label>
            <select value={filter.cashierId} onChange={e => setFilter(f => ({...f, cashierId: e.target.value}))} className={selectCls}>
              <option value="">All Cashiers</option>
              {cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Group By</label>
            <select value={filter.groupBy} onChange={e => setFilter(f => ({...f, groupBy: e.target.value}))} className={selectCls}>
              <option value="day">Daily</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold cursor-pointer border-0 font-[inherit] transition-colors">
            {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Loading...</> : <><i className="bi bi-search" /> Apply</>}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="text-center py-16 text-gray-400"><i className="bi bi-bar-chart-line text-4xl block mb-2 text-gray-200" />Apply filters to load report</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <StatCard icon="bi-currency-dollar" label="Total Sales"  value={fmt(report.summary.totalSales)}  color="blue" />
            <StatCard icon="bi-graph-up-arrow"  label="Total Profit" value={fmt(report.summary.totalProfit)} color="green" />
            <StatCard icon="bi-receipt"         label="Transactions" value={report.summary.totalTransactions} color="purple" />
            <StatCard icon="bi-tags"            label="Avg. Order"   value={fmt(report.summary.averageOrderValue)} color="amber"
              sub={`৳${Number(report.summary.totalDiscount || 0).toFixed(2)} discounted`} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
            {[['overview','bi-grid','Overview'],['transactions','bi-receipt-cutoff','Transactions'],['products','bi-box-seam','Products']].map(([key,icon,label]) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0 font-[inherit]
                  ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}>
                <i className={`bi ${icon}`} />{label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-[1fr_320px] gap-4">
              {/* Trend chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-bold text-gray-800">Sales Trend</span>
                  <span className="text-[11px] bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full font-semibold">
                    {report.trend.length} periods
                  </span>
                </div>
                {report.trend.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No data for this period</div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1.5 h-44 pb-6 min-w-0"
                      style={{ minWidth: `${report.trend.length * 36}px` }}>
                      {report.trend.map((row, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group min-w-[30px]">
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap hidden group-hover:block z-10 leading-relaxed">
                            <strong>{row.period}</strong><br />
                            Sales: {fmt(row.sales)}<br />
                            Profit: {fmt(row.profit)}<br />
                            Txns: {row.transactions}
                          </div>
                          <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-75 cursor-pointer"
                            style={{ height: `${Math.max((row.sales / maxTrend) * 120, 4)}px`, background: row.sales > 0 ? '#4f7cff' : '#e9ecf5' }} />
                          <span className="text-[9px] text-gray-400 font-mono truncate w-full text-center">
                            {row.period.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Branch breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="text-sm font-bold text-gray-800 mb-4">By Branch</div>
                {report.byBranch.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">No data</div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {report.byBranch.map((b, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700 truncate">{b.branchName}</span>
                          <span className="font-mono text-blue-500 font-bold ml-2">{fmt(b.sales)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(b.sales / (report.byBranch[0]?.sales || 1)) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>{b.transactions} txns</span>
                          <span>Profit: {fmt(b.profit)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transactions tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {report.transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <i className="bi bi-receipt-cutoff text-3xl block mb-2 text-gray-200" />
                  No transactions found
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Invoice','Date','Branch','Cashier','Customer','Items','Total','Profit',''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((tx, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-blue-500">{tx.invoiceNo}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(tx.saleDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{tx.branchName}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{tx.cashierName}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{tx.customerName || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{tx.items?.length}</td>
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-gray-800">{fmt(tx.finalAmount)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-green-600">{fmt(tx.totalProfit)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => window.open(`/invoice/${tx.invoiceNo}`, '_blank')}
                            title="View Invoice"
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-500 text-gray-500 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border-0">
                            <i className="bi bi-receipt" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Products tab */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {report.topProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No product data</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['#','Product','Qty Sold','Revenue','Profit'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{p.name}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">{p.qtySold}</td>
                        <td className="px-4 py-3 text-sm font-mono font-semibold text-blue-600">{fmt(p.revenue)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-green-600">{fmt(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
