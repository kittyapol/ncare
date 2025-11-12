import { SalesOrder } from '@/types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface ReceiptProps {
  order: SalesOrder;
  showPrintButton?: boolean;
  onPrint?: () => void;
}

// Company/Store Information - In production, this should come from settings/database
const STORE_INFO = {
  name: 'ร้านขายยา NCare Pharmacy',
  nameEn: 'NCare Pharmacy',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย',
  addressLine2: 'กรุงเทพมหานคร 10110',
  taxId: '0-1234-56789-01-2',
  phone: '02-123-4567',
  license: 'ใบอนุญาตร้านขายยา เลขที่ ท.1234/5678',
};

export default function Receipt({ order, showPrintButton = true, onPrint }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: th });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    const methods: Record<string, string> = {
      cash: 'เงินสด',
      credit_card: 'บัตรเครดิต',
      debit_card: 'บัตรเดบิต',
      bank_transfer: 'โอนเงิน',
      promptpay: 'พร้อมเพย์',
      credit: 'เครดิต',
    };
    return methods[method || 'cash'] || method || '-';
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="receipt-container bg-white">
      {/* Print Button - Hidden when printing */}
      {showPrintButton && (
        <div className="print:hidden mb-4 flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            พิมพ์ใบเสร็จ
          </button>
        </div>
      )}

      {/* Receipt Content */}
      <div className="receipt-content max-w-3xl mx-auto p-8 print:p-6">
        {/* Header - Store Info */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{STORE_INFO.name}</h1>
          <p className="text-lg text-gray-700">{STORE_INFO.nameEn}</p>
          <p className="text-sm text-gray-600 mt-2">{STORE_INFO.address}</p>
          <p className="text-sm text-gray-600">{STORE_INFO.addressLine2}</p>
          <p className="text-sm text-gray-600 mt-1">โทร: {STORE_INFO.phone}</p>
          <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี: {STORE_INFO.taxId}</p>
          <p className="text-sm text-gray-600">{STORE_INFO.license}</p>
        </div>

        {/* Document Title */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">ใบเสร็จรับเงิน / RECEIPT</h2>
          <p className="text-sm text-gray-600 mt-1">ต้นฉบับ / Original</p>
        </div>

        {/* Order Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-600">
              <span className="font-semibold">เลขที่ใบเสร็จ:</span> {order.order_number}
            </p>
            {order.prescription_number && (
              <p className="text-gray-600">
                <span className="font-semibold">เลขที่ใบสั่งยา:</span> {order.prescription_number}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-gray-600">
              <span className="font-semibold">วันที่:</span> {formatDateTime(order.order_date)}
            </p>
            {order.completed_at && (
              <p className="text-gray-600">
                <span className="font-semibold">ชำระเมื่อ:</span> {formatDateTime(order.completed_at)}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-t-2 border-b-2 border-gray-800">
                <th className="text-left py-2 px-1 text-sm font-semibold">รายการ</th>
                <th className="text-center py-2 px-1 text-sm font-semibold w-20">จำนวน</th>
                <th className="text-right py-2 px-1 text-sm font-semibold w-24">ราคา/หน่วย</th>
                <th className="text-right py-2 px-1 text-sm font-semibold w-24">รวม</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="py-2 px-1 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.product?.name_th || `Product ${item.product_id}`}
                      </p>
                      {item.product?.name_en && (
                        <p className="text-xs text-gray-500">{item.product.name_en}</p>
                      )}
                      {item.discount_amount > 0 && (
                        <p className="text-xs text-red-600">ส่วนลด: -{formatCurrency(item.discount_amount)}</p>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-2 px-1 text-sm">{item.quantity}</td>
                  <td className="text-right py-2 px-1 text-sm">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right py-2 px-1 text-sm font-medium">
                    {formatCurrency(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t-2 border-gray-800 pt-4 mb-6">
          <div className="flex justify-end">
            <div className="w-80">
              {/* Subtotal */}
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">รวมเป็นเงิน (ก่อน VAT):</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>

              {/* Discount */}
              {order.discount_amount > 0 && (
                <div className="flex justify-between py-1 text-sm text-red-600">
                  <span>ส่วนลด:</span>
                  <span className="font-medium">-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}

              {/* VAT */}
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-700">ภาษีมูลค่าเพิ่ม {order.tax_rate}%:</span>
                <span className="font-medium">{formatCurrency(order.tax_amount)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between py-2 text-base border-t-2 border-gray-400 mt-2">
                <span className="font-bold text-gray-900">รวมทั้งสิ้น / GRAND TOTAL:</span>
                <span className="font-bold text-gray-900 text-lg">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {order.payment_method && (
          <div className="border-t border-gray-300 pt-4 mb-6">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">วิธีชำระเงิน:</span>
                  <span className="font-medium">{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                {order.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between py-1 text-sm">
                      <span className="text-gray-700">รับเงินมา:</span>
                      <span className="font-medium">{formatCurrency(order.paid_amount)}</span>
                    </div>
                    {order.change_amount > 0 && (
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-700">เงินทอน:</span>
                        <span className="font-medium">{formatCurrency(order.change_amount)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VAT Summary Box */}
        <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-6">
          <p className="text-xs font-semibold text-gray-700 mb-2">สรุปภาษีมูลค่าเพิ่ม (VAT Summary)</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-600">มูลค่าก่อน VAT</p>
              <p className="font-semibold">{formatCurrency(order.subtotal - order.discount_amount)}</p>
            </div>
            <div>
              <p className="text-gray-600">VAT {order.tax_rate}%</p>
              <p className="font-semibold">{formatCurrency(order.tax_amount)}</p>
            </div>
            <div>
              <p className="text-gray-600">มูลค่ารวม VAT</p>
              <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">หมายเหตุ:</span> {order.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center border-t-2 border-gray-800 pt-4 mt-6">
          <p className="text-sm text-gray-700 font-medium mb-2">
            ขอบคุณที่ใช้บริการ / Thank you for your business
          </p>
          <p className="text-xs text-gray-600">
            กรุณาเก็บใบเสร็จนี้ไว้เป็นหลักฐานในการเรียกร้องสิทธิ์
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Please keep this receipt for your records
          </p>
        </div>

        {/* Barcode or QR Code placeholder */}
        <div className="text-center mt-6">
          <div className="inline-block bg-gray-100 px-4 py-2 rounded">
            <p className="text-xs font-mono text-gray-600">{order.order_number}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .receipt-container {
            width: 100%;
            max-width: 80mm; /* Thermal printer width */
            margin: 0 auto;
          }
          .receipt-content {
            padding: 10mm;
            font-size: 10pt;
          }
          /* Hide non-printable elements */
          nav, header, footer, .no-print {
            display: none !important;
          }
          /* Ensure proper page breaks */
          .receipt-content {
            page-break-inside: avoid;
          }
          /* Optimize for thermal printer */
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
