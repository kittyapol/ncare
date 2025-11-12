import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DashboardStats } from '@/types';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard-summary');
      return response.data as DashboardStats;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล Dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">ภาพรวมและสถิติสำคัญของระบบ</p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Sales */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">ยอดขายวันนี้</p>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {formatCurrency(stats.today_sales)}
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-blue-600">
              <Link to="/sales-orders" className="hover:underline">
                ดูรายละเอียด →
              </Link>
            </div>
          </div>

          {/* Total Products */}
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {stats.total_products.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600">
              <Link to="/products" className="hover:underline">
                จัดการสินค้า →
              </Link>
            </div>
          </div>

          {/* Low Stock Items */}
          <div
            className={`card bg-gradient-to-br ${
              stats.low_stock_items > 0
                ? 'from-orange-50 to-orange-100 border-orange-200'
                : 'from-gray-50 to-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    stats.low_stock_items > 0 ? 'text-orange-600' : 'text-gray-600'
                  }`}
                >
                  สินค้าคงคลังต่ำ
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    stats.low_stock_items > 0 ? 'text-orange-900' : 'text-gray-900'
                  }`}
                >
                  {stats.low_stock_items.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  stats.low_stock_items > 0 ? 'bg-orange-500' : 'bg-gray-400'
                }`}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            {stats.low_stock_items > 0 && (
              <div className="mt-4 flex items-center text-xs text-orange-600">
                <Link to="/inventory" className="hover:underline">
                  ตรวจสอบทันที →
                </Link>
              </div>
            )}
          </div>

          {/* Expiring Items */}
          <div
            className={`card bg-gradient-to-br ${
              stats.expiring_items > 0
                ? 'from-red-50 to-red-100 border-red-200'
                : 'from-gray-50 to-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${
                    stats.expiring_items > 0 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  ใกล้หมดอายุ (30 วัน)
                </p>
                <p
                  className={`text-2xl font-bold mt-2 ${
                    stats.expiring_items > 0 ? 'text-red-900' : 'text-gray-900'
                  }`}
                >
                  {stats.expiring_items.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  stats.expiring_items > 0 ? 'bg-red-500' : 'bg-gray-400'
                }`}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            {stats.expiring_items > 0 && (
              <div className="mt-4 flex items-center text-xs text-red-600">
                <Link to="/inventory" className="hover:underline">
                  ตรวจสอบทันที →
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">เมนูด่วน (Quick Actions)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link
            to="/pos"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <svg
              className="w-8 h-8 text-primary-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-sm font-medium text-primary-900">ขายสินค้า</span>
          </Link>

          <Link
            to="/products"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">จัดการสินค้า</span>
          </Link>

          <Link
            to="/customers"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">ลูกค้า</span>
          </Link>

          <Link
            to="/purchase-orders"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">ใบสั่งซื้อ</span>
          </Link>

          <Link
            to="/suppliers"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">ผู้จัดจำหน่าย</span>
          </Link>

          <Link
            to="/inventory"
            className="flex flex-col items-center p-4 rounded-lg border-2 border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700">สินค้าคงคลัง</span>
          </Link>
        </div>
      </div>

      {/* Alerts Section */}
      {stats && (stats.low_stock_items > 0 || stats.expiring_items > 0) && (
        <div className="card border-l-4 border-yellow-500 bg-yellow-50">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-yellow-600 mt-1 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                แจ้งเตือนสำคัญ (Alerts)
              </h3>
              <div className="space-y-2">
                {stats.low_stock_items > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          มีสินค้าคงคลังต่ำ {stats.low_stock_items} รายการ
                        </p>
                        <p className="text-sm text-gray-600">
                          ควรสั่งซื้อเพิ่มเพื่อไม่ให้สินค้าหมด
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/inventory"
                      className="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      ตรวจสอบ
                    </Link>
                  </div>
                )}

                {stats.expiring_items > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⏰</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          มีสินค้าใกล้หมดอายุ {stats.expiring_items} รายการ (ภายใน 30 วัน)
                        </p>
                        <p className="text-sm text-gray-600">
                          ควรจัดโปรโมชั่นหรือจำหน่ายก่อนหมดอายุ
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/inventory"
                      className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                    >
                      ตรวจสอบ
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ระบบจัดการร้านขายยา</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>POS System - ระบบขายหน้าร้าน</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Inventory Management - จัดการสินค้าคงคลัง</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Purchase Orders - ระบบสั่งซื้อสินค้า</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Customer Management - จัดการข้อมูลลูกค้า</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Thai Tax Compliance - ระบบภาษีไทย VAT 7%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลเพิ่มเติม</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-900 mb-1">ระบบอัพเดทอัตโนมัติ</p>
              <p className="text-blue-700 text-xs">
                ข้อมูล Dashboard จะอัพเดททุก 1 นาที เพื่อความแม่นยำของข้อมูล
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium text-green-900 mb-1">รองรับภาษาไทย</p>
              <p className="text-green-700 text-xs">
                ระบบรองรับการทำงานเป็นภาษาไทย พร้อมใบเสร็จตามมาตรฐานกรมสรรพากร
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-medium text-purple-900 mb-1">ระบบ Loyalty Program</p>
              <p className="text-purple-700 text-xs">
                สะสมคะแนนลูกค้า และระดับสมาชิก (Bronze, Silver, Gold, Platinum)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
