import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/error/ErrorBoundary';

// Layouts - Keep as eager imports since they're always needed
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Lazy load all page components for better code splitting
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProductList = lazy(() => import('./pages/inventory/ProductList'));
const ProductDetails = lazy(() => import('./pages/inventory/ProductDetails'));
const InventoryLots = lazy(() => import('./pages/inventory/InventoryLots'));
const POSInterface = lazy(() => import('./pages/sales/POSInterface'));
const SalesOrders = lazy(() => import('./pages/sales/SalesOrders'));
const PurchaseOrders = lazy(() => import('./pages/purchase/PurchaseOrders'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'));
const CustomerList = lazy(() => import('./pages/customers/CustomerList'));
const UserList = lazy(() => import('./pages/users/UserList'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <Suspense fallback={<LoadingSpinner fullScreen message="กำลังโหลดหน้าเข้าสู่ระบบ..." />}>
                  <Login />
                </Suspense>
              }
            />
          </Route>

          {/* Protected routes */}
          <Route
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดแดชบอร์ด..." />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/inventory/products"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดรายการสินค้า..." />}>
                  <ProductList />
                </Suspense>
              }
            />
            <Route
              path="/inventory/products/:id"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดรายละเอียดสินค้า..." />}>
                  <ProductDetails />
                </Suspense>
              }
            />
            <Route
              path="/inventory/lots"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดข้อมูล Lot..." />}>
                  <InventoryLots />
                </Suspense>
              }
            />
            <Route
              path="/sales/pos"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดจุดขาย..." />}>
                  <POSInterface />
                </Suspense>
              }
            />
            <Route
              path="/sales/orders"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดประวัติการขาย..." />}>
                  <SalesOrders />
                </Suspense>
              }
            />
            <Route
              path="/purchase/orders"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดใบสั่งซื้อ..." />}>
                  <PurchaseOrders />
                </Suspense>
              }
            />
            <Route
              path="/purchase/suppliers"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดรายชื่อซัพพลายเออร์..." />}>
                  <SupplierList />
                </Suspense>
              }
            />
            <Route
              path="/prescriptions"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดใบสั่งยา..." />}>
                  <Prescriptions />
                </Suspense>
              }
            />
            <Route
              path="/customers"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดรายชื่อลูกค้า..." />}>
                  <CustomerList />
                </Suspense>
              }
            />
            <Route
              path="/settings/users"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดการจัดการผู้ใช้..." />}>
                  <UserList />
                </Suspense>
              }
            />
            <Route
              path="/reports"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลดรายงาน..." />}>
                  <Reports />
                </Suspense>
              }
            />

            {/* 404 Not Found - Must be last */}
            <Route
              path="*"
              element={
                <Suspense fallback={<LoadingSpinner message="กำลังโหลด..." />}>
                  <NotFound />
                </Suspense>
              }
            />
          </Route>

          {/* Catch-all 404 for non-protected routes */}
          <Route
            path="*"
            element={
              <Suspense fallback={<LoadingSpinner fullScreen message="กำลังโหลด..." />}>
                <NotFound />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
