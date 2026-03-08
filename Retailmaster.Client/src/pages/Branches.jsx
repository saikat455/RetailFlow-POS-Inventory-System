
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { fadeUp, scaleIn, listItem } from '../motion'
import api from '../services/api'

function Toast({ toast }) {
  if (!toast) return null
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3
        rounded-xl text-sm font-semibold shadow-xl max-w-[90vw]
        ${toast.type === 'success' ? 'alert alert-success' : 'alert alert-error'}`}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
      {toast.msg}
    </motion.div>
  )
}

function InviteCodeBadge({ code, onRegenerate, branchId }) {
  const [copied, setCopied]   = useState(false)
  const [regen, setRegen]     = useState(false)
  const [current, setCurrent] = useState(code)

  const copy = () => {
    navigator.clipboard.writeText(current)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const regenerate = async () => {
    setRegen(true)
    try {
      const r = await api.post(`/branches/${branchId}/regenerate-code`)
      setCurrent(r.data.inviteCode)
      onRegenerate(branchId, r.data.inviteCode)
    } catch {}
    finally { setRegen(false) }
  }

  return (
    <div className="flex items-center gap-2 bg-base-200 border border-base-300
      rounded-lg px-3 py-1.5 flex-wrap">
      <span className="font-mono font-bold text-sm tracking-widest text-base-content">
        {current}
      </span>
      <div className="flex gap-1 ml-auto">
        <button onClick={copy} title="Copy"
          className={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'} border border-base-300`}>
          <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <button onClick={regenerate} disabled={regen} title="Regenerate"
          className="btn btn-xs btn-ghost border border-base-300">
          <i className={`bi bi-arrow-repeat ${regen ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}

const emptyForm = { name: '', address: '', phone: '', isDefault: false }

export default function Branches() {
  const { user } = useAuth()
  const isAdmin  = user?.isAdmin

  const [branches, setBranches]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [formError, setFormError]       = useState('')
  const [formLoading, setFormLoading]   = useState(false)
  const [toast, setToast]               = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/branches'); setBranches(r.data) }
    catch { showToast('Failed to load branches.', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(emptyForm); setFormError(''); setEditTarget(null); setModal('create')
  }
  const openEdit = (b) => {
    setForm({ name: b.name, address: b.address || '', phone: b.phone || '', isDefault: b.isDefault })
    setFormError(''); setEditTarget(b); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditTarget(null); setFormError('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      if (modal === 'create') {
        await api.post('/branches', form); showToast('Branch created!')
      } else {
        await api.put(`/branches/${editTarget.id}`, form); showToast('Branch updated!')
      }
      closeModal(); load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Something went wrong.')
    } finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/branches/${deleteTarget.id}`)
      showToast(`"${deleteTarget.name}" deleted.`)
      setDeleteTarget(null); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed.', 'error')
      setDeleteTarget(null)
    }
  }

  const handleRegenerate = (branchId, newCode) => {
    setBranches(prev => prev.map(b => b.id === branchId ? { ...b, inviteCode: newCode } : b))
    showToast('Invite code regenerated!')
  }

  /* ── Cashier view ── */
  if (!isAdmin) {
    const branch = branches[0]
    return (
      <div className="max-w-[500px] pb-20 lg:pb-0">
        <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">My Branch</h1>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">Your assigned work location</p>
        </motion.div>

        {loading ? (
          <div className="skeleton h-44 sm:h-48 w-full rounded-2xl" />
        ) : !branch ? (
          <div className="card bg-base-100 border border-base-300 py-10 text-center
            text-base-content/40">
            <i className="bi bi-building text-4xl block mb-2 text-base-content/20" />
            No branch assigned
          </div>
        ) : (
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="card bg-base-100 border-2 border-primary/20 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-secondary px-5 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/20 rounded-xl
                  flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-building-fill text-white text-lg sm:text-xl" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-base sm:text-lg truncate">
                    {branch.name}
                  </div>
                  <div className="text-white/70 text-xs truncate">{user?.companyName}</div>
                </div>
                {branch.isDefault && (
                  <span className="ml-auto badge badge-sm bg-white/20 text-white border-0
                    flex-shrink-0">
                    Main
                  </span>
                )}
              </div>
            </div>
            <div className="card-body p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: 'bi-geo-alt-fill',  label: 'Address',     value: branch.address || '—', color: 'text-primary'   },
                { icon: 'bi-telephone-fill',label: 'Phone',       value: branch.phone || '—',   color: 'text-success'   },
                { icon: 'bi-receipt',       label: 'Total Sales', value: branch.saleCount,      color: 'text-secondary' },
                { icon: 'bi-people-fill',   label: 'Team Size',   value: branch.userCount,      color: 'text-warning'   },
              ].map((item, i) => (
                <div key={i} className="bg-base-200 rounded-xl p-3 sm:p-3.5">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <i className={`bi ${item.icon} text-xs ${item.color}`} />
                    <span className="text-[10px] sm:text-[11px] font-bold text-base-content/40
                      uppercase tracking-wide">{item.label}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-base-content truncate">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  /* ── Admin view ── */
  return (
    <div className="max-w-[1000px] pb-20 lg:pb-0">
      <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>

      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        className="flex items-start justify-between mb-5 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">Branches</h1>
          <p className="text-xs sm:text-sm text-base-content/50 mt-0.5">
            {branches.length} branch{branches.length !== 1 ? 'es' : ''} · {user?.companyName}
          </p>
        </div>
        <button onClick={openCreate}
          className="btn btn-primary btn-sm sm:btn-md gap-1.5 sm:gap-2 flex-shrink-0">
          <i className="bi bi-plus-lg" />
          <span className="hidden xs:inline">Add Branch</span>
          <span className="xs:hidden">Add</span>
        </button>
      </motion.div>

      {/* Branch cards — 1 col mobile, 2 col sm+ */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 sm:h-52 w-full rounded-2xl" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="card bg-base-100 border border-base-300 py-16 sm:py-20 text-center">
          <i className="bi bi-building text-4xl sm:text-5xl text-base-content/20 block mb-3" />
          <p className="text-base-content/50 font-medium mb-4 text-sm sm:text-base">
            No branches yet
          </p>
          <button onClick={openCreate} className="btn btn-primary btn-sm gap-2 mx-auto">
            <i className="bi bi-plus-lg" /> Create first branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {branches.map((b, i) => (
            <motion.div key={b.id} variants={listItem} initial="hidden" animate="visible" custom={i}
              className={`card bg-base-100 border-2 shadow-sm overflow-hidden
                hover:-translate-y-0.5 transition-all
                ${b.isDefault ? 'border-primary/30' : 'border-base-300'}`}>
              <div className={`h-1.5 w-full
                ${b.isDefault
                  ? 'bg-gradient-to-r from-primary to-secondary'
                  : 'bg-gradient-to-r from-base-300 to-base-300'}`} />
              <div className="card-body p-4 sm:p-5">
                {/* Card header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center
                      justify-center flex-shrink-0
                      ${b.isDefault
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-base-200 border border-base-300'}`}>
                      <i className={`bi bi-building-fill text-sm sm:text-base
                        ${b.isDefault ? 'text-primary' : 'text-base-content/40'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-base-content text-sm sm:text-base
                        leading-tight truncate">
                        {b.name}
                      </div>
                      {b.isDefault && (
                        <span className="badge badge-primary badge-sm mt-0.5">Default</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(b)}
                      className="btn btn-xs btn-ghost border border-base-300 text-primary">
                      <i className="bi bi-pencil-fill" />
                    </button>
                    {!b.isDefault && (
                      <button onClick={() => setDeleteTarget(b)}
                        className="btn btn-xs btn-ghost border border-base-300 text-error">
                        <i className="bi bi-trash3-fill" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Address / phone */}
                <div className="flex flex-col gap-1 sm:gap-1.5 text-xs text-base-content/50 mb-3 sm:mb-4">
                  {b.address && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-geo-alt-fill text-base-content/30 w-3.5 flex-shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone-fill text-base-content/30 w-3.5 flex-shrink-0" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                  <div className="bg-secondary/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <i className="bi bi-receipt text-xs text-secondary flex-shrink-0" />
                    <span className="text-xs text-base-content/60">Sales</span>
                    <span className="ml-auto font-bold text-base-content text-sm">{b.saleCount}</span>
                  </div>
                  <div className="bg-success/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <i className="bi bi-people-fill text-xs text-success flex-shrink-0" />
                    <span className="text-xs text-base-content/60">Staff</span>
                    <span className="ml-auto font-bold text-base-content text-sm">{b.userCount}</span>
                  </div>
                </div>

                {/* Invite code */}
                <div className="border-t border-base-300 pt-3 sm:pt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest
                      text-base-content/40 flex items-center gap-1">
                      <i className="bi bi-key-fill text-warning" /> Invite Code
                    </span>
                    <span className="text-[10px] text-base-content/30 hidden sm:block">
                      Share with cashiers
                    </span>
                  </div>
                  <InviteCodeBadge
                    code={b.inviteCode} branchId={b.id}
                    onRegenerate={handleRegenerate} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
            className="card bg-base-100 w-full max-w-[460px] shadow-2xl rounded-2xl overflow-hidden"
            onClick={closeModal}>
            <div
              className="card bg-base-100 w-full sm:max-w-[480px] shadow-2xl
                rounded-t-2xl sm:rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-base-300 rounded-full mx-auto mt-3 sm:hidden" />
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-base-content text-sm sm:text-base">
                      {modal === 'create' ? 'Add New Branch' : `Edit "${editTarget?.name}"`}
                    </h3>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {modal === 'create'
                        ? 'A unique invite code will be auto-generated.'
                        : 'Update branch information.'}
                    </p>
                  </div>
                  <button onClick={closeModal}
                    className="btn btn-ghost btn-sm btn-square flex-shrink-0">
                    <i className="bi bi-x-lg" />
                  </button>
                </div>

                <AnimatePresence>
                  {formError && (
                    <motion.div variants={fadeUp} initial="hidden" animate="visible"
                      exit={{ opacity: 0 }} className="alert alert-error text-sm py-2.5 mt-2">
                      <i className="bi bi-exclamation-circle-fill" />{formError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 mt-3">
                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                        Branch Name *
                      </span>
                    </label>
                    <input value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required placeholder="e.g. Dhanmondi Branch"
                      className="input input-bordered w-full" />
                  </div>
                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                        Address
                      </span>
                    </label>
                    <input value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Branch address" className="input input-bordered w-full" />
                  </div>
                  <div className="form-control">
                    <label className="label pb-1.5">
                      <span className="label-text text-[11px] font-bold uppercase tracking-wide">
                        Phone
                      </span>
                    </label>
                    <input value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+880 1700 000000" className="input input-bordered w-full" />
                  </div>
                  <label className="label cursor-pointer justify-start gap-3 p-3
                    bg-base-200 rounded-xl border border-base-300
                    hover:border-primary/30 transition-colors">
                    <input type="checkbox" checked={form.isDefault}
                      onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                      className="toggle toggle-primary toggle-sm" />
                    <div>
                      <span className="label-text font-semibold block">Set as default branch</span>
                      <span className="label-text-alt text-base-content/50">Pre-selected in POS</span>
                    </div>
                  </label>
                  <div className="flex gap-3 justify-end pt-1">
                    <button type="button" onClick={closeModal}
                      className="btn btn-ghost border border-base-300">Cancel</button>
                    <button type="submit" disabled={formLoading} className="btn btn-primary gap-2">
                      {formLoading
                        ? <><span className="loading loading-spinner loading-sm" /> Saving…</>
                        : modal === 'create'
                          ? <><i className="bi bi-plus-lg" /> Create</>
                          : <><i className="bi bi-check-lg" /> Save</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit"
            className="card bg-base-100 w-full max-w-[360px] shadow-2xl rounded-2xl overflow-hidden"
            onClick={() => setDeleteTarget(null)}>
            <div
              className="card bg-base-100 w-full sm:max-w-[380px] shadow-2xl
                rounded-t-2xl sm:rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-base-300 rounded-full mx-auto mt-3 sm:hidden" />
              <div className="card-body p-5 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-error/10 border-2 border-error/20
                  rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="bi bi-trash3-fill text-error text-xl sm:text-2xl" />
                </div>
                <h3 className="font-bold text-base-content text-sm sm:text-base mb-1">
                  Delete Branch?
                </h3>
                <p className="text-sm text-base-content/50 mb-1">
                  <strong className="text-base-content">"{deleteTarget.name}"</strong> will be removed.
                </p>
                <div className="alert alert-warning text-xs py-2 mb-5">
                  <i className="bi bi-exclamation-triangle-fill" />
                  Branches with existing sales cannot be deleted.
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)}
                    className="btn flex-1 btn-ghost border border-base-300">Cancel</button>
                  <button onClick={handleDelete} className="btn btn-error flex-1 gap-2">
                    <i className="bi bi-trash3-fill" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}