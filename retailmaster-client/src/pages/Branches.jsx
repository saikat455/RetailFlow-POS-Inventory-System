import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/* ── tiny helpers ── */
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl border
      ${toast.type === 'success'
        ? 'bg-white text-green-700 border-green-100 shadow-green-100/50'
        : 'bg-white text-red-600 border-red-100 shadow-red-100/50'}`}
      style={{ animation: 'slideIn .2s ease' }}>
      <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill text-green-500' : 'bi-exclamation-circle-fill text-red-400'}`} />
      {toast.msg}
    </div>
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
    } catch { }
    finally { setRegen(false) }
  }

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
      <span className="font-mono font-bold text-sm tracking-widest text-gray-700">{current}</span>
      <div className="flex gap-1 ml-1">
        <button onClick={copy} title="Copy invite code"
          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all cursor-pointer border-0
            ${copied ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-blue-500 hover:text-white text-gray-500'}`}>
          <i className={`bi ${copied ? 'bi-check-lg' : 'bi-copy'}`} />
        </button>
        <button onClick={regenerate} title="Regenerate code" disabled={regen}
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs bg-gray-200 hover:bg-amber-500 hover:text-white text-gray-500 transition-all cursor-pointer border-0 disabled:opacity-50">
          <i className={`bi bi-arrow-repeat ${regen ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}

const emptyForm = { name: '', address: '', phone: '', isDefault: false }

export default function Branches() {
  const { user }  = useAuth()
  const isAdmin   = user?.isAdmin

  const [branches, setBranches]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(null)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]               = useState(emptyForm)
  const [formError, setFormError]     = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [toast, setToast]             = useState(null)

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

  const openCreate = () => { setForm(emptyForm); setFormError(''); setEditTarget(null); setModal('create') }
  const openEdit   = (b) => {
    setForm({ name: b.name, address: b.address || '', phone: b.phone || '', isDefault: b.isDefault })
    setFormError(''); setEditTarget(b); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditTarget(null); setFormError('') }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setFormLoading(true)
    try {
      if (modal === 'create') { await api.post('/branches', form); showToast('Branch created!') }
      else { await api.put(`/branches/${editTarget.id}`, form); showToast('Branch updated!') }
      closeModal(); load()
    } catch (err) { setFormError(err.response?.data?.message || 'Something went wrong.') }
    finally { setFormLoading(false) }
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

  const inputCls = `w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition-all
    font-[inherit] bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-3 focus:ring-blue-100 focus:bg-white`

  /* ── Cashier view: read-only, single branch ── */
  if (!isAdmin) {
    const branch = branches[0]
    return (
      <div className="max-w-[500px]">
        <Toast toast={toast} />
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">My Branch</h1>
        <p className="text-sm text-gray-400 mb-6">Your assigned work location</p>

        {loading ? (
          <div className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ) : !branch ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <i className="bi bi-building text-4xl block mb-2 text-gray-200" />
            No branch assigned
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <i className="bi bi-building-fill text-white text-xl" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">{branch.name}</div>
                  <div className="text-blue-100 text-xs">{user?.companyName}</div>
                </div>
                {branch.isDefault && (
                  <span className="ml-auto bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    Main Branch
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { icon: 'bi-geo-alt-fill', label: 'Address', value: branch.address || '—', color: 'text-blue-500' },
                { icon: 'bi-telephone-fill', label: 'Phone', value: branch.phone || '—', color: 'text-green-500' },
                { icon: 'bi-receipt', label: 'Total Sales', value: branch.saleCount, color: 'text-purple-500' },
                { icon: 'bi-people-fill', label: 'Team Size', value: branch.userCount, color: 'text-amber-500' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`bi ${item.icon} text-xs ${item.color}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{item.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3">
                <i className="bi bi-shield-check-fill text-blue-400 text-base flex-shrink-0" />
                <div className="text-xs text-blue-600 leading-relaxed">
                  Your account is locked to this branch. You can only view and manage data for <strong>{branch.name}</strong>.
                </div>
              </div>
            </div>
          </div>
        )}
        <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
      </div>
    )
  }

  /* ── Admin view: full management ── */
  return (
    <div className="max-w-[1000px]">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Branches</h1>
          <p className="text-sm text-gray-400 mt-0.5">{branches.length} branch{branches.length !== 1 ? 'es' : ''} · {user?.companyName}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold
            transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-200 cursor-pointer border-0 font-[inherit]">
          <i className="bi bi-plus-lg" /> Add Branch
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-52 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
          <i className="bi bi-building text-5xl text-gray-200 block mb-3" />
          <p className="text-gray-400 font-medium mb-4">No branches yet</p>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
            <i className="bi bi-plus-lg" /> Create first branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map(b => (
            <div key={b.id}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md
                ${b.isDefault ? 'border-blue-100' : 'border-gray-100'}`}>

              {/* Card top bar */}
              <div className={`h-1.5 w-full ${b.isDefault ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-gray-200 to-gray-300'}`} />

              <div className="p-5">
                {/* Title row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${b.isDefault ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <i className={`bi bi-building-fill text-base ${b.isDefault ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base leading-tight">{b.name}</div>
                      {b.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mt-0.5">
                          <i className="bi bi-star-fill text-[8px]" /> Default
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(b)} title="Edit"
                      className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 flex items-center justify-center transition-all cursor-pointer border text-xs">
                      <i className="bi bi-pencil-fill" />
                    </button>
                    {!b.isDefault && (
                      <button onClick={() => setDeleteTarget(b)} title="Delete"
                        className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer border text-xs">
                        <i className="bi bi-trash3-fill" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1.5 text-xs text-gray-500 mb-4">
                  {b.address && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-geo-alt-fill text-gray-300 w-3.5 flex-shrink-0" />{b.address}
                    </div>
                  )}
                  {b.phone && (
                    <div className="flex items-center gap-2">
                      <i className="bi bi-telephone-fill text-gray-300 w-3.5 flex-shrink-0" />{b.phone}
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: 'bi-receipt', label: 'Sales', value: b.saleCount, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { icon: 'bi-people-fill', label: 'Cashiers', value: b.userCount, color: 'text-green-500', bg: 'bg-green-50' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-lg px-3 py-2 flex items-center gap-2`}>
                      <i className={`bi ${s.icon} text-xs ${s.color}`} />
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className="ml-auto font-bold text-gray-700 text-sm">{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Invite code section */}
                <div className="border-t border-gray-100 pt-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <i className="bi bi-key-fill text-yellow-400" /> Branch Invite Code
                    </span>
                    <span className="text-[10px] text-gray-300">Share with cashiers</span>
                  </div>
                  <InviteCodeBadge
                    code={b.inviteCode}
                    branchId={b.id}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-[480px] shadow-2xl"
            style={{ animation: 'popIn .18s ease' }} onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {modal === 'create' ? 'Add New Branch' : `Edit "${editTarget?.name}"`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal === 'create' ? 'A unique invite code will be generated automatically.' : 'Update branch information.'}
                </p>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer border-0 bg-transparent text-lg">
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
                <i className="bi bi-exclamation-circle-fill flex-shrink-0" />{formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Branch Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  required placeholder="e.g. Dhanmondi Branch" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Address</label>
                <input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))}
                  placeholder="Branch address" className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                  placeholder="+880 1700 000000" className={inputCls} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" checked={form.isDefault}
                    onChange={e => setForm(f => ({...f, isDefault: e.target.checked}))}
                    className="sr-only peer" />
                  <div className="w-10 h-5.5 h-[22px] bg-gray-200 peer-checked:bg-blue-500 rounded-full transition-colors" style={{height:'22px'}} />
                  <div className="absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-[18px]" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Set as default branch</span>
                  <span className="text-xs text-gray-400">This branch is pre-selected in POS</span>
                </div>
              </label>
              <div className="flex gap-3 justify-end pt-1">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
                  {formLoading
                    ? <><i className="bi bi-arrow-repeat animate-spin" /> Saving...</>
                    : modal === 'create' ? <><i className="bi bi-plus-lg" /> Create Branch</> : <><i className="bi bi-check-lg" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
          onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[380px] shadow-2xl overflow-hidden"
            style={{ animation: 'popIn .18s ease' }} onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-trash3-fill text-red-500 text-2xl" />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Delete Branch?</h3>
              <p className="text-sm text-gray-400 mb-1">
                <strong className="text-gray-700">"{deleteTarget.name}"</strong> will be removed.
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-5">
                <i className="bi bi-exclamation-triangle-fill mr-1" />
                Branches with existing sales records cannot be deleted.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 cursor-pointer bg-transparent font-[inherit]">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold cursor-pointer border-0 font-[inherit]">
                  <i className="bi bi-trash3-fill" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn  { from { transform: scale(0.94); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideIn{ from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  )
}