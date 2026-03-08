
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn, listItem } from '../motion'
import ThemeToggle from '../components/ThemeToggle'
import api from '../services/api'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className={`fixed top-5 right-5 z-[9999] alert text-sm shadow-xl w-auto max-w-[85vw]
        ${toast.type === 'success' ? 'alert-success' : 'alert-error'}`}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
      {toast.msg}
    </motion.div>
  )
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible"
      className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300">
        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className={`bi ${icon} text-primary text-sm`} />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-base-content text-sm truncate">{title}</div>
          {subtitle && <div className="text-xs text-base-content/50 mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body p-4">{children}</div>
    </motion.div>
  )
}

function ProfileSection({ showToast, user, onNameUpdate }) {
  const [profile, setProfile]           = useState(null)
  const [form, setForm]                 = useState({
    name: '', currentPassword: '', newPassword: '', confirmPassword: '',
  })
  const [loading, setLoading]           = useState(false)
  const [showPass, setShowPass]         = useState(false)
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

  return (
    <SectionCard title="My Profile" subtitle="Update your name and password" icon="bi-person-fill">

      {/* Avatar strip — constrained, no overflow */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10
        border border-primary/20 rounded-xl mb-4 overflow-hidden">

        {/* Avatar letter */}
        <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center
          text-lg font-black text-white flex-shrink-0 shadow-md shadow-primary/20">
          {profile?.name?.charAt(0).toUpperCase() || '?'}
        </div>

        {/* Name / email / role — all truncated */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base-content text-sm truncate">{profile?.name}</div>
          <div className="text-xs text-base-content/60 truncate">{profile?.email}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`badge badge-sm flex-shrink-0
              ${profile?.role === 'Admin' ? 'badge-warning' : 'badge-primary'}`}>
              {profile?.role}
            </span>
            {profile?.branchName && (
              <span className="text-[10px] text-base-content/40 truncate flex items-center gap-1 min-w-0">
                <i className="bi bi-building text-[9px] text-base-content/30 flex-shrink-0" />
                <span className="truncate">{profile.branchName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Theme + joined — right side, no wrapping */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <ThemeToggle />
          <div className="text-right">
            <div className="text-[9px] text-base-content/40 leading-tight">Since</div>
            <div className="text-[10px] font-semibold text-base-content/60 leading-tight">
              {profile?.joinedAt
                ? new Date(profile.joinedAt).toLocaleDateString('en-US',
                    { month: 'short', year: 'numeric' })
                : '—'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="form-control">
          <label className="label pb-1.5">
            <span className="label-text text-[11px] font-bold uppercase tracking-wide">Full Name *</span>
          </label>
          <label className="input input-bordered flex items-center gap-2">
            <i className="bi bi-person text-base-content/30 flex-shrink-0" />
            <input value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required placeholder="Your full name" className="grow text-sm min-w-0" />
          </label>
        </div>

        <div className="form-control">
          <label className="label pb-1.5">
            <span className="label-text text-[11px] font-bold uppercase tracking-wide">
              Email Address
            </span>
          </label>
          <label className="input input-bordered input-disabled flex items-center gap-2 opacity-60">
            <i className="bi bi-envelope text-base-content/30 flex-shrink-0" />
            <input value={profile?.email || ''} readOnly
              className="grow text-sm cursor-not-allowed min-w-0" />
          </label>
          <label className="label pt-1">
            <span className="label-text-alt text-base-content/40">Email cannot be changed</span>
          </label>
        </div>

        <label className="label cursor-pointer justify-start gap-3 p-3
          bg-base-200 rounded-xl border border-base-300 hover:border-primary/30 transition-colors">
          <input type="checkbox" checked={changingPass}
            onChange={e => setChangingPass(e.target.checked)}
            className="toggle toggle-primary toggle-sm flex-shrink-0" />
          <div className="min-w-0">
            <span className="label-text font-semibold block">Change password</span>
            <span className="label-text-alt text-base-content/50">Leave off to keep current</span>
          </div>
        </label>

        <AnimatePresence>
          {changingPass && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible"
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3 p-3 bg-base-200 rounded-xl border border-base-300 overflow-hidden">
              {[
                { key: 'currentPassword', label: 'Current Password',     ph: 'Enter current password', showToggle: true },
                { key: 'newPassword',     label: 'New Password',         ph: 'Min 6 characters'                         },
                { key: 'confirmPassword', label: 'Confirm New Password', ph: 'Repeat new password'                      },
              ].map(field => (
                <div key={field.key} className="form-control">
                  <label className="label pb-1.5">
                    <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                      {field.label}
                    </span>
                  </label>
                  <label className={`input flex items-center gap-2
                    ${field.key === 'confirmPassword' && form.confirmPassword
                      ? form.newPassword === form.confirmPassword ? 'input-success' : 'input-error'
                      : 'input-bordered'}`}>
                    <i className="bi bi-lock text-base-content/30 flex-shrink-0" />
                    <input type={showPass ? 'text' : 'password'}
                      value={form[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.ph} className="grow text-sm min-w-0" />
                    {field.showToggle && (
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        className="text-base-content/30 hover:text-base-content/60
                          bg-transparent border-0 cursor-pointer text-sm flex-shrink-0">
                        <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                      </button>
                    )}
                  </label>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2">
          {loading
            ? <><span className="loading loading-spinner loading-sm" /> Saving…</>
            : <><i className="bi bi-check-lg" /> Save Profile</>}
        </button>
      </form>
    </SectionCard>
  )
}

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
      {company && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Branches', value: company.branchCount, icon: 'bi-building',  color: 'text-primary'   },
            { label: 'Users',    value: company.userCount,   icon: 'bi-people',    color: 'text-success'   },
            { label: 'Since',
              value: new Date(company.createdAt).getFullYear(),
              icon: 'bi-calendar', color: 'text-secondary' },
          ].map(s => (
            <div key={s.label} className="bg-base-200 rounded-xl p-2.5 text-center">
              <i className={`bi ${s.icon} text-sm ${s.color} block mb-1`} />
              <div className="text-base font-black text-base-content">{s.value}</div>
              <div className="text-[10px] text-base-content/40 font-semibold uppercase tracking-wide">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {[
          { key: 'name',    label: 'Company Name *', ph: '',                  icon: 'bi-building', req: true },
          { key: 'address', label: 'Address',         ph: 'Company address',  icon: 'bi-geo-alt'            },
          { key: 'phone',   label: 'Phone',           ph: '+880 1700 000000', icon: 'bi-telephone'          },
        ].map(f => (
          <div key={f.key} className="form-control">
            <label className="label pb-1.5">
              <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                {f.label}
              </span>
            </label>
            <label className="input input-bordered flex items-center gap-2">
              <i className={`bi ${f.icon} text-base-content/30 flex-shrink-0`} />
              <input value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required={f.req} placeholder={f.ph} className="grow text-sm min-w-0" />
            </label>
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn btn-primary w-full gap-2">
          {loading
            ? <><span className="loading loading-spinner loading-sm" /> Saving…</>
            : <><i className="bi bi-check-lg" /> Save Company</>}
        </button>
      </form>

      {company?.inviteCode && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-xl">
          <div className="text-[11px] font-bold text-warning uppercase tracking-wide mb-1.5
            flex items-center gap-1.5">
            <i className="bi bi-info-circle-fill" /> Company Invite Code
          </div>
          <p className="text-xs text-base-content/60 mb-3">
            Share <strong>branch invite codes</strong> (from the Branches page) with cashiers.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm tracking-widest text-base-content
              bg-warning/20 px-3 py-1.5 rounded-lg">
              {company.inviteCode}
            </span>
            <button onClick={copyCode}
              className={`btn btn-sm gap-1.5
                ${copied ? 'btn-success' : 'btn-warning btn-outline'}`}>
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

function UsersSection({ showToast }) {
  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
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
    <SectionCard
      title="Team Members"
      subtitle={`${users.length} users`}
      icon="bi-people-fill">

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[{ label: 'Admins', list: admins }, { label: 'Cashiers', list: cashiers }].map(
            ({ label, list }) => list.length > 0 && (
              <div key={label}>
                <div className="text-[10px] font-bold uppercase tracking-widest
                  text-base-content/40 mb-2">
                  {label}
                </div>
                <div className="flex flex-col gap-2">
                  {list.map((u, i) => (
                    <motion.div key={u.id} variants={listItem} initial="hidden"
                      animate="visible" custom={i}
                      className="flex items-center gap-2.5 p-2.5 bg-base-200
                        border border-base-300 rounded-xl overflow-hidden">

                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        font-black text-sm flex-shrink-0
                        ${u.role === 'Admin' ? 'bg-warning text-white' : 'bg-primary text-white'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Info — fully stacked, all truncated */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-base-content truncate">
                            {u.name}
                          </span>
                          <span className={`badge badge-xs flex-shrink-0
                            ${u.role === 'Admin' ? 'badge-warning' : 'badge-primary'}`}>
                            {u.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-base-content/50 truncate block mt-0.5">
                          {u.email}
                        </span>
                        {u.branchName && (
                          <span className="text-[10px] text-base-content/40 flex items-center gap-1 mt-0.5">
                            <i className="bi bi-building text-[9px] text-base-content/30 flex-shrink-0" />
                            <span className="truncate">{u.branchName}</span>
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      {u.role !== 'Admin' && (
                        <button onClick={() => setDeleteTarget(u)}
                          className="btn btn-xs btn-ghost btn-square text-error
                            hover:bg-error/10 flex-shrink-0">
                          <i className="bi bi-trash3-fill" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Delete confirm — always centered */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center
              justify-center z-[1000] p-4"
            onClick={() => setDeleteTarget(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="bg-base-100 w-full max-w-[320px] shadow-2xl rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="p-5 text-center">
                <div className="w-11 h-11 bg-error/10 border-2 border-error/20 rounded-2xl
                  flex items-center justify-center mx-auto mb-3">
                  <i className="bi bi-person-x-fill text-error text-lg" />
                </div>
                <h3 className="font-bold text-base-content text-sm mb-1">Remove User?</h3>
                <p className="text-xs text-base-content/50 mb-4">
                  <strong className="text-base-content">{deleteTarget.name}</strong> will lose access.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteTarget(null)}
                    className="btn flex-1 btn-ghost border border-base-300 btn-sm">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="btn btn-error flex-1 gap-1.5 btn-sm">
                    <i className="bi bi-person-x-fill" /> Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
  )
}

export default function Settings() {
  const { user, login } = useAuth()
  const [toast, setToast]         = useState(null)
  const [activeTab, setActiveTab] = useState('profile')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500)
  }

  const handleNameUpdate = (newName) => {
    localStorage.setItem('name', newName)
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
      { key: 'company', label: 'Company',  icon: 'bi-building-fill' },
      { key: 'users',   label: 'Team',     icon: 'bi-people-fill'   },
    ] : [])
  ]

  return (
    <div className="max-w-[680px] pb-20 lg:pb-0 overflow-hidden">
      <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1} className="mb-5">
        <div className="flex gap-1 bg-base-200 rounded-xl p-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`btn btn-sm gap-1.5 flex-1 whitespace-nowrap
                ${activeTab === tab.key
                  ? 'btn-primary shadow-sm'
                  : 'btn-ghost text-base-content/60'}`}>
              <i className={`bi ${tab.icon}`} />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div key="profile" variants={fadeUp} initial="hidden"
            animate="visible" exit={{ opacity: 0 }}>
            <ProfileSection showToast={showToast} user={user} onNameUpdate={handleNameUpdate} />
          </motion.div>
        )}
        {activeTab === 'company' && user?.isAdmin && (
          <motion.div key="company" variants={fadeUp} initial="hidden"
            animate="visible" exit={{ opacity: 0 }}>
            <CompanySection showToast={showToast} />
          </motion.div>
        )}
        {activeTab === 'users' && user?.isAdmin && (
          <motion.div key="users" variants={fadeUp} initial="hidden"
            animate="visible" exit={{ opacity: 0 }}>
            <UsersSection showToast={showToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}