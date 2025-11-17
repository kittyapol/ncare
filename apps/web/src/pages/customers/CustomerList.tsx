import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@/types';
import CustomerForm from '@/components/forms/CustomerForm';
import CustomerProfileModal from '@/components/modals/CustomerProfileModal';
import api from '@/services/api';
import { format } from 'date-fns';

export default function CustomerList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<boolean | null>(true);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch customers
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', statusFilter, tierFilter, searchQuery, currentPage],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };

      if (statusFilter !== null) {
        params.is_active = statusFilter;
      }

      if (tierFilter !== 'all') {
        params.membership_tier = tierFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get('/customers/', { params });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบลูกค้า');
    },
  });

  const handleDelete = (customer: Customer) => {
    if (window.confirm(`ต้องการลบลูกค้า "${customer.name}" หรือไม่?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;

    const tierStyles: Record<string, { bg: string; text: string; label: string }> = {
      bronze: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Bronze' },
      silver: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Silver' },
      gold: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Gold' },
      platinum: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Platinum' },
    };

    const style = tierStyles[tier];
    if (!style) return null;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  // Show form if creating or editing
  if (showCreateForm || editingCustomer) {
    return (
      <div>
        <CustomerForm
          customer={editingCustomer || undefined}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingCustomer(null);
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingCustomer(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">จัดการลูกค้า (Customer Management)</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          + เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัส, ชื่อ, เบอร์โทร, เลขบัตรประชาชน..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter === null ? 'all' : statusFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === 'all' ? null : val === 'active');
                setCurrentPage(0);
              }}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ระดับสมาชิก</label>
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="mt-2 text-gray-500">ไม่พบข้อมูลลูกค้า</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-4">
              เพิ่มลูกค้าคนแรก
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รหัส
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อ-นามสกุล
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ติดต่อ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คะแนนสะสม
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ระดับ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.items.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.code}</div>
                        {customer.member_since && (
                          <div className="text-xs text-gray-500">
                            สมาชิก: {formatDate(customer.member_since)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        {customer.national_id && (
                          <div className="text-xs text-gray-500">ID: {customer.national_id}</div>
                        )}
                        {customer.allergies && (
                          <div className="text-xs text-red-600 mt-1">
                            ⚠ แพ้: {customer.allergies.substring(0, 30)}
                            {customer.allergies.length > 30 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.mobile && (
                          <div className="text-sm text-gray-900">📱 {customer.mobile}</div>
                        )}
                        {customer.phone && (
                          <div className="text-xs text-gray-500">☎ {customer.phone}</div>
                        )}
                        {customer.email && (
                          <div className="text-xs text-gray-500">✉ {customer.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-primary-600">
                          {customer.loyalty_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">คะแนน</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getTierBadge(customer.membership_tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {customer.is_active ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ไม่ใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {/* View Profile */}
                          <button
                            onClick={() => setViewingCustomer(customer)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="ดูรายละเอียด"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingCustomer(customer)}
                            className="text-blue-600 hover:text-blue-900"
                            title="แก้ไข"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(customer)}
                            className="text-red-600 hover:text-red-900"
                            title="ลบ"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.total > pageSize && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  แสดง {currentPage * pageSize + 1} ถึง{' '}
                  {Math.min((currentPage + 1) * pageSize, data.total)} จาก {data.total} รายการ
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={(currentPage + 1) * pageSize >= data.total}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Profile Modal */}
      {viewingCustomer && (
        <CustomerProfileModal
          isOpen={!!viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          customer={viewingCustomer}
          onEdit={() => {
            setEditingCustomer(viewingCustomer);
            setViewingCustomer(null);
          }}
        />
      )}

      {/* Summary Stats */}
      {data?.items && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="card">
            <div className="text-sm text-gray-600">จำนวนลูกค้าทั้งหมด</div>
            <div className="text-2xl font-bold text-gray-900">{data.total}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">ลูกค้าใช้งาน</div>
            <div className="text-2xl font-bold text-green-600">
              {data.items.filter((c: Customer) => c.is_active).length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">สมาชิก Gold+</div>
            <div className="text-2xl font-bold text-yellow-600">
              {
                data.items.filter(
                  (c: Customer) => c.membership_tier === 'gold' || c.membership_tier === 'platinum'
                ).length
              }
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">คะแนนสะสมรวม</div>
            <div className="text-2xl font-bold text-primary-600">
              {data.items
                .reduce((sum: number, c: Customer) => sum + c.loyalty_points, 0)
                .toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
