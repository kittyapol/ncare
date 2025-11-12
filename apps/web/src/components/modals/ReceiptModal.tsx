import { useRef } from 'react';
import { SalesOrder } from '@/types';
import Receipt from '@/components/receipt/Receipt';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SalesOrder | null;
}

export default function ReceiptModal({ isOpen, onClose, order }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    // Use window.print() which will use the CSS @media print styles
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Simple approach: trigger print dialog with "Save as PDF" option
    // For more advanced PDF generation, we could use libraries like:
    // - jsPDF with html2canvas
    // - react-to-pdf
    // - @react-pdf/renderer
    window.print();
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto print:hidden">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                ใบเสร็จรับเงิน - {order.order_number}
              </h3>
              <div className="flex items-center gap-2">
                {/* Download PDF Button */}
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  title="บันทึกเป็น PDF"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  บันทึก PDF
                </button>

                {/* Print Button */}
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  พิมพ์
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
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
            </div>

            {/* Receipt Content */}
            <div
              ref={receiptRef}
              className="max-h-[calc(100vh-200px)] overflow-y-auto bg-gray-50"
            >
              <Receipt order={order} showPrintButton={false} onPrint={handlePrint} />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden printable version */}
      <div className="hidden print:block">
        <Receipt order={order} showPrintButton={false} />
      </div>
    </>
  );
}
