import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DashboardStats, SalesTrendData, TopProductData } from '@/types';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';

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

  // Mock Sales Trend Data (7 days)
  // TODO: Replace with real API call when backend endpoint is ready
  const salesTrendData: SalesTrendData[] = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'dd/MM', { locale: th }),
      sales: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 30) + 10,
    };
  });

  // Mock Top Products Data
  // TODO: Replace with real API call
  const topProductsData: TopProductData[] = [
    { product_name: 'พาราเซตามอล 500mg', quantity_sold: 245, revenue: 12250 },
    { product_name: 'ไอบูโพรเฟน 400mg', quantity_sold: 189, revenue: 18900 },
    { product_name: 'วิตามิน C 1000mg', quantity_sold: 156, revenue: 15600 },
    { product_name: 'แอสไพริน 100mg', quantity_sold: 134, revenue: 10720 },
    { product_name: 'โอเมก้า 3', quantity_sold: 98, revenue: 19600 },
  ];

  // Mock Category Data for Pie Chart
  const categoryData = [
    { name: 'ยาแก้ปวด', value: 35, color: '#3b82f6' },
    { name: 'วิตามิน', value: 25, color: '#10b981' },
    { name: 'ยาแก้ไข้', value: 20, color: '#f59e0b' },
    { name: 'ยาแก้แพ้', value: 12, color: '#8b5cf6' },
    { name: 'อื่นๆ', value: 8, color: '#6b7280' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">ภาพรวมและสถิติสำคัญของระบบ</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>อัพเดทล่าสุด: {format(new Date(), 'HH:mm น.', { locale: th })}</span>
        </div>
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
          <div className="card hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ยอดขายวันนี้</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.today_sales)}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>+12.5% จากเมื่อวาน</span>
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="card hover:shadow-xl transition-all duration-300 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_products.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">รายการ</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Low Stock Items */}
          <div className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${stats.low_stock_items > 0 ? 'border-orange-500' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${stats.low_stock_items > 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                  สินค้าคงคลังต่ำ
                </p>
                <p className={`text-2xl font-bold ${stats.low_stock_items > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {stats.low_stock_items.toLocaleString()}
                </p>
                {stats.low_stock_items > 0 && (
                  <Link to="/inventory/lots" className="text-xs text-orange-600 mt-2 inline-block hover:underline">
                    ตรวจสอบทันที →
                  </Link>
                )}
              </div>
              <div className={`p-3 rounded-xl shadow-lg ${stats.low_stock_items > 0 ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gray-400'}`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Expiring Items */}
          <div className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${stats.expiring_items > 0 ? 'border-red-500' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${stats.expiring_items > 0 ? 'text-gray-600' : 'text-gray-500'}`}>
                  ใกล้หมดอายุ (30 วัน)
                </p>
                <p className={`text-2xl font-bold ${stats.expiring_items > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {stats.expiring_items.toLocaleString()}
                </p>
                {stats.expiring_items > 0 && (
                  <Link to="/inventory/lots" className="text-xs text-red-600 mt-2 inline-block hover:underline">
                    ตรวจสอบทันที →
                  </Link>
                )}
              </div>
              <div className={`p-3 rounded-xl shadow-lg ${stats.expiring_items > 0 ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-400'}`}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">แนวโน้มยอดขาย (7 วัน)</h2>
            <Link to="/sales/orders" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesTrendData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number) => [formatCurrency(value), 'ยอดขาย']}
              />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">สินค้าขายดี Top 5</h2>
            <Link to="/inventory/products" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProductsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="product_name" type="category" width={150} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  name === 'quantity_sold' ? `${value} ชิ้น` : formatCurrency(value),
                  name === 'quantity_sold' ? 'จำนวนขาย' : 'รายได้'
                ]}
              />
              <Legend />
              <Bar dataKey="quantity_sold" name="จำนวนขาย" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สัดส่วนยอดขายตามหมวดหมู่</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">สถิติรายเดือน</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">ยอดขายรวม</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(280000)}</p>
              <p className="text-xs text-blue-600 mt-1">เดือนนี้</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">ออเดอร์ทั้งหมด</p>
              <p className="text-xl font-bold text-green-900">387</p>
              <p className="text-xs text-green-600 mt-1">รายการ</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">ค่าเฉลี่ย/ออเดอร์</p>
              <p className="text-xl font-bold text-purple-900">{formatCurrency(723)}</p>
              <p className="text-xs text-purple-600 mt-1">บาท</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <p className="text-xs text-orange-600 font-medium mb-1">ลูกค้าใหม่</p>
              <p className="text-xl font-bold text-orange-900">24</p>
              <p className="text-xs text-orange-600 mt-1">คน</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ยอดขายสัปดาห์นี้</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(68500)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <span className="font-semibold">+8.3%</span>
                <span className="ml-1 text-gray-500">จากสัปดาห์ที่แล้ว</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">ออเดอร์สัปดาห์นี้</p>
                  <p className="text-2xl font-bold text-gray-900">94</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <span className="font-semibold">+5.2%</span>
                <span className="ml-1 text-gray-500">จากสัปดาห์ที่แล้ว</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">เมนูด่วน (Quick Actions)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link to="/sales/pos" className="flex flex-col items-center p-4 rounded-xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-cyan-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-cyan-900">ขายสินค้า</span>
          </Link>

          <Link to="/inventory/products" className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-gray-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">จัดการสินค้า</span>
          </Link>

          <Link to="/customers" className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-indigo-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">ลูกค้า</span>
          </Link>

          <Link to="/purchase/orders" className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-purple-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">ใบสั่งซื้อ</span>
          </Link>

          <Link to="/purchase/suppliers" className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-blue-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">ผู้จัดจำหน่าย</span>
          </Link>

          <Link to="/reports" className="flex flex-col items-center p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow-md">
            <div className="p-2 bg-green-600 rounded-lg mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">รายงาน</span>
          </Link>
        </div>
      </div>

      {/* Alerts Section */}
      {stats && (stats.low_stock_items > 0 || stats.expiring_items > 0) && (
        <div className="card border-l-4 border-yellow-500 bg-yellow-50">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">แจ้งเตือนสำคัญ (Alerts)</h3>
              <div className="space-y-2">
                {stats.low_stock_items > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200 shadow-sm">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⚠️</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          มีสินค้าคงคลังต่ำ {stats.low_stock_items} รายการ
                        </p>
                        <p className="text-sm text-gray-600">ควรสั่งซื้อเพิ่มเพื่อไม่ให้สินค้าหมด</p>
                      </div>
                    </div>
                    <Link to="/inventory/lots" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium text-sm">
                      ตรวจสอบ
                    </Link>
                  </div>
                )}

                {stats.expiring_items > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">⏰</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          มีสินค้าใกล้หมดอายุ {stats.expiring_items} รายการ (ภายใน 30 วัน)
                        </p>
                        <p className="text-sm text-gray-600">ควรจัดโปรโมชั่นหรือจำหน่ายก่อนหมดอายุ</p>
                      </div>
                    </div>
                    <Link to="/inventory/lots" className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium text-sm">
                      ตรวจสอบ
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
