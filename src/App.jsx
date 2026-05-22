import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Account from './pages/Account';
import Transactions from './pages/Transactions';
import Billing from './pages/Billing';
import Trunks from './pages/Trunks';
import Rates from './pages/Rates';
import DIDs from './pages/DIDs';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<Account />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/trunks" element={<Trunks />} />
            <Route path="/rates" element={<Rates />} />
            <Route path="/dids" element={<DIDs />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
