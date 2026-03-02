import { useEffect, useState } from 'react'
import api from '../services/api'
import './Dashboard.css'

function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        {loading
          ? <div className="stat-skeleton" />
          : <div className="stat-value">{value}</div>
        }
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

function MiniBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mini-bar-wrap">
      <div className="mini-bar-fill" style={{ width: `${pct}%` }} />
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

  const fmt = (n) => `৳${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  const maxQty = data?.topProducts?.[0]?.totalQtySold || 1

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button className="refresh-btn" onClick={() => window.location.reload()}>↻ Refresh</button>
      </div>

      {error && <div className="dash-error">⚠ {error}</div>}

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon="💰" label="Today's Sales" value={fmt(data?.todaySales)} color="blue" loading={loading} />
        <StatCard icon="📈" label="Today's Profit" value={fmt(data?.todayProfit)} color="green" loading={loading} />
        <StatCard icon="🧾" label="Transactions" value={data?.todayTransactions ?? '—'} sub="today" color="indigo" loading={loading} />
        <StatCard icon="⚠️" label="Low Stock Alerts" value={data?.lowStockCount ?? '—'} sub="products" color="red" loading={loading} />
      </div>

      {/* Bottom two columns */}
      <div className="dash-bottom">

        {/* Left: Sales Trend */}
        <div className="dash-card">
          <div className="card-header">
            <span className="card-title">Sales Trend</span>
            <span className="card-badge">Last 7 days</span>
          </div>
          {loading ? (
            <div className="card-loading">Loading...</div>
          ) : (
            <div className="trend-chart">
              {data?.salesTrend?.map((day, i) => {
                const maxSales = Math.max(...(data.salesTrend.map(d => d.sales)), 1)
                const h = Math.max((day.sales / maxSales) * 120, 4)
                return (
                  <div key={i} className="trend-col">
                    <div className="trend-bar-wrap">
                      <div className="trend-tooltip">
                        <strong>{day.date}</strong><br />
                        Sales: {fmt(day.sales)}<br />
                        Profit: {fmt(day.profit)}
                      </div>
                      <div
                        className="trend-bar"
                        style={{ height: `${h}px`, background: day.sales > 0 ? 'var(--accent)' : '#e4e9f2' }}
                      />
                    </div>
                    <div className="trend-label">{day.date.split(' ')[1]}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right col: Top Products + Low Stock */}
        <div className="dash-right-col">

          {/* Top Products */}
          <div className="dash-card">
            <div className="card-header">
              <span className="card-title">Top Selling Products</span>
              <span className="card-badge">30 days</span>
            </div>
            {loading ? (
              <div className="card-loading">Loading...</div>
            ) : data?.topProducts?.length === 0 ? (
              <div className="card-empty">No sales data yet. Add products and make sales to see top performers.</div>
            ) : (
              <div className="top-products">
                {data?.topProducts?.map((p, i) => (
                  <div key={i} className="tp-row">
                    <div className="tp-rank">#{i + 1}</div>
                    <div className="tp-info">
                      <div className="tp-name">{p.name}</div>
                      <MiniBar value={p.totalQtySold} max={maxQty} />
                    </div>
                    <div className="tp-right">
                      <div className="tp-qty">{p.totalQtySold} sold</div>
                      <div className="tp-rev">{fmt(p.totalRevenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="dash-card">
            <div className="card-header">
              <span className="card-title">Low Stock Alerts</span>
              {data?.lowStockCount > 0 && (
                <span className="card-badge badge-red">{data.lowStockCount} items</span>
              )}
            </div>
            {loading ? (
              <div className="card-loading">Loading...</div>
            ) : data?.lowStockItems?.length === 0 ? (
              <div className="card-empty card-empty-good">✅ All products are well stocked!</div>
            ) : (
              <div className="low-stock-list">
                {data?.lowStockItems?.map((item, i) => (
                  <div key={i} className="ls-row">
                    <div className="ls-name">{item.name}</div>
                    <div className="ls-right">
                      <span className={`ls-badge ${item.stockQty === 0 ? 'ls-out' : 'ls-low'}`}>
                        {item.stockQty === 0 ? 'Out of stock' : `${item.stockQty} left`}
                      </span>
                      <span className="ls-threshold">min: {item.lowStockThreshold}</span>
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