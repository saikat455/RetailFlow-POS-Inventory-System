

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, listItem } from '../motion'
import api from '../services/api'

const fmt = (n) => `৳${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

function StatCard({ icon, label, value, color, loading, index }) {
  const colors = {
    blue:   { bg: 'bg-primary/10',   icon: 'text-primary',   val: 'text-primary'   },
    green:  { bg: 'bg-success/10',   icon: 'text-success',   val: 'text-success'   },
    indigo: { bg: 'bg-secondary/10', icon: 'text-secondary', val: 'text-secondary' },
    red:    { bg: 'bg-error/10',     icon: 'text-error',     val: 'text-error'     },
  }
  const c = colors[color]
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={index}
      className="card bg-base-100 border border-base-300 shadow-sm hover:-translate-y-0.5 transition-transform">
      <div className="card-body p-2 sm:p-5 gap-1.5 sm:flex-row sm:items-start sm:gap-4">
        <div className={`w-7 h-7 sm:w-11 sm:h-11 ${c.bg} rounded-lg sm:rounded-xl
          flex items-center justify-center flex-shrink-0`}>
          <i className={`bi ${icon} text-xs sm:text-xl ${c.icon}`} />
        </div>
        <div className="min-w-0 w-full">
          <div className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wide
            text-base-content/50 leading-tight mb-0.5">
            {label}
          </div>
          {loading
            ? <div className="skeleton h-5 sm:h-7 w-16 sm:w-24 rounded-md" />
            : <div className={`text-xs sm:text-2xl font-bold font-mono truncate ${c.val}`}>
                {value}
              </div>
          }
        </div>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const maxQty  = data?.topProducts?.[0]?.qtySold || 1
  const maxSale = Math.max(...(data?.trend?.map(d => d.totalSales) || [1]), 1)

  return (
    <div className="max-w-[1100px] mx-auto pb-20 lg:pb-0">

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start justify-between mb-5 sm:mb-7 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <button onClick={() => window.location.reload()}
          className="btn btn-ghost btn-sm gap-1.5 border border-base-300 flex-shrink-0">
          <i className="bi bi-arrow-clockwise" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-5 text-sm">
          <i className="bi bi-exclamation-triangle-fill" />{error}
        </div>
      )}

      {/* Stat cards — 2×2 on mobile, 4 cols on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <StatCard index={0} icon="bi-currency-dollar"           label="Today's Sales"  value={fmt(data?.todayRevenue)}        color="blue"   loading={loading} />
        <StatCard index={1} icon="bi-graph-up-arrow"            label="Today's Profit" value={fmt(data?.todayProfit)}         color="green"  loading={loading} />
        <StatCard index={2} icon="bi-receipt"                   label="Transactions"   value={data?.todayTransactions ?? '—'} color="indigo" loading={loading} />
        <StatCard index={3} icon="bi-exclamation-triangle-fill" label="Low Stock"      value={data?.lowStockCount ?? '—'}     color="red"    loading={loading} />
      </div>

      {/* Chart + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-4 mb-4">

        {/* Sales Trend */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <span className="text-sm font-semibold text-base-content">Sales Trend</span>
              <span className="badge badge-primary badge-outline text-[11px]">Last 7 days</span>
            </div>
            {loading ? (
              <div className="skeleton h-28 sm:h-36 w-full rounded-xl" />
            ) : !data?.trend?.length ? (
              <div className="text-center py-8 text-sm text-base-content/40">No data yet</div>
            ) : (
              <div className="flex items-end gap-1.5 sm:gap-2 h-28 sm:h-40 pb-5 sm:pb-6">
                {data.trend.map((day, i) => {
                  const h = Math.max((day.totalSales / maxSale) * 100, 4)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group">
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                        bg-neutral text-white text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1.5
                        rounded-lg whitespace-nowrap hidden group-hover:block z-10
                        leading-relaxed pointer-events-none shadow-xl">
                        <strong>{day.date}</strong><br />
                        Sales: {fmt(day.totalSales)}<br />
                        Txns: {day.transactions}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                        className="w-full rounded-t-md cursor-pointer hover:opacity-75 transition-opacity"
                        style={{ background: day.totalSales > 0 ? '#3b82f6' : '#e5e7eb' }} />
                      <span className="text-[8px] sm:text-[10px] text-base-content/40 font-mono truncate w-full text-center">
                        {day.date?.split(' ')[1]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Top Products */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
            className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-sm font-semibold text-base-content">Top Selling</span>
                <span className="badge badge-primary badge-outline text-[11px]">30 days</span>
              </div>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-7 sm:h-8 w-full rounded-lg" />)}
                </div>
              ) : !data?.topProducts?.length ? (
                <div className="text-center py-4 text-sm text-base-content/40">
                  <i className="bi bi-bar-chart-line text-2xl block mb-2 text-base-content/20" />
                  No sales yet
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:gap-3">
                  {data.topProducts.map((p, i) => (
                    <motion.div key={i} variants={listItem} initial="hidden" animate="visible" custom={i}
                      className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold font-mono text-base-content/30 w-4 flex-shrink-0">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-base-content truncate mb-1">
                          {p.productName}
                        </div>
                        <progress className="progress progress-primary h-1.5 w-full"
                          value={p.qtySold} max={maxQty} />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[11px] font-semibold text-primary">{p.qtySold} sold</div>
                        <div className="text-[10px] font-mono text-base-content/40">{fmt(p.revenue)}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Low Stock */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}
            className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="text-sm font-semibold text-base-content">Low Stock</span>
                {data?.lowStockCount > 0 && (
                  <span className="badge badge-error badge-outline text-[11px]">
                    {data.lowStockCount} items
                  </span>
                )}
              </div>
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-7 sm:h-8 w-full rounded-lg" />)}
                </div>
              ) : !data?.lowStockItems?.length ? (
                <div className="text-center py-3">
                  <i className="bi bi-check-circle-fill text-success text-2xl block mb-1" />
                  <span className="text-sm text-success font-medium">All stocked up!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.lowStockItems.map((item, i) => (
                    <motion.div key={i} variants={listItem} initial="hidden" animate="visible" custom={i}
                      className="flex items-center justify-between px-3 py-2
                        bg-warning/10 border border-warning/20 rounded-lg gap-2">
                      <span className="text-xs font-semibold text-base-content truncate">
                        {item.productName}
                      </span>
                      <span className={`badge badge-sm flex-shrink-0
                        ${item.stockQty === 0 ? 'badge-error' : 'badge-warning'}`}>
                        {item.stockQty === 0 ? 'Out' : `${item.stockQty} left`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}