import { useQuery } from '@tanstack/react-query';
import { Supplier, PurchaseOrder } from '@/types';
import api from '@/services/api';
import { format } from 'date-fns';

interface SupplierDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  onEdit: () => void;
}

export default function SupplierDetailsModal({
  isOpen,
  onClose,
  supplier,
  onEdit,
}: SupplierDetailsModalProps) {
  // Fetch supplier's purchase orders
  const { data: purchaseOrdersData } = useQuery({
    queryKey: ['purchase-orders', 'supplier', supplier.id],
    queryFn: async () => {
      const response = await api.get('/purchase/orders/', {
        params: { supplier_id: supplier.id, limit: 10 },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  const purchaseOrders: PurchaseOrder[] = purchaseOrdersData?.items || [];

  // Calculate statistics
  const totalOrders = purchaseOrders.length;
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0);
  const activeOrders = purchaseOrders.filter(
    (po) => po.status === 'confirmed' || po.status === 'sent'
  ).length;

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

  const getRatingBadge = (rating?: string) => {
    if (!rating) return <span className="text-gray-400 text-sm">ยังไม่มีเรทติ้ง</span>;

    const ratingStyles: Record<string, string> = {
      A: 'bg-green-100 text-green-800 border-green-300',
      B: 'bg-blue-100 text-blue-800 border-blue-300',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      D: 'bg-red-100 text-red-800 border-red-300',
    };

    const ratingLabels: Record<string, string> = {
      A: 'ดีเยี่ยม',
      B: 'ดี',
      C: 'ปานกลาง',
      D: 'ควรปรับปรุง',
    };

    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-lg text-sm font-semibold border-2 ${
            ratingStyles[rating] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {rating}
        </span>
        <span className="text-sm text-gray-600">{ratingLabels[rating]}</span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-600 rounded-lg">
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{supplier.name_th}</h3>
                {supplier.name_en && (
                  <p className="text-sm text-gray-600 mt-1">{supplier.name_en}</p>
                )}
                <p className="text-sm text-primary-700 font-medium mt-1">
                  รหัส: {supplier.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                แก้ไข
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
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
          </div>

          {/* Modal Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Purchase Orders</p>
                    <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
                    <p className="text-xs text-blue-600 mt-1">รายการทั้งหมด</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-lg">
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
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(totalAmount)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">ยอดสั่งซื้อทั้งหมด</p>
                  </div>
                  <div className="p-3 bg-green-600 rounded-lg">
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
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">Active Orders</p>
                    <p className="text-3xl font-bold text-yellow-900">{activeOrders}</p>
                    <p className="text-xs text-yellow-600 mt-1">กำลังดำเนินการ</p>
                  </div>
                  <div className="p-3 bg-yellow-600 rounded-lg">
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
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supplier Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ข้อมูลผู้จัดจำหน่าย
                </h4>

                <div className="space-y-4">
                  {/* Rating */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">เรทติ้ง</label>
                    <div className="mt-1">{getRatingBadge(supplier.rating)}</div>
                  </div>

                  {/* Tax ID */}
                  {supplier.tax_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        เลขประจำตัวผู้เสียภาษี
                      </label>
                      <p className="mt-1 text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded">
                        {supplier.tax_id}
                      </p>
                    </div>
                  )}

                  {/* Contact Person */}
                  {supplier.contact_person && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">ผู้ติดต่อ</label>
                      <p className="mt-1 text-sm text-gray-900">{supplier.contact_person}</p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {supplier.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">โทรศัพท์</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {supplier.phone}
                        </p>
                      </div>
                    )}

                    {supplier.mobile && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">มือถือ</label>
                        <p className="mt-1 text-sm text-gray-900">{supplier.mobile}</p>
                      </div>
                    )}
                  </div>

                  {supplier.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">อีเมล</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {supplier.email}
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {supplier.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">ที่อยู่</label>
                      <p className="mt-1 text-sm text-gray-900">{supplier.address}</p>
                      {(supplier.city || supplier.province || supplier.postal_code) && (
                        <p className="text-sm text-gray-600">
                          {[supplier.city, supplier.province, supplier.postal_code]
                            .filter(Boolean)
                            .join(' ')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะ</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          supplier.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {supplier.is_active ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Terms */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  เงื่อนไขการซื้อขาย
                </h4>

                <div className="space-y-4">
                  {supplier.payment_terms && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-blue-700 mb-1 block">
                        เงื่อนไขการชำระเงิน
                      </label>
                      <p className="text-sm text-blue-900">{supplier.payment_terms}</p>
                    </div>
                  )}

                  {supplier.credit_limit && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-green-700 mb-1 block">
                        วงเงินเครดิต
                      </label>
                      <p className="text-lg font-semibold text-green-900">
                        {supplier.credit_limit}
                      </p>
                    </div>
                  )}

                  {supplier.discount_terms && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-yellow-700 mb-1 block">
                        เงื่อนไขส่วนลด
                      </label>
                      <p className="text-sm text-yellow-900">{supplier.discount_terms}</p>
                    </div>
                  )}

                  {supplier.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        หมายเหตุ
                      </label>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {supplier.notes}
                      </p>
                    </div>
                  )}

                  {!supplier.payment_terms &&
                    !supplier.credit_limit &&
                    !supplier.discount_terms &&
                    !supplier.notes && (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">ยังไม่มีข้อมูลเงื่อนไขการซื้อขาย</p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Purchase Orders History */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  ประวัติ Purchase Orders
                </h4>
                {totalOrders > 10 && (
                  <a
                    href={`/purchase-orders?supplier=${supplier.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ดูทั้งหมด →
                  </a>
                )}
              </div>

              {purchaseOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">ยังไม่มีรายการสั่งซื้อจากผู้จัดจำหน่ายนี้</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          เลขที่ PO
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          วันที่สั่ง
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          มูลค่า
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          สถานะ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <a
                              href={`/purchase-orders/${po.id}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                              {po.po_number}
                            </a>
                            {po.expected_delivery_date && (
                              <div className="text-xs text-gray-500">
                                คาดว่าจะได้รับ: {formatDate(po.expected_delivery_date)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDate(po.order_date)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                            {formatCurrency(po.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(po.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={onClose} className="btn btn-secondary">
              ปิด
            </button>
            <button onClick={onEdit} className="btn btn-primary">
              แก้ไขข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
