import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pharmacy ERP</h1>
          <p className="text-white/80">Comprehensive Pharmaceutical Management System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
