import { InventoryLot } from '@/types';
import { format } from 'date-fns';

interface LotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lot: InventoryLot;
}

export default function LotDetailsModal({ isOpen, onClose, lot }: LotDetailsModalProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  const getQualityBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      quarantine: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    const statusLabels: Record<string, string> = {
      passed: 'ผ่าน QC',
      failed: 'ไม่ผ่าน',
      quarantine: 'กักกัน',
      pending: 'รอตรวจสอบ',
    };

    const statusIcons: Record<string, string> = {
      passed: '✓',
      failed: '✗',
      quarantine: '⚠',
      pending: '⏱',
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

  const getStockPercentage = () => {
    return ((lot.quantity_available / lot.quantity_received) * 100).toFixed(1);
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(lot.expiry_date);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = () => {
    const days = getDaysUntilExpiry();
    if (days < 0) {
      return { text: 'หมดอายุแล้ว', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (days <= 30) {
      return { text: `ใกล้หมดอายุ (${days} วัน)`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else if (days <= 90) {
      return { text: `${days} วัน`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    }
    return { text: `${days} วัน`, color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  if (!isOpen) return null;

  const expiryStatus = getExpiryStatus();

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-teal-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-600 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">รายละเอียด Lot</h3>
                  <p className="text-sm text-teal-700 font-medium mt-1">
                    Lot Number: {lot.lot_number}
                    {lot.batch_number && <span className="ml-3">Batch: {lot.batch_number}</span>}
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
                      <p className="text-sm font-medium text-blue-600 mb-1">จำนวนคงเหลือ</p>
                      <p className="text-3xl font-bold text-blue-900">{lot.quantity_available}</p>
                      <p className="text-xs text-blue-600 mt-1">{getStockPercentage()}% จากที่รับเข้า</p>
                    </div>
                    <div className="p-3 bg-blue-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-600 mb-1">จำนวนจอง</p>
                      <p className="text-3xl font-bold text-orange-900">{lot.quantity_reserved}</p>
                      <p className="text-xs text-orange-600 mt-1">รอจัดสรร</p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-600 mb-1">จำนวนชำรุด</p>
                      <p className="text-3xl font-bold text-red-900">{lot.quantity_damaged}</p>
                      <p className="text-xs text-red-600 mt-1">ไม่สามารถขายได้</p>
                    </div>
                    <div className="p-3 bg-red-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600 mb-1">รับเข้าทั้งหมด</p>
                      <p className="text-3xl font-bold text-green-900">{lot.quantity_received}</p>
                      <p className="text-xs text-green-600 mt-1">จำนวนเริ่มต้น</p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    ข้อมูลสินค้า
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ชื่อสินค้า (ไทย)</label>
                      <p className="text-base text-gray-900 font-semibold">{lot.product?.name_th || '-'}</p>
                    </div>

                    {lot.product?.name_en && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ชื่อสินค้า (อังกฤษ)</label>
                        <p className="text-base text-gray-900">{lot.product.name_en}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">SKU / Barcode</label>
                      <p className="text-base text-gray-900 font-mono">
                        {lot.product?.sku || '-'}
                        {lot.product?.barcode && ` / ${lot.product.barcode}`}
                      </p>
                    </div>

                    {lot.product?.generic_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ชื่อสามัญ</label>
                        <p className="text-base text-gray-900">{lot.product.generic_name}</p>
                      </div>
                    )}

                    {lot.product?.active_ingredient && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">ส่วนประกอบสำคัญ</label>
                        <p className="text-base text-gray-900">{lot.product.active_ingredient}</p>
                      </div>
                    )}

                    {lot.product?.dosage_form && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">รูปแบบยา / ความแรง</label>
                        <p className="text-base text-gray-900">
                          {lot.product.dosage_form}
                          {lot.product.strength && ` - ${lot.product.strength}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warehouse & Supplier Information */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      คลังสินค้า
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">ชื่อคลัง</label>
                        <p className="text-base text-gray-900 font-semibold">{lot.warehouse?.name || '-'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-500">รหัสคลัง / ประเภท</label>
                        <p className="text-base text-gray-900">
                          {lot.warehouse?.code || '-'}
                          {lot.warehouse?.type && (
                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {lot.warehouse.type}
                            </span>
                          )}
                        </p>
                      </div>

                      {lot.warehouse?.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">ที่อยู่</label>
                          <p className="text-sm text-gray-900">{lot.warehouse.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {lot.supplier && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        ผู้จัดจำหน่าย
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">ชื่อ</label>
                          <p className="text-base text-gray-900 font-semibold">{lot.supplier.name_th}</p>
                          {lot.supplier.name_en && (
                            <p className="text-sm text-gray-600">{lot.supplier.name_en}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500">รหัส</label>
                          <p className="text-base text-gray-900">{lot.supplier.code}</p>
                        </div>

                        {lot.supplier.contact_person && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">ผู้ติดต่อ</label>
                            <p className="text-base text-gray-900">{lot.supplier.contact_person}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quality Control & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Quality Control */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    การควบคุมคุณภาพ (QC)
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">สถานะ QC</label>
                      {getQualityBadge(lot.quality_status)}
                    </div>

                    {lot.quality_checked_at && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่ตรวจสอบ</label>
                        <p className="text-base text-gray-900">{formatDate(lot.quality_checked_at)}</p>
                      </div>
                    )}

                    {lot.quality_notes && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 block mb-1">บันทึก QC</label>
                        <div className="bg-gray-50 border border-gray-200 rounded p-3">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{lot.quality_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Important Dates */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    วันที่สำคัญ
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">วันที่รับเข้าคลัง</label>
                      <p className="text-base text-gray-900 font-semibold">{formatDate(lot.received_date)}</p>
                    </div>

                    {lot.manufacture_date && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">วันที่ผลิต</label>
                        <p className="text-base text-gray-900">{formatDate(lot.manufacture_date)}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">วันหมดอายุ</label>
                      <div className={`${expiryStatus.bgColor} border-2 ${expiryStatus.color.replace('text', 'border')} rounded-lg p-3`}>
                        <p className={`text-lg font-bold ${expiryStatus.color}`}>{formatDate(lot.expiry_date)}</p>
                        <p className={`text-sm ${expiryStatus.color} mt-1`}>{expiryStatus.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h4 className="text-sm font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  เกี่ยวกับ Lot Management
                </h4>
                <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
                  <li>ระบบจัดการแบบ Lot-based ช่วยให้สามารถตรวจสอบย้อนกลับได้ (Traceability)</li>
                  <li>การจัดการตามวันหมดอายุ (FEFO - First Expire First Out)</li>
                  <li>การควบคุมคุณภาพ (Quality Control) สำหรับสินค้าทุก Lot</li>
                  <li>การติดตาม Stock แบบ Real-time รวมถึงสินค้าจอง และสินค้าชำรุด</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button onClick={onClose} className="btn btn-secondary">
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
