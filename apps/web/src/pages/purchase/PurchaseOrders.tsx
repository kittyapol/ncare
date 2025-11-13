import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PurchaseOrder } from '@/types';
import PurchaseOrderForm from '@/components/forms/PurchaseOrderForm';
import PurchaseOrderDetailsModal from '@/components/modals/PurchaseOrderDetailsModal';
import ReceiveInventoryModal from '@/components/modals/ReceiveInventoryModal';
import api from '@/services/api';
import { format } from 'date-fns';

export default function PurchaseOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrderForReceiving, setSelectedOrderForReceiving] = useState<PurchaseOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch purchase orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', statusFilter, currentPage],
    queryFn: async () => {
      const params: Record<string, string | number> = {
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
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-blue-100 text-blue-800 border-blue-300',
      confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      partially_received: 'bg-orange-100 text-orange-800 border-orange-300',
      received: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
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
        className={`px-2 py-1 rounded-md text-xs font-semibold border ${
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

  // Filter orders based on search
  const filteredOrders = data?.items?.filter((order: PurchaseOrder) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.po_number.toLowerCase().includes(query) ||
      order.supplier?.name_th?.toLowerCase().includes(query) ||
      order.supplier?.code?.toLowerCase().includes(query)
    );
  }) || [];

  // Calculate statistics
  const totalOrders = data?.total || 0;
  const totalAmount = data?.items?.reduce((sum: number, order: PurchaseOrder) => sum + order.total_amount, 0) || 0;
  const pendingOrders = data?.items?.filter(
    (order: PurchaseOrder) => ['draft', 'sent', 'confirmed', 'partially_received'].includes(order.status)
  ).length || 0;
  const receivedOrders = data?.items?.filter(
    (order: PurchaseOrder) => order.status === 'received'
  ).length || 0;

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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ใบสั่งซื้อ (Purchase Orders)</h1>
          <p className="text-sm text-gray-600 mt-1">
            จัดการใบสั่งซื้อสินค้าจากผู้จัดจำหน่าย
          </p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          + สร้างใบสั่งซื้อใหม่
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">ใบสั่งซื้อทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
              <p className="text-xs text-blue-600 mt-1">POs</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">มูลค่ารวม</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-green-600 mt-1">Total Amount</p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">รอดำเนินการ</p>
              <p className="text-3xl font-bold text-orange-900">{pendingOrders}</p>
              <p className="text-xs text-orange-600 mt-1">Pending POs</p>
            </div>
            <div className="p-3 bg-orange-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">รับของแล้ว</p>
              <p className="text-3xl font-bold text-purple-900">{receivedOrders}</p>
              <p className="text-xs text-purple-600 mt-1">Received POs</p>
            </div>
            <div className="p-3 bg-purple-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหาด้วยเลขที่ PO, ผู้จัดจำหน่าย..."
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
        ) : !filteredOrders || filteredOrders.length === 0 ? (
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  {filteredOrders.map((order: PurchaseOrder) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-mono">{order.po_number}</div>
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
                        <div className="text-sm font-medium text-gray-900">{order.supplier?.name_th || '-'}</div>
                        {order.supplier?.code && (
                          <div className="text-xs text-gray-500">รหัส: {order.supplier.code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">{order.items?.length || 0}</div>
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
                        <div className="flex justify-end gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="ดูรายละเอียด"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                          {/* Receive Goods */}
                          {canReceiveOrder(order) && (
                            <button
                              onClick={() => handleReceiveOrder(order)}
                              className="text-green-600 hover:text-green-900"
                              title="รับของเข้าคลัง"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
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

      {/* Purchase Order Details Modal */}
      {viewingOrder && (
        <PurchaseOrderDetailsModal
          isOpen={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          purchaseOrder={viewingOrder}
          onReceive={() => {
            setSelectedOrderForReceiving(viewingOrder);
            setViewingOrder(null);
          }}
        />
      )}

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
