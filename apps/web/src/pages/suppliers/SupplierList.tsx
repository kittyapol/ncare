import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@/types';
import SupplierForm from '@/components/forms/SupplierForm';
import api from '@/services/api';

export default function SupplierList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<boolean | null>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch suppliers
  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', statusFilter, searchQuery, currentPage],
    queryFn: async () => {
      const params: any = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };
      if (statusFilter !== null) {
        params.is_active = statusFilter;
      }
      const response = await api.get('/suppliers/', { params });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      await api.delete(`/suppliers/${supplierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบผู้จัดจำหน่าย');
    },
  });

  const handleDelete = (supplier: Supplier) => {
    if (confirm(`คุณต้องการลบผู้จัดจำหน่าย "${supplier.name_th}" ใช่หรือไม่?`)) {
      deleteMutation.mutate(supplier.id);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingSupplier(null);
  };

  const getRatingBadge = (rating?: string) => {
    if (!rating) return null;

    const ratingStyles: Record<string, string> = {
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-yellow-100 text-yellow-800',
      D: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          ratingStyles[rating] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {rating}
      </span>
    );
  };

  // Filter data by search query client-side
  const filteredData = data?.items
    ? {
        ...data,
        items: data.items.filter(
          (supplier: Supplier) =>
            !searchQuery ||
            supplier.name_th.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            supplier.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }
    : data;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  // Show form if creating or editing
  if (showCreateForm || editingSupplier) {
    return (
      <div>
        <SupplierForm
          supplier={editingSupplier || undefined}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingSupplier(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ผู้จัดจำหน่าย (Suppliers)</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          + เพิ่มผู้จัดจำหน่าย
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อผู้จัดจำหน่าย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter === null ? 'all' : statusFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value === 'all' ? null : value === 'active');
                setCurrentPage(0);
              }}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">ใช้งานอยู่</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !filteredData?.items || filteredData.items.length === 0 ? (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <p className="mt-2 text-gray-500">
              {searchQuery ? 'ไม่พบผู้จัดจำหน่ายที่ค้นหา' : 'ยังไม่มีผู้จัดจำหน่าย'}
            </p>
            {!searchQuery && (
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-4">
                เพิ่มผู้จัดจำหน่ายแรก
              </button>
            )}
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
                      ชื่อผู้จัดจำหน่าย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ติดต่อ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เงื่อนไข
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เรทติ้ง
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
                  {filteredData.items.map((supplier: Supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.code}</div>
                        {supplier.tax_id && (
                          <div className="text-xs text-gray-500">เลขภาษี: {supplier.tax_id}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{supplier.name_th}</div>
                        {supplier.name_en && (
                          <div className="text-xs text-gray-500">{supplier.name_en}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {supplier.contact_person && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{supplier.contact_person}</span>
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{supplier.phone}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {supplier.payment_terms && (
                            <div className="text-xs">
                              <span className="text-gray-500">ชำระ:</span> {supplier.payment_terms}
                            </div>
                          )}
                          {supplier.credit_limit && (
                            <div className="text-xs">
                              <span className="text-gray-500">วงเงิน:</span> {supplier.credit_limit}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getRatingBadge(supplier.rating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            supplier.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {supplier.is_active ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/purchase-orders?supplier=${supplier.id}`}
                            className="text-green-600 hover:text-green-900"
                            title="ดู Purchase Orders"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </a>
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="text-blue-600 hover:text-blue-900"
                            title="แก้ไข"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(supplier)}
                            className="text-red-600 hover:text-red-900"
                            title="ลบ"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  );
}
