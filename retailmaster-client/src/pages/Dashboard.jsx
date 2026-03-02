import { useEffect, useState } from 'react'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function StatCard({ icon, label, value, color, loading }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',  val: 'text-blue-600'  },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500', val: 'text-green-600' },
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500',val: 'text-indigo-600'},
    red:    { bg: 'bg-red-50',    icon: 'text-red-400',   val: 'text-red-500'   },
  }
  const c = colors[color]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:-translate-y-0.5 transition-transform">
      <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <i className={`bi ${icon} text-xl ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
        {loading
          ? <div className="h-7 w-24 bg-gray-100 rounded-md animate-pulse" />
          : <div className={`text-2xl font-bold font-mono ${c.val}`}>{value}</div>
        }
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const maxQty = data?.topProducts?.[0]?.totalQtySold || 1

  return (
    <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-400 text-sm font-medium rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer font-[inherit]">
          <i className="bi bi-arrow-clockwise" /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-500 text-sm px-4 py-3 rounded-xl">
          <i className="bi bi-exclamation-triangle-fill mr-2" />{error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon="bi-currency-dollar" label="Today's Sales"    value={fmt(data?.todaySales)}        color="blue"   loading={loading} />
        <StatCard icon="bi-graph-up-arrow"  label="Today's Profit"   value={fmt(data?.todayProfit)}       color="green"  loading={loading} />
        <StatCard icon="bi-receipt"         label="Transactions"     value={data?.todayTransactions ?? '—'} color="indigo" loading={loading} />
        <StatCard icon="bi-exclamation-triangle-fill" label="Low Stock Alerts" value={data?.lowStockCount ?? '—'} color="red" loading={loading} />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-[1fr_340px] gap-4">

        {/* Sales Trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-semibold text-gray-800">Sales Trend</span>
            <span className="text-[11px] bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full font-semibold">Last 7 days</span>
          </div>
          {loading ? (
            <div className="h-36 bg-gray-50 rounded-xl animate-pulse" />
          ) : (
            <div className="flex items-end gap-2 h-40 pb-6">
              {data?.salesTrend?.map((day, i) => {
                const maxS = Math.max(...(data.salesTrend.map(d => d.sales)), 1)
                const h = Math.max((day.sales / maxS) * 110, 4)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 relative group">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap hidden group-hover:block z-10 leading-relaxed">
                      <strong>{day.date}</strong><br />
                      Sales: {fmt(day.sales)}<br />
                      Profit: {fmt(day.profit)}
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all duration-300 cursor-pointer hover:opacity-75"
                      style={{ height: `${h}px`, background: day.sales > 0 ? '#4f7cff' : '#e9ecf5' }}
                    />
                    <span className="text-[10px] text-gray-400 font-mono">{day.date.split(' ')[1]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Top Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-800">Top Selling</span>
              <span className="text-[11px] bg-blue-50 text-blue-500 px-2.5 py-1 rounded-full font-semibold">30 days</span>
            </div>
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            ) : data?.topProducts?.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">
                <i className="bi bi-bar-chart-line text-2xl block mb-2 text-gray-200" />
                No sales yet
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data?.topProducts?.map((p, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold font-mono text-gray-300 w-4">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate mb-1">{p.name}</div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${(p.totalQtySold / maxQty) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-semibold text-blue-500">{p.totalQtySold} sold</div>
                      <div className="text-[10px] font-mono text-gray-400">{fmt(p.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-800">Low Stock</span>
              {data?.lowStockCount > 0 && (
                <span className="text-[11px] bg-red-50 text-red-500 px-2.5 py-1 rounded-full font-semibold">
                  {data.lowStockCount} items
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />)}
              </div>
            ) : data?.lowStockItems?.length === 0 ? (
              <div className="text-center py-3">
                <i className="bi bi-check-circle-fill text-green-400 text-2xl block mb-1" />
                <span className="text-sm text-green-500 font-medium">All stocked up!</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.lowStockItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                    <span className="text-xs font-semibold text-gray-700 truncate">{item.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.stockQty === 0 ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'}`}>
                        {item.stockQty === 0 ? 'Out' : `${item.stockQty} left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}