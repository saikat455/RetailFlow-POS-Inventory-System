import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import PrivateRoute      from './components/PrivateRoute'
import Landing           from './pages/Landing' 
import MainLayout        from './layouts/MainLayout'
import Login             from './pages/Login'
import Register          from './pages/Register'
import CreateCompany     from './pages/CreateCompany'
import Dashboard         from './pages/Dashboard'
import Products          from './pages/Products'
import POS               from './pages/POS'
import Branches          from './pages/Branches'
import Transactions      from './pages/Transactions'
import SalesReport       from './pages/SalesReport'
import Invoice           from './pages/Invoice'
import Settings          from './pages/Settings'
import NotFound          from './pages/NotFound'
import ForgotPassword    from './pages/ForgotPassword'
import ResetPassword     from './pages/ResetPassword'
import OnlineBranches    from './pages/Online/OnlineBranches'
import BranchMenu        from './pages/Online/BranchMenu'
import Checkout          from './pages/Online/Checkout'
import OrderConfirmation from './pages/Online/OrderConfirmation'
import OrdersDashboard from './pages/Orders/OrdersDashboard'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes ── */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-company" element={<CreateCompany />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* ── Online Ordering (public) ── */}
          <Route path="/online" element={<OnlineBranches />} />
          <Route path="/online/branch/:branchId" element={<BranchMenu />} />
          <Route path="/online/checkout" element={<Checkout />} />
          <Route path="/online/order-confirmation/:orderNumber" element={<OrderConfirmation />} />

          {/* ── Invoice — full page, no sidebar ── */}
          <Route
            path="/invoice/:invoiceNo"
            element={<PrivateRoute><Invoice /></PrivateRoute>}
          />

          {/* ── Protected app (sidebar layout) - DIFFERENT BASE PATH ── */}
          <Route
            path="/app"
            element={<PrivateRoute><MainLayout /></PrivateRoute>}
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="pos" element={<POS />} />
            <Route path="branches" element={<Branches />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<SalesReport />} />
            <Route path="settings" element={<Settings />} />
            <Route path="orders" element={<OrdersDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}