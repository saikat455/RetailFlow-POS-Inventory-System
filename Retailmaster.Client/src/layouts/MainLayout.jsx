import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { pageTransition } from '../motion'

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: 'bi-grid-1x2-fill',    roles: ['Admin','Cashier'] },
  { to: '/products',     label: 'Products',     icon: 'bi-box-seam-fill',    roles: ['Admin','Cashier'] },
  { to: '/pos',          label: 'POS Sale',     icon: 'bi-cart-fill',        roles: ['Admin','Cashier'] },
  { to: '/transactions', label: 'Transactions', icon: 'bi-receipt-cutoff',   roles: ['Admin','Cashier'] },
  { to: '/branches',     label: 'Branches',     icon: 'bi-building-fill',    roles: ['Admin','Cashier'] },
  { to: '/reports',      label: 'Reports',      icon: 'bi-bar-chart-fill',   roles: ['Admin'] },
  { to: '/settings',     label: 'Settings',     icon: 'bi-gear-fill',        roles: ['Admin','Cashier'] },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const visible   = navItems.filter(n => n.roles.includes(user?.role))

  return (
    <div className="flex min-h-screen bg-base-200">

      {/* ── Sidebar ── */}
      <aside className="w-[230px] bg-neutral flex flex-col fixed inset-y-0 left-0 z-50">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-black text-white text-base flex-shrink-0">P</div>
            <div className="min-w-0">
              <div className="text-white font-bold text-[15px] tracking-tight truncate">POSPro</div>
              <div className="text-white/35 text-[11px] truncate">{user?.companyName}</div>
            </div>
          </div>

          {!user?.isAdmin && user?.branchName && (
            <div className="flex items-center gap-2 bg-primary/15 border border-primary/25 rounded-lg px-3 py-1.5">
              <i className="bi bi-building-fill text-primary text-[11px] flex-shrink-0" />
              <span className="text-primary/90 text-[11px] font-semibold truncate">{user.branchName}</span>
            </div>
          )}
          {user?.isAdmin && (
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5">
              <i className="bi bi-shield-fill-check text-accent text-[11px] flex-shrink-0" />
              <span className="text-accent text-[11px] font-semibold">All branches</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {visible.map((item, i) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all no-underline
                ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/40 hover:bg-white/[0.06] hover:text-white/85'}`
              }>
              <i className={`bi ${item.icon} w-5 text-center text-base flex-shrink-0`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3.5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 bg-white/[0.04] rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-[13px] font-black text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12px] font-bold truncate">{user?.name}</div>
              <div className={`text-[10px] font-semibold truncate ${user?.isAdmin ? 'text-accent/80' : 'text-primary/80'}`}>
                {user?.role}{user?.branchName && !user?.isAdmin ? ` · ${user.branchName}` : ''}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <NavLink to="/settings" title="Settings"
                className={({ isActive }) =>
                  `w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer text-sm no-underline
                  ${isActive ? 'bg-primary text-white' : 'text-white/30 hover:bg-white/10 hover:text-white/70'}`}>
                <i className="bi bi-gear-fill" />
              </NavLink>
              <button onClick={() => { logout(); navigate('/login') }} title="Logout"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:bg-error/20 hover:text-error transition-all cursor-pointer border-0 bg-transparent text-sm">
                <i className="bi bi-box-arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content with page transitions ── */}
      <main className="ml-[230px] flex-1 p-8 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}