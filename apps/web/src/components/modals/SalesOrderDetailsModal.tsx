import { SalesOrder } from '@/types';
import { format } from 'date-fns';

interface SalesOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesOrder: SalesOrder;
  onPrintReceipt?: () => void;
}

export default function SalesOrderDetailsModal({
  isOpen,
  onClose,
  salesOrder,
  onPrintReceipt,
}: SalesOrderDetailsModalProps) {
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
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
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusLabels: Record<string, string> = {
      draft: 'ร่าง',
      confirmed: 'ยืนยันแล้ว',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    };

    const statusIcons: Record<string, string> = {
      draft: '📝',
      confirmed: '✓',
      completed: '✓✓',
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

  const getPaymentStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
      partial: 'bg-orange-100 text-orange-800 border-orange-300',
      refunded: 'bg-red-100 text-red-800 border-red-300',
    };

    const statusLabels: Record<string, string> = {
      pending: 'รอชำระ',
      paid: 'ชำระแล้ว',
      partial: 'ชำระบางส่วน',
      refunded: 'คืนเงิน',
    };

    const statusIcons: Record<string, string> = {
      pending: '⏱',
      paid: '💰',
      partial: '📊',
      refunded: '↩',
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
  const totalItems = salesOrder.items?.length || 0;
  const totalQuantity = salesOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalDiscount = salesOrder.discount_amount +
    (salesOrder.items?.reduce((sum, item) => sum + item.discount_amount, 0) || 0);

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
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-cyan-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-600 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">ใบเสร็จการขาย (Sales Order)</h3>
                  <p className="text-sm text-cyan-700 font-medium mt-1">
                    Order Number: {salesOrder.order_number}
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
                      <p className="text-sm font-medium text-green-600 mb-1">จำนวนรวม</p>
                      <p className="text-3xl font-bold text-green-900">{totalQuantity}</p>
                      <p className="text-xs text-green-600 mt-1">Quantity</p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-600 mb-1">ส่วนลด</p>
                      <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalDiscount)}</p>
                      <p className="text-xs text-orange-600 mt-1">Total Discount</p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-cyan-600 mb-1">ยอดรวมทั้งสิ้น</p>
                      <p className="text-2xl font-bold text-cyan-900">{formatCurrency(salesOrder.total_amount)}</p>
                      <p className="text-xs text-cyan-600 mt-1">Total Amount</p>
                    </div>
                    <div className="p-3 bg-cyan-600 rounded-lg">
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
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Order Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    ข้อมูลออเดอร์
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">เลขที่ออเดอร์</label>
                      <p className="text-base text-gray-900 font-semibold font-mono">{salesOrder.order_number}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">สถานะ</label>
                        {getStatusBadge(salesOrder.status)}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-2">การชำระเงิน</label>
                        {getPaymentStatusBadge(salesOrder.payment_status)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">วันที่สั่ง</label>
                      <p className="text-base text-gray-900">{formatDateTime(salesOrder.order_date)}</p>
                    </div>

                    {salesOrder.completed_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่ชำระเงิน</label>
                        <p className="text-base text-green-700 font-semibold">
                          {formatDateTime(salesOrder.completed_at)}
                        </p>
                      </div>
                    )}

                    {salesOrder.prescription_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">เลขที่ใบสั่งยา</label>
                        <p className="text-base text-gray-900 font-mono">{salesOrder.prescription_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    ข้อมูลการชำระเงิน
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">วิธีชำระเงิน</label>
                      <p className="text-base text-gray-900 font-semibold">
                        {salesOrder.payment_method || 'เงินสด'}
                      </p>
                    </div>

                    {salesOrder.paid_amount > 0 && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">เงินที่รับ</label>
                          <p className="text-base text-gray-900">{formatCurrency(salesOrder.paid_amount)}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500">เงินทอน</label>
                          <p className="text-base text-green-700 font-semibold">
                            {formatCurrency(salesOrder.change_amount)}
                          </p>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">ผู้ขาย (Cashier)</label>
                      <p className="text-base text-gray-900">Cashier ID: {salesOrder.cashier_id}</p>
                    </div>

                    {salesOrder.pharmacist_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">เภสัชกร</label>
                        <p className="text-base text-gray-900">Pharmacist ID: {salesOrder.pharmacist_id}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">ประเภทลูกค้า</label>
                      <p className="text-base text-gray-900">
                        {salesOrder.customer_id ? '👤 ลูกค้าประจำ' : '👥 ลูกค้าทั่วไป'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">สินค้า</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">ราคา/หน่วย</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">ส่วนลด</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {salesOrder.items?.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name_th || `Product ID: ${item.product_id}`}
                            </div>
                            {item.product?.sku && (
                              <div className="text-xs text-gray-500">SKU: {item.product.sku}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-gray-900">{item.quantity}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm text-orange-600">
                              {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
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
                        <td colSpan={5} className="px-4 py-3 text-right font-semibold text-gray-700">
                          รวมเงิน (Subtotal):
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatCurrency(salesOrder.subtotal)}
                        </td>
                      </tr>
                      {salesOrder.discount_amount > 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-sm text-gray-600">
                            ส่วนลด:
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-orange-600">
                            -{formatCurrency(salesOrder.discount_amount)}
                          </td>
                        </tr>
                      )}
                      {salesOrder.tax_amount > 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right text-sm text-gray-600">
                            ภาษี (VAT {salesOrder.tax_rate}%):
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">
                            {formatCurrency(salesOrder.tax_amount)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-cyan-50">
                        <td colSpan={5} className="px-4 py-3 text-right font-bold text-cyan-900 text-lg">
                          ยอดรวมทั้งสิ้น:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-cyan-900 text-lg">
                          {formatCurrency(salesOrder.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {salesOrder.notes && (
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
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap">{salesOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                สร้างเมื่อ: {formatDateTime(salesOrder.created_at)}
              </div>
              <div className="flex gap-3">
                {onPrintReceipt && (
                  <button
                    onClick={() => {
                      onPrintReceipt();
                      onClose();
                    }}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    พิมพ์ใบเสร็จ
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
