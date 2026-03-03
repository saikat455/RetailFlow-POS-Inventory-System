import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateCompany from './pages/CreateCompany'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import POS from './pages/POS'
import NotFound from './pages/NotFound'
import Unauthorized from './pages/Unauthorized'
import MainLayout from './layouts/MainLayout'
import PrivateRoute from './components/PrivateRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/create-company" element={<CreateCompany />} />
          <Route path="/unauthorized"   element={<Unauthorized />} />

          {/* Protected */}
          <Route path="/" element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products"  element={<Products />} />
            <Route path="pos"       element={<POS />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}