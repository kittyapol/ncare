import { PurchaseOrder } from '@/types';
import { format } from 'date-fns';

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onReceive?: () => void;
}

export default function PurchaseOrderDetailsModal({
  isOpen,
  onClose,
  purchaseOrder,
  onReceive,
}: PurchaseOrderDetailsModalProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
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
      received: 'รับครบแล้ว',
      cancelled: 'ยกเลิก',
    };

    const statusIcons: Record<string, string> = {
      draft: '📝',
      sent: '📤',
      confirmed: '✓',
      partially_received: '📦',
      received: '✓✓',
      cancelled: '✗',
    };

    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${
            statusStyles[status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusIcons[status]} {statusLabels[status] || status}
        </span>
      </div>
    );
  };

  // Calculate statistics
  const totalItems = purchaseOrder.items?.length || 0;
  const totalQuantityOrdered = purchaseOrder.items?.reduce(
    (sum, item) => sum + item.quantity_ordered,
    0
  ) || 0;
  const totalQuantityReceived = purchaseOrder.items?.reduce(
    (sum, item) => sum + item.quantity_received,
    0
  ) || 0;
  const receivedPercentage = totalQuantityOrdered > 0
    ? (totalQuantityReceived / totalQuantityOrdered) * 100
    : 0;

  const canReceive = ['confirmed', 'sent', 'partially_received'].includes(purchaseOrder.status);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">ใบสั่งซื้อ (Purchase Order)</h3>
                  <p className="text-sm text-purple-700 font-medium mt-1">
                    PO Number: {purchaseOrder.po_number}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600 mb-1">รายการสินค้า</p>
                      <p className="text-3xl font-bold text-blue-900">{totalItems}</p>
                      <p className="text-xs text-blue-600 mt-1">Items</p>
                    </div>
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600 mb-1">ยอดรวม</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(purchaseOrder.total_amount)}
                      </p>
                      <p className="text-xs text-green-600 mt-1">Total Amount</p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-600 mb-1">จำนวนสั่ง</p>
                      <p className="text-3xl font-bold text-orange-900">{totalQuantityOrdered}</p>
                      <p className="text-xs text-orange-600 mt-1">Ordered Qty</p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-600 mb-1">รับแล้ว</p>
                      <p className="text-3xl font-bold text-purple-900">{totalQuantityReceived}</p>
                      <p className="text-xs text-purple-600 mt-1">{receivedPercentage.toFixed(1)}% Received</p>
                    </div>
                    <div className="p-3 bg-purple-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* PO Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    ข้อมูล PO
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">เลขที่ PO</label>
                      <p className="text-base text-gray-900 font-semibold font-mono">{purchaseOrder.po_number}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">สถานะ</label>
                      {getStatusBadge(purchaseOrder.status)}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">วันที่สั่งซื้อ</label>
                      <p className="text-base text-gray-900">{formatDate(purchaseOrder.order_date)}</p>
                    </div>

                    {purchaseOrder.expected_delivery_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่คาดว่าจะได้รับ</label>
                        <p className="text-base text-gray-900">
                          {formatDate(purchaseOrder.expected_delivery_date)}
                        </p>
                      </div>
                    )}

                    {purchaseOrder.actual_delivery_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่ได้รับจริง</label>
                        <p className="text-base text-green-700 font-semibold">
                          {formatDate(purchaseOrder.actual_delivery_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplier Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    ผู้จัดจำหน่าย
                  </h4>

                  {purchaseOrder.supplier ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">ชื่อ</label>
                        <p className="text-base text-gray-900 font-semibold">
                          {purchaseOrder.supplier.name_th}
                        </p>
                        {purchaseOrder.supplier.name_en && (
                          <p className="text-sm text-gray-600">{purchaseOrder.supplier.name_en}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">รหัส</label>
                        <p className="text-base text-gray-900 font-mono">{purchaseOrder.supplier.code}</p>
                      </div>

                      {purchaseOrder.supplier.contact_person && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">ผู้ติดต่อ</label>
                          <p className="text-base text-gray-900">{purchaseOrder.supplier.contact_person}</p>
                        </div>
                      )}

                      {purchaseOrder.supplier.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">โทรศัพท์</label>
                          <p className="text-base text-gray-900">{purchaseOrder.supplier.phone}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">ไม่มีข้อมูลผู้จัดจำหน่าย</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  รายการสินค้า ({totalItems} รายการ)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          สินค้า
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          จำนวนสั่ง
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          รับแล้ว
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          ราคา/หน่วย
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          รวม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchaseOrder.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name_th || '-'}
                            </div>
                            <div className="text-xs text-gray-500">SKU: {item.product?.sku || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {item.quantity_ordered}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-semibold ${
                              item.quantity_received >= item.quantity_ordered
                                ? 'text-green-600'
                                : item.quantity_received > 0
                                ? 'text-orange-600'
                                : 'text-gray-400'
                            }`}>
                              {item.quantity_received}
                            </span>
                            {item.quantity_received > 0 && item.quantity_received < item.quantity_ordered && (
                              <div className="text-xs text-orange-600 mt-1">
                                คงเหลือ: {item.quantity_ordered - item.quantity_received}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-900">
                              {formatCurrency(item.unit_price)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-gray-900">
                              {formatCurrency(item.line_total)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">
                          รวมเงิน (Subtotal):
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(purchaseOrder.subtotal)}
                        </td>
                      </tr>
                      {purchaseOrder.discount_amount > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">
                            ส่วนลด:
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-red-600">
                            -{formatCurrency(purchaseOrder.discount_amount)}
                          </td>
                        </tr>
                      )}
                      {purchaseOrder.tax_amount > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">
                            ภาษี (VAT):
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {formatCurrency(purchaseOrder.tax_amount)}
                          </td>
                        </tr>
                      )}
                      {purchaseOrder.shipping_cost > 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-right text-sm text-gray-600">
                            ค่าจัดส่ง:
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {formatCurrency(purchaseOrder.shipping_cost)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-purple-50">
                        <td colSpan={4} className="px-4 py-3 text-right font-bold text-purple-900 text-lg">
                          ยอดรวมทั้งสิ้น:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-purple-900 text-lg">
                          {formatCurrency(purchaseOrder.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes & Terms */}
              {(purchaseOrder.notes || purchaseOrder.terms_and_conditions) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {purchaseOrder.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                        หมายเหตุ
                      </h4>
                      <p className="text-sm text-yellow-900 whitespace-pre-wrap">{purchaseOrder.notes}</p>
                    </div>
                  )}

                  {purchaseOrder.terms_and_conditions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        เงื่อนไขและข้อตกลง
                      </h4>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">
                        {purchaseOrder.terms_and_conditions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                สร้างเมื่อ: {formatDate(purchaseOrder.created_at)}
              </div>
              <div className="flex gap-3">
                {canReceive && onReceive && (
                  <button
                    onClick={() => {
                      onReceive();
                      onClose();
                    }}
                    className="btn bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    รับของเข้าคลัง
                  </button>
                )}
                <button onClick={onClose} className="btn btn-secondary">
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
