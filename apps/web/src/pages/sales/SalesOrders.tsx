import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SalesOrder } from '@/types';
import ReceiptModal from '@/components/modals/ReceiptModal';
import api from '@/services/api';
import { format } from 'date-fns';

export default function SalesOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch sales orders
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-orders', statusFilter, searchQuery, startDate, endDate, currentPage],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };
      if (statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }
      const response = await api.get('/sales/orders/', { params });
      return response.data;
    },
  });

  const handleSearch = () => {
    setCurrentPage(0);
    refetch();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setCurrentPage(0);
  };

  const handleViewDetails = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
      draft: 'ร่าง',
      confirmed: 'ยืนยันแล้ว',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      refunded: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
      pending: 'รอชำระ',
      paid: 'ชำระแล้ว',
      partial: 'ชำระบางส่วน',
      refunded: 'คืนเงิน',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const handleViewReceipt = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ประวัติการขาย</h1>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหาเลขที่ออเดอร์
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="SO-20250113..."
              className="input w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-full"
            >
              <option value="all">ทั้งหมด</option>
              <option value="draft">ร่าง</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            ค้นหา
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            ล้างตัวกรอง
          </button>
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
            <p className="mt-2 text-gray-500">ไม่พบรายการขาย</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เลขที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายการ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ยอดรวม
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การชำระเงิน
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.items.map((order: SalesOrder) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        {order.prescription_number && (
                          <div className="text-xs text-gray-500">ใบสั่งยา: {order.prescription_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(order.order_date)}</div>
                        {order.completed_at && (
                          <div className="text-xs text-gray-500">
                            ชำระ: {formatDateTime(order.completed_at)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customer_id ? 'ลูกค้าประจำ' : 'ลูกค้าทั่วไป'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{order.items?.length || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                        {order.tax_amount > 0 && (
                          <div className="text-xs text-gray-500">VAT: {formatCurrency(order.tax_amount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPaymentStatusBadge(order.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                            title="ดูรายละเอียด"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          <button
                            onClick={() => handleViewReceipt(order)}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                            title="พิมพ์ใบเสร็จ"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
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

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedOrder(null);
            }}
          />

          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    รายละเอียดออเดอร์ {selectedOrder.order_number}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    วันที่: {formatDateTime(selectedOrder.order_date)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">สถานะออเดอร์</h4>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">สถานะการชำระเงิน</h4>
                    <div>{getPaymentStatusBadge(selectedOrder.payment_status)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">ลูกค้า</h4>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.customer_id ? 'ลูกค้าประจำ' : 'ลูกค้าทั่วไป'}
                    </p>
                  </div>
                  {selectedOrder.prescription_number && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">เลขที่ใบสั่งยา</h4>
                      <p className="text-sm text-gray-900">{selectedOrder.prescription_number}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">วิธีชำระเงิน</h4>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.payment_method || '-'}
                    </p>
                  </div>
                  {selectedOrder.completed_at && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">วันที่ชำระเงิน</h4>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(selectedOrder.completed_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">รายการสินค้า</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            ลำดับ
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            สินค้า
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            จำนวน
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            ราคา/หน่วย
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            ส่วนลด
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            ยอดรวม
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {item.product?.name_th || `Product ID: ${item.product_id}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(item.discount_amount)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-end">
                    <div className="w-80">
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">รวมเป็นเงิน:</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">ส่วนลด:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedOrder.discount_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">VAT 7%:</span>
                        <span className="font-medium">{formatCurrency(selectedOrder.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between py-3 text-base border-t border-gray-200 font-bold">
                        <span className="text-gray-900">รวมทั้งสิ้น:</span>
                        <span className="text-primary-600">
                          {formatCurrency(selectedOrder.total_amount)}
                        </span>
                      </div>
                      {selectedOrder.paid_amount > 0 && (
                        <>
                          <div className="flex justify-between py-2 text-sm">
                            <span className="text-gray-600">เงินที่รับ:</span>
                            <span className="font-medium">
                              {formatCurrency(selectedOrder.paid_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 text-sm">
                            <span className="text-gray-600">เงินทอน:</span>
                            <span className="font-medium">
                              {formatCurrency(selectedOrder.change_amount)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">หมายเหตุ</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowReceipt(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  พิมพ์ใบเสร็จ
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
