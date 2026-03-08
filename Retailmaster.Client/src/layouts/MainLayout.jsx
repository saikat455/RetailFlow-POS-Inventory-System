
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ThemeToggle from '../components/ThemeToggle'
import { pageTransition } from '../motion'

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: 'bi-grid-1x2-fill',  roles: ['Admin','Cashier'] },
  { to: '/products',     label: 'Products',     icon: 'bi-box-seam-fill',  roles: ['Admin','Cashier'] },
  { to: '/pos',          label: 'POS Sale',     icon: 'bi-cart-fill',      roles: ['Admin','Cashier'] },
  { to: '/transactions', label: 'Transactions', icon: 'bi-receipt-cutoff', roles: ['Admin','Cashier'] },
  { to: '/branches',     label: 'Branches',     icon: 'bi-building-fill',  roles: ['Admin','Cashier'] },
  { to: '/reports',      label: 'Reports',      icon: 'bi-bar-chart-fill', roles: ['Admin']           },
  { to: '/settings',     label: 'Settings',     icon: 'bi-gear-fill',      roles: ['Admin','Cashier'] },
]

export default function MainLayout() {
  const { user, logout }   = useAuth()
  const { isDark }         = useTheme()
  const navigate           = useNavigate()
  const location           = useLocation()
  const [open, setOpen]    = useState(false)   // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop mini mode

  const visible = navItems.filter(n => n.roles.includes(user?.role))

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Close drawer on wide screen resize
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const sidebarW = collapsed ? 'w-[68px]' : 'w-[230px]'

  const NavItem = ({ item, forceLabel = false }) => (
    <NavLink
      to={item.to}
      title={collapsed && !forceLabel ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-[9px] text-sm font-medium transition-all no-underline
        ${collapsed && !forceLabel ? 'px-0 py-2.5 justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-primary text-white shadow-lg shadow-primary/20'
          : 'text-white/40 hover:bg-white/[0.06] hover:text-white/85'}`
      }
    >
      <i className={`bi ${item.icon} text-base flex-shrink-0 ${collapsed && !forceLabel ? 'text-lg' : 'w-5 text-center'}`} />
      {(!collapsed || forceLabel) && <span>{item.label}</span>}
    </NavLink>
  )

  /* ── Sidebar inner content (shared by desktop + mobile drawer) ── */
  const SidebarContent = ({ forceExpanded = false }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className={`border-b border-white/[0.06] flex-shrink-0
        ${collapsed && !forceExpanded ? 'px-3 py-4' : 'px-5 py-5'}`}>
        {collapsed && !forceExpanded ? (
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center
            font-black text-white text-base mx-auto">P</div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center
                font-black text-white text-base flex-shrink-0">P</div>
              <div className="min-w-0">
                <div className="text-white font-bold text-[15px] tracking-tight truncate">POSPro</div>
                <div className="text-white/35 text-[11px] truncate">{user?.companyName}</div>
              </div>
            </div>
            {!user?.isAdmin && user?.branchName && (
              <div className="flex items-center gap-2 bg-primary/15 border border-primary/25
                rounded-lg px-3 py-1.5">
                <i className="bi bi-building-fill text-primary text-[11px] flex-shrink-0" />
                <span className="text-primary/90 text-[11px] font-semibold truncate">{user.branchName}</span>
              </div>
            )}
            {user?.isAdmin && (
              <div className="flex items-center gap-2 bg-accent/10 border border-accent/20
                rounded-lg px-3 py-1.5">
                <i className="bi bi-shield-fill-check text-accent text-[11px] flex-shrink-0" />
                <span className="text-accent text-[11px] font-semibold">All branches</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto
        ${collapsed && !forceExpanded ? 'px-1.5' : 'px-3'}`}>
        {visible.map(item => (
          <NavItem key={item.to} item={item} forceLabel={forceExpanded} />
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/[0.06] flex-shrink-0
        ${collapsed && !forceExpanded ? 'p-2' : 'p-3.5'}`}>
        {collapsed && !forceExpanded ? (
          /* Mini footer — just icons */
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle compact />
            <button
              onClick={() => { logout(); navigate('/login') }}
              title="Logout"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30
                hover:bg-error/20 hover:text-error transition-all border-0 bg-transparent cursor-pointer">
              <i className="bi bi-box-arrow-right text-sm" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-white/30 text-[11px] font-semibold uppercase tracking-widest">
                Appearance
              </span>
              <ThemeToggle compact />
            </div>
            <div className="flex items-center gap-2.5 bg-white/[0.04] rounded-xl px-3 py-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center
                text-[13px] font-black text-white flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[12px] font-bold truncate">{user?.name}</div>
                <div className={`text-[10px] font-semibold truncate
                  ${user?.isAdmin ? 'text-accent/80' : 'text-primary/80'}`}>
                  {user?.role}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <NavLink to="/settings" title="Settings"
                  className={({ isActive }) =>
                    `w-7 h-7 flex items-center justify-center rounded-lg transition-all
                    cursor-pointer text-sm no-underline
                    ${isActive ? 'bg-primary text-white' : 'text-white/30 hover:bg-white/10 hover:text-white/70'}`}>
                  <i className="bi bi-gear-fill" />
                </NavLink>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  title="Logout"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30
                    hover:bg-error/20 hover:text-error transition-all cursor-pointer
                    border-0 bg-transparent text-sm">
                  <i className="bi bi-box-arrow-right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-base-200">

      {/* ══════════════════════════════════════════
          DESKTOP SIDEBAR (lg+)
      ══════════════════════════════════════════ */}
      <aside className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-neutral
        transition-all duration-300 ${sidebarW}`}>
        <SidebarContent />

        {/* Collapse toggle tab */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12
            bg-neutral border border-white/10 rounded-r-lg flex items-center justify-center
            text-white/30 hover:text-white/70 hover:bg-white/10 transition-all cursor-pointer z-10">
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'} text-xs`} />
        </button>
      </aside>

      {/* ══════════════════════════════════════════
          MOBILE TOP NAVBAR (< lg)
      ══════════════════════════════════════════ */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-neutral z-50
        flex items-center justify-between px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
              bg-white/[0.06] text-white/60 hover:text-white hover:bg-white/10
              border-0 cursor-pointer transition-all">
            <i className="bi bi-list text-xl" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center
              font-black text-white text-sm">P</div>
            <span className="text-white font-bold text-[15px] tracking-tight">POSPro</span>
          </div>
        </div>

        {/* Right side of top bar */}
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          {/* Current route label */}
          <span className="text-white/40 text-xs font-semibold hidden sm:block">
            {visible.find(n => location.pathname.startsWith(n.to))?.label || ''}
          </span>
          {/* User avatar */}
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center
            text-[12px] font-black text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          MOBILE DRAWER OVERLAY
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[270px] bg-neutral z-[70]
                flex flex-col shadow-2xl">
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
                  rounded-lg bg-white/[0.06] text-white/40 hover:text-white
                  border-0 cursor-pointer z-10">
                <i className="bi bi-x-lg text-sm" />
              </button>
              <SidebarContent forceExpanded />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <main className={`flex-1 min-h-screen transition-all duration-300
        pt-14 lg:pt-0
        ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[230px]'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={pageTransition.initial}
              animate={pageTransition.animate}
              exit={pageTransition.exit}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ══════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral
        border-t border-white/[0.06] flex items-center justify-around px-1 pb-safe">
        {visible.slice(0, 5).map(item => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <NavLink key={item.to} to={item.to}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 min-w-[52px]
                rounded-xl transition-all no-underline
                ${isActive ? 'text-primary' : 'text-white/35 hover:text-white/70'}`}>
              <i className={`bi ${item.icon} text-xl leading-none ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-semibold leading-none mt-0.5 truncate">
                {item.label}
              </span>
              {isActive && (
                <motion.div layoutId="tab-indicator"
                  className="absolute -top-0.5 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </NavLink>
          )
        })}
        {/* More button for items beyond 5 */}
        {visible.length > 5 && (
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-[52px]
              text-white/35 hover:text-white/70 bg-transparent border-0 cursor-pointer">
            <i className="bi bi-three-dots text-xl leading-none" />
            <span className="text-[9px] font-semibold leading-none mt-0.5">More</span>
          </button>
        )}
      </nav>
    </div>
  )
}