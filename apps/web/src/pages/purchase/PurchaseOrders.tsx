import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PurchaseOrder } from '@/types';
import PurchaseOrderForm from '@/components/forms/PurchaseOrderForm';
import ReceiveInventoryModal from '@/components/modals/ReceiveInventoryModal';
import api from '@/services/api';
import { format } from 'date-fns';

export default function PurchaseOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderForReceiving, setSelectedOrderForReceiving] = useState<PurchaseOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch purchase orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', statusFilter, currentPage],
    queryFn: async () => {
      const params: any = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await api.get('/purchase/orders/', { params });
      return response.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-yellow-100 text-yellow-800',
      partially_received: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
      draft: 'ร่าง',
      sent: 'ส่งแล้ว',
      confirmed: 'ยืนยันแล้ว',
      partially_received: 'รับบางส่วน',
      received: 'รับแล้ว',
      cancelled: 'ยกเลิก',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const canReceiveOrder = (order: PurchaseOrder) => {
    return order.status === 'confirmed' || order.status === 'sent' || order.status === 'partially_received';
  };

  const handleReceiveOrder = (order: PurchaseOrder) => {
    setSelectedOrderForReceiving(order);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  // Show form if creating new
  if (showCreateForm) {
    return (
      <div>
        <PurchaseOrderForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ใบสั่งซื้อ (Purchase Orders)</h1>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          + สร้างใบสั่งซื้อใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-56"
            >
              <option value="all">ทั้งหมด</option>
              <option value="draft">ร่าง</option>
              <option value="sent">ส่งแล้ว</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="partially_received">รับบางส่วน</option>
              <option value="received">รับแล้ว</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-gray-500">ไม่พบใบสั่งซื้อ</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-4">
              สร้างใบสั่งซื้อแรก
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เลขที่ PO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่สั่ง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ผู้จัดจำหน่าย
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จำนวนรายการ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ยอดรวม
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
                  {data.items.map((order: PurchaseOrder) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.po_number}</div>
                        {order.expected_delivery_date && (
                          <div className="text-xs text-gray-500">
                            คาดว่าจะได้รับ: {formatDate(order.expected_delivery_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(order.order_date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.supplier?.name_th || '-'}</div>
                        {order.supplier?.code && (
                          <div className="text-xs text-gray-500">รหัส: {order.supplier.code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.items?.length || 0} รายการ</div>
                        {order.items && order.items.some(item => item.quantity_received > 0) && (
                          <div className="text-xs text-green-600">
                            รับแล้ว: {order.items.reduce((sum, item) => sum + item.quantity_received, 0)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canReceiveOrder(order) && (
                          <button
                            onClick={() => handleReceiveOrder(order)}
                            className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                            title="รับของเข้าคลัง"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            รับของ
                          </button>
                        )}
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

      {/* Receive Inventory Modal */}
      {selectedOrderForReceiving && (
        <ReceiveInventoryModal
          isOpen={!!selectedOrderForReceiving}
          onClose={() => setSelectedOrderForReceiving(null)}
          purchaseOrder={selectedOrderForReceiving}
        />
      )}
    </div>
  );
}
