import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobOrderList from './pages/JobOrderList';
import TrackJob from './pages/TrackJob';
import BookingPage from './pages/BookingPage';
import PartsShop from './pages/PartsShop';

import CustomerList from './pages/CustomerList';
import VehicleList from './pages/VehicleList';
import CustomerLogin from './pages/CustomerLogin';
import CustomerSignup from './pages/CustomerSignup';
import MyGarage from './pages/MyGarage';
import CustomerProfile from './pages/CustomerProfile';
import OrderReceipt from './pages/OrderReceipt';

import AppointmentManager from './pages/AppointmentManager';


import InventoryList from './pages/InventoryList';
import InquiryList from './pages/InquiryList';
import InvoiceList from './pages/InvoiceList';
import ReceiptView from './pages/ReceiptView';
import CustomerHistory from './pages/CustomerHistory';
import SecuritySettings from './pages/SecuritySettings';
import PendingPayments from './pages/PendingPayments';


import PublicNavbar from './components/PublicNavbar';
import Home from './pages/Home';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  // If not logged in, go to login
  if (!user) return <Navigate to="/login" />;

  // If logged in as customer, they shouldn't be in the admin dashboard
  if (user.role === 'CUSTOMER') return <Navigate to="/my-garage" />;

  return children;
};

// Wrapper for public pages to include Navbar
const PublicLayout = ({ children }) => (
  <>
    <PublicNavbar />
    {children}
  </>
);

const App = () => {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/track" element={<PublicLayout><TrackJob /></PublicLayout>} />
            <Route path="/book" element={<PublicLayout><BookingPage /></PublicLayout>} />
            <Route path="/shop" element={<PublicLayout><PartsShop /></PublicLayout>} />
            <Route path="/customer-login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerSignup />} />
            <Route path="/my-garage" element={<PublicLayout><MyGarage /></PublicLayout>} />
            <Route path="/profile" element={<PublicLayout><CustomerProfile /></PublicLayout>} />
            <Route path="/order-receipt/:id" element={<PublicLayout><OrderReceipt /></PublicLayout>} />

            <Route path="/receipt/:id" element={<PublicLayout><ReceiptView /></PublicLayout>} />

            {/* Admin Protected Routes */}
            <Route path="/dashboard" element={
              <StaffRoute>
                <Layout />
              </StaffRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/:id/history" element={<CustomerHistory />} />
              <Route path="vehicles" element={<VehicleList />} />
              <Route path="job-orders" element={<JobOrderList />} />
              <Route path="appointments" element={<AppointmentManager />} />
              <Route path="inventory" element={<InventoryList />} />
              <Route path="invoices" element={<InvoiceList />} />
              <Route path="inquiries" element={<InquiryList />} />
              <Route path="pending-payments" element={<PendingPayments />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="reports" element={<div className="p-8"><h1 className="text-2xl font-bold">Business Reports</h1><p className="mt-4 text-slate-400 border-l-4 border-blue-500 pl-4">Advanced analytics are available on the main Dashboard.</p></div>} />
            </Route>

            {/* Fallback for legacy / access by admin */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  );
};

export default App;
