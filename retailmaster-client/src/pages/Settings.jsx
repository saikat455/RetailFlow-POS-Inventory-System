import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/* ── tiny helpers ─────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl
      text-sm font-semibold shadow-xl border transition-all
      ${toast.type === 'success'
        ? 'bg-white text-green-700 border-green-100 shadow-green-100/50'
        : 'bg-white text-red-600  border-red-100  shadow-red-100/50'}`}
      style={{ animation: 'slideIn .2s ease' }}>
      <i className={`bi ${toast.type === 'success'
        ? 'bi-check-circle-fill text-green-500'
        : 'bi-exclamation-circle-fill text-red-400'}`} />
      {toast.msg}
    </div>
  )
}

const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all
  font-[inherit] bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-3 focus:ring-blue-100 text-gray-800`

const labelCls = `text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5`

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className={`bi ${icon} text-blue-500`} />
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">{title}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PROFILE SECTION — every user
═══════════════════════════════════════════════════════════ */
function ProfileSection({ showToast, user, onNameUpdate }) {
  const [profile, setProfile]     = useState(null)
  const [form, setForm]           = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' })
  const [loading, setLoading]     = useState(false)
  const [showPass, setShowPass]   = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  useEffect(() => {
    api.get('/settings/me').then(r => {
      setProfile(r.data)
      setForm(f => ({ ...f, name: r.data.name }))
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (changingPass) {
      if (!form.currentPassword) { showToast('Enter current password.', 'error'); return }
      if (form.newPassword.length < 6) { showToast('New password must be 6+ chars.', 'error'); return }
      if (form.newPassword !== form.confirmPassword) { showToast('Passwords do not match.', 'error'); return }
    }
    setLoading(true)
    try {
      await api.put('/settings/me', {
        name:            form.name.trim(),
        currentPassword: changingPass ? form.currentPassword : undefined,
        newPassword:     changingPass ? form.newPassword     : undefined,
      })
      showToast('Profile updated!')
      onNameUpdate(form.name.trim())
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      setChangingPass(false)
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error')
    } finally { setLoading(false) }
  }

  const avatar = profile?.name?.charAt(0).toUpperCase() || '?'

  return (
    <SectionCard title="My Profile" subtitle="Update your name and password" icon="bi-person-fill">
      {/* Avatar strip */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl mb-5">
        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg shadow-blue-200">
          {avatar}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-base">{profile?.name}</div>
          <div className="text-sm text-gray-500">{profile?.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
              ${profile?.role === 'Admin'
                ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              {profile?.role}
            </span>
            {profile?.branchName && (
              <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                <i className="bi bi-building text-gray-300" />{profile.branchName}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[10px] text-gray-400">Member since</div>
          <div className="text-xs font-semibold text-gray-600">
            {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className={labelCls}>Full Name *</label>
          <div className="relative">
            <i className="bi bi-person absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              required className={`${inputCls} pl-10`} placeholder="Your full name" />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className={labelCls}>Email Address</label>
          <div className="relative">
            <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input value={profile?.email || ''} readOnly
              className={`${inputCls} pl-10 opacity-60 cursor-not-allowed`} />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Password toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors
            hover:border-blue-200 select-none"
            style={{ borderColor: changingPass ? '#bfdbfe' : '#f3f4f6',
                     background: changingPass ? '#eff6ff' : '#fafafa' }}>
            <div className="relative flex-shrink-0">
              <input type="checkbox" checked={changingPass}
                onChange={e => setChangingPass(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-[22px] bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors" />
              <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-[18px]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700 block">Change password</span>
              <span className="text-xs text-gray-400">Leave off to keep current password</span>
            </div>
          </label>
        </div>

        {changingPass && (
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {[
              { key: 'currentPassword', label: 'Current Password', ph: 'Enter current password' },
              { key: 'newPassword',     label: 'New Password',     ph: 'Min 6 characters' },
              { key: 'confirmPassword', label: 'Confirm New Password', ph: 'Repeat new password' },
            ].map(field => (
              <div key={field.key}>
                <label className={labelCls}>{field.label}</label>
                <div className="relative">
                  <i className="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'}
                    value={form[field.key]}
                    onChange={e => setForm(f => ({...f, [field.key]: e.target.value}))}
                    placeholder={field.ph}
                    className={`${inputCls} pl-10 pr-10
                      ${field.key === 'confirmPassword' && form.confirmPassword
                        ? form.newPassword === form.confirmPassword
                          ? 'border-green-400 focus:ring-green-100'
                          : 'border-red-300 focus:ring-red-100'
                        : ''}`} />
                  {field.key === 'currentPassword' && (
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-pointer text-sm">
                      <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50
            text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit] transition-all
            hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200">
          {loading
            ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving…</>
            : <><i className="bi bi-check-lg" /> Save Profile</>}
        </button>
      </form>
    </SectionCard>
  )
}

/* ═══════════════════════════════════════════════════════════
   COMPANY SECTION — Admin only
═══════════════════════════════════════════════════════════ */
function CompanySection({ showToast }) {
  const [company, setCompany] = useState(null)
  const [form, setForm]       = useState({ name: '', address: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    api.get('/settings/company').then(r => {
      setCompany(r.data)
      setForm({ name: r.data.name, address: r.data.address || '', phone: r.data.phone || '' })
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await api.put('/settings/company', form)
      showToast('Company details updated!')
      setCompany(c => ({ ...c, ...form }))
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error')
    } finally { setLoading(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(company?.inviteCode || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SectionCard title="Company Details" subtitle="Edit your company info" icon="bi-building-fill">
      {/* Stats */}
      {company && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Branches', value: company.branchCount, icon: 'bi-building', color: 'blue' },
            { label: 'Users',    value: company.userCount,   icon: 'bi-people',   color: 'green' },
            { label: 'Since',    value: new Date(company.createdAt).getFullYear(), icon: 'bi-calendar', color: 'purple' },
          ].map(s => {
            const c = { blue: 'bg-blue-50 text-blue-500', green: 'bg-green-50 text-green-500', purple: 'bg-purple-50 text-purple-500' }[s.color]
            return (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <i className={`bi ${s.icon} text-base ${c.split(' ')[1]} block mb-1`} />
                <div className="text-lg font-black text-gray-800">{s.value}</div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{s.label}</div>
              </div>
            )
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Company Name *</label>
          <div className="relative">
            <i className="bi bi-building absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
              required className={`${inputCls} pl-10`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <div className="relative">
            <i className="bi bi-geo-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
              placeholder="Company address" className={`${inputCls} pl-10`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <div className="relative">
            <i className="bi bi-telephone absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
              placeholder="+880 1700 000000" className={`${inputCls} pl-10`} />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50
            text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200">
          {loading ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving…</> : <><i className="bi bi-check-lg" /> Save Company</>}
        </button>
      </form>

      {/* Company invite code info */}
      {company?.inviteCode && (
        <div className="mt-5 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
          <div className="text-[11px] font-bold text-yellow-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <i className="bi bi-info-circle-fill" /> Company Invite Code
          </div>
          <p className="text-xs text-yellow-700 mb-3">
            This code is for Admin reference only. Share <strong>branch invite codes</strong> (from the Branches page) with cashiers to lock them to a specific branch.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-base tracking-widest text-yellow-800 bg-yellow-100 px-3 py-1.5 rounded-lg">
              {company.inviteCode}
            </span>
            <button onClick={copyCode}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer border-0 font-[inherit]
                ${copied ? 'bg-green-500 text-white' : 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'}`}>
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ═══════════════════════════════════════════════════════════
   USERS SECTION — Admin only
═══════════════════════════════════════════════════════════ */
function UsersSection({ showToast }) {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/settings/users').then(r => setUsers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    try {
      await api.delete(`/settings/users/${deleteTarget.id}`)
      showToast(`${deleteTarget.name} removed.`)
      setDeleteTarget(null); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      setDeleteTarget(null)
    }
  }

  const admins   = users.filter(u => u.role === 'Admin')
  const cashiers = users.filter(u => u.role === 'Cashier')

  return (
    <SectionCard title="Team Members" subtitle={`${users.length} users in your company`} icon="bi-people-fill">
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[{ label: 'Admins', list: admins }, { label: 'Cashiers', list: cashiers }].map(({ label, list }) =>
            list.length > 0 && (
              <div key={label}>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{label}</div>
                <div className="flex flex-col gap-2">
                  {list.map(u => (
                    <div key={u.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm
                        ${u.role === 'Admin' ? 'bg-yellow-400 text-white' : 'bg-blue-500 text-white'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-800 truncate">{u.name}</div>
                        <div className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                          <span>{u.email}</span>
                          {u.branchName && (
                            <><span className="text-gray-200">·</span>
                            <span className="flex items-center gap-1">
                              <i className="bi bi-building text-[10px] text-gray-300" />{u.branchName}
                            </span></>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                          ${u.role === 'Admin'
                            ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {u.role}
                        </span>
                        {u.role !== 'Admin' && (
                          <button onClick={() => setDeleteTarget(u)}
                            className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer border-0">
                            <i className="bi bi-trash3-fill" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[360px] shadow-2xl overflow-hidden"
            style={{ animation: 'popIn .18s ease' }} onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-person-x-fill text-red-500 text-2xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Remove User?</h3>
              <p className="text-sm text-gray-400 mb-5">
                <strong className="text-gray-700">{deleteTarget.name}</strong> will lose access to the system.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
                  <i className="bi bi-person-x-fill mr-1.5" />Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
═══════════════════════════════════════════════════════════ */
export default function Settings() {
  const { user, login } = useAuth()
  const [toast, setToast]   = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  // After name update, refresh token display
  const handleNameUpdate = (newName) => {
    const stored = { ...JSON.parse('{}') }
    localStorage.setItem('name', newName)
    // Update user context so sidebar reflects new name
    login({
      token:       localStorage.getItem('token'),
      name:        newName,
      role:        localStorage.getItem('role'),
      companyId:   parseInt(localStorage.getItem('companyId')),
      companyName: localStorage.getItem('companyName'),
      branchId:    localStorage.getItem('branchId') ? parseInt(localStorage.getItem('branchId')) : null,
      branchName:  localStorage.getItem('branchName'),
    })
  }

  const tabs = [
    { key: 'profile', label: 'My Profile', icon: 'bi-person-fill' },
    ...(user?.isAdmin ? [
      { key: 'company', label: 'Company',    icon: 'bi-building-fill' },
      { key: 'users',   label: 'Team',       icon: 'bi-people-fill' },
    ] : [])
  ]

  return (
    <div className="max-w-[720px]">
      <Toast toast={toast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0 font-[inherit]
              ${activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 bg-transparent'}`}>
            <i className={`bi ${tab.icon}`} />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ProfileSection showToast={showToast} user={user} onNameUpdate={handleNameUpdate} />
      )}
      {activeTab === 'company' && user?.isAdmin && (
        <CompanySection showToast={showToast} />
      )}
      {activeTab === 'users' && user?.isAdmin && (
        <UsersSection showToast={showToast} />
      )}

      <style>{`
        @keyframes popIn  { from { transform: scale(.94); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideIn{ from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
