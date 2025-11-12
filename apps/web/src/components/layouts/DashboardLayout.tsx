import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">Pharmacy ERP</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.full_name}</span>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                {user?.role}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Dashboard
            </Link>

            <div className="pt-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Inventory
              </p>
              <Link
                to="/inventory/products"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Products
              </Link>
              <Link
                to="/inventory/lots"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Inventory Lots
              </Link>
            </div>

            <div className="pt-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Sales
              </p>
              <Link
                to="/sales/pos"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                POS
              </Link>
              <Link
                to="/sales/orders"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Sales Orders
              </Link>
            </div>

            <div className="pt-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Purchase
              </p>
              <Link
                to="/purchase/orders"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Purchase Orders
              </Link>
            </div>

            <div className="pt-4">
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Reports
              </p>
              <Link
                to="/reports"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Reports & Analytics
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
