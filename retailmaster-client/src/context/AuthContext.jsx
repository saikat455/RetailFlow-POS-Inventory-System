import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token       = localStorage.getItem('token')
    const role        = localStorage.getItem('role')
    const name        = localStorage.getItem('name')
    const companyId   = localStorage.getItem('companyId')
    const companyName = localStorage.getItem('companyName')
    return token ? { token, role, name, companyId: parseInt(companyId), companyName } : null
  })

  const login = (data) => {
    localStorage.setItem('token',       data.token)
    localStorage.setItem('role',        data.role)
    localStorage.setItem('name',        data.name)
    localStorage.setItem('companyId',   data.companyId)
    localStorage.setItem('companyName', data.companyName)
    setUser({
      token: data.token, role: data.role, name: data.name,
      companyId: data.companyId, companyName: data.companyName,
    })
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)