import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <i className="bi bi-grid-1x2-fill" /> },
  { to: '/products',  label: 'Products',  icon: <i className="bi bi-box-seam-fill" /> },
  { to: '/pos',       label: 'POS Sale',  icon: <i className="bi bi-cart-fill" />     },
]

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchInviteCode = async () => {
    if (inviteCode) { setShowInvite(true); return }
    setInviteLoading(true)
    try {
      // Import api lazily to avoid circular deps
      const { default: api } = await import('../services/api')
      const res = await api.get('/company')
      setInviteCode(res.data.inviteCode)
      setShowInvite(true)
    } catch { }
    finally { setInviteLoading(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-[#f2f4f8]">

      {/* Sidebar */}
      <aside className="w-[230px] bg-[#13151f] flex flex-col fixed inset-y-0 left-0 z-50">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-[22px] border-b border-white/[0.06]">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white text-base flex-shrink-0">P</div>
          <div className="min-w-0">
            <div className="text-white font-bold text-[15px] tracking-tight truncate">POSPro</div>
            <div className="text-white/35 text-[11px] truncate">{user?.companyName}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-150 no-underline
                ${isActive ? 'bg-blue-500 text-white' : 'text-white/40 hover:bg-white/[0.07] hover:text-white/85'}`
              }>
              <span className="flex items-center w-5 justify-center text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* Invite code button — Admin only */}
          {user?.role === 'Admin' && (
            <button onClick={fetchInviteCode}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium text-white/40 hover:bg-white/[0.07] hover:text-white/85 transition-all mt-2 cursor-pointer bg-transparent border-0 font-[inherit] w-full text-left">
              <span className="flex items-center w-5 justify-center text-base">
                {inviteLoading ? <i className="bi bi-arrow-repeat animate-spin" /> : <i className="bi bi-key-fill" />}
              </span>
              <span>Invite Code</span>
            </button>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3.5 border-t border-white/[0.06] flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/30 border border-blue-500 rounded-lg flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-semibold truncate">{user?.name}</div>
            <div className={`text-[11px] ${user?.role === 'Admin' ? 'text-yellow-400/70' : 'text-white/35'}`}>{user?.role}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            title="Logout"
            className="w-8 h-8 bg-white/[0.07] hover:bg-red-500 text-white/40 hover:text-white rounded-lg flex items-center justify-center transition-all cursor-pointer border-0">
            <i className="bi bi-box-arrow-right text-sm" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[230px] flex-1 p-8 min-h-screen">
        <Outlet />
      </main>

      {/* Invite Code Modal */}
      {showInvite && inviteCode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setShowInvite(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="bg-[#13151f] p-5 text-center">
              <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="bi bi-key-fill text-yellow-400 text-2xl" />
              </div>
              <h3 className="text-white font-bold text-base">Your Company Invite Code</h3>
              <p className="text-white/50 text-xs mt-1">Share this with your Cashiers so they can register</p>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {/* Big invite code display */}
              <div className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-6 py-4">
                <span className="text-3xl font-black tracking-[0.25em] font-mono text-gray-900">{inviteCode}</span>
                <button onClick={copyCode}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer border-0 font-[inherit]
                    ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-blue-500 hover:text-white text-gray-600'}`}>
                  <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
                </button>
              </div>
              {copied && <p className="text-green-500 text-xs font-semibold -mt-2"><i className="bi bi-check-circle-fill mr-1" />Copied to clipboard!</p>}

              {/* Instructions */}
              <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-2 text-xs uppercase tracking-wide">
                  <i className="bi bi-info-circle-fill mr-1.5" />How to use
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-blue-600">
                  <li>Share this code: <strong>{inviteCode}</strong> with your cashier</li>
                  <li>Cashier goes to <strong>/register</strong></li>
                  <li>They enter this code — system auto-joins them to <strong>{user?.companyName}</strong></li>
                </ol>
              </div>

              <button onClick={() => setShowInvite(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer border-0 font-[inherit] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}