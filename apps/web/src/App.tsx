import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/inventory/ProductList';
import ProductDetails from './pages/inventory/ProductDetails';
import InventoryLots from './pages/inventory/InventoryLots';
import POSInterface from './pages/sales/POSInterface';
import SalesOrders from './pages/sales/SalesOrders';
import PurchaseOrders from './pages/purchase/PurchaseOrders';
import SupplierList from './pages/suppliers/SupplierList';
import CustomerList from './pages/customers/CustomerList';
import UserList from './pages/users/UserList';
import Reports from './pages/reports/Reports';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory/products" element={<ProductList />} />
          <Route path="/inventory/products/:id" element={<ProductDetails />} />
          <Route path="/inventory/lots" element={<InventoryLots />} />
          <Route path="/sales/pos" element={<POSInterface />} />
          <Route path="/sales/orders" element={<SalesOrders />} />
          <Route path="/purchase/orders" element={<PurchaseOrders />} />
          <Route path="/purchase/suppliers" element={<SupplierList />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/settings/users" element={<UserList />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
