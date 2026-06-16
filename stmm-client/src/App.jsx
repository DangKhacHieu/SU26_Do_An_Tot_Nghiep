import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layout
import AccountantLayout from './components/layout/AccountantLayout';

// Pages
import Login from './pages/Login';

// Accountant Pages
import Dashboard from './pages/accountant/Dashboard';
import FinancialConfig from './pages/accountant/FinancialConfig';
import PeriodicInvoices from './pages/accountant/PeriodicInvoices';
import ViolationsPenalties from './pages/accountant/ViolationsPenalties';
import RepairPrice from './pages/accountant/RepairPrice';
import PaymentVerification from './pages/accountant/PaymentVerification';
import ProfileManagement from './pages/accountant/ProfileManagement';

// Guard components
function ProtectedRoute() {
  const session = localStorage.getItem('user_session');
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicRoute({ children }) {
  const session = localStorage.getItem('user_session');
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Protected Accountant Portal Routing */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AccountantLayout />}>
            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Sub-routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="financial-config" element={<FinancialConfig />} />
            <Route path="periodic-invoices" element={<PeriodicInvoices />} />
            <Route path="violations-penalties" element={<ViolationsPenalties />} />
            <Route path="repair-price" element={<RepairPrice />} />
            <Route path="payment-verification" element={<PaymentVerification />} />
            <Route path="profile-management" element={<ProfileManagement />} />
          </Route>
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
