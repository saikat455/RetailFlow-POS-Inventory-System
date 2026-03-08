import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token       = localStorage.getItem('token')
    const role        = localStorage.getItem('role')
    const name        = localStorage.getItem('name')
    const companyId   = localStorage.getItem('companyId')
    const companyName = localStorage.getItem('companyName')
    const branchId    = localStorage.getItem('branchId')
    const branchName  = localStorage.getItem('branchName')
    if (!token) return null
    return {
      token, role, name,
      companyId:   parseInt(companyId),
      companyName,
      branchId:    branchId ? parseInt(branchId) : null,
      branchName:  branchName || null,
      isAdmin:     role === 'Admin',
    }
  })

  const login = (data) => {
    localStorage.setItem('token',       data.token)
    localStorage.setItem('role',        data.role)
    localStorage.setItem('name',        data.name)
    localStorage.setItem('companyId',   data.companyId)
    localStorage.setItem('companyName', data.companyName)
    if (data.branchId)   localStorage.setItem('branchId',   data.branchId)
    else                 localStorage.removeItem('branchId')
    if (data.branchName) localStorage.setItem('branchName', data.branchName)
    else                 localStorage.removeItem('branchName')
    setUser({
      token:       data.token,
      role:        data.role,
      name:        data.name,
      companyId:   data.companyId,
      companyName: data.companyName,
      branchId:    data.branchId   ?? null,
      branchName:  data.branchName ?? null,
      isAdmin:     data.role === 'Admin',
    })
  }

  const logout = () => { localStorage.clear(); setUser(null) }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)