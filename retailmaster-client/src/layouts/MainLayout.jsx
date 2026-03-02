import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: <i className="bi bi-grid-1x2-fill text-base" />,
  },
  {
    to: '/products', label: 'Products',
    icon: <i className="bi bi-box-seam-fill text-base" />,
  },
  {
    to: '/pos', label: 'POS Sale',
    icon: <i className="bi bi-cart-fill text-base" />,
  },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen bg-[#f2f4f8]">

      {/* ── Sidebar ── */}
      <aside className="w-[230px] bg-[#13151f] flex flex-col fixed inset-y-0 left-0 z-50">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-[22px] border-b border-white/[0.06]">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white text-base flex-shrink-0">
            P
          </div>
          <span className="text-white font-bold text-[17px] tracking-tight">POSPro</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 no-underline
                ${isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-white/40 hover:bg-white/[0.07] hover:text-white/85'
                }`
              }
            >
              <span className="flex items-center w-5 justify-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3.5 border-t border-white/[0.06] flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/30 border border-blue-500 rounded-lg flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">{user?.name}</div>
            <div className="text-white/35 text-[11px]">{user?.role}</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/login') }}
            title="Logout"
            className="w-8 h-8 bg-white/[0.07] hover:bg-red-500 text-white/40 hover:text-white rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer border-0"
          >
            <i className="bi bi-box-arrow-right text-sm" />
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ml-[230px] flex-1 p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}