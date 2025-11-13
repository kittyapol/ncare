import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InventoryLot, Warehouse } from '@/types';
import LotDetailsModal from '@/components/modals/LotDetailsModal';
import api from '@/services/api';
import { format } from 'date-fns';

export default function InventoryLots() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingLot, setViewingLot] = useState<InventoryLot | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch warehouses for filter
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses/');
      return response.data;
    },
  });

  // Fetch inventory lots
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-lots', warehouseFilter, currentPage],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: currentPage * pageSize,
        limit: pageSize,
      };

      if (warehouseFilter !== 'all') {
        params.warehouse_id = warehouseFilter;
      }

      const response = await api.get('/inventory/lots/', { params });
      return response.data;
    },
  });

  // Fetch expiring lots
  const { data: expiringData } = useQuery({
    queryKey: ['expiring-lots'],
    queryFn: async () => {
      const response = await api.get('/inventory/lots/expiring', {
        params: { days: 30 },
      });
      return response.data;
    },
  });

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
      pending: 'รอตรวจ',
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

  const getStockLevelIndicator = (lot: InventoryLot) => {
    const percentage = (lot.quantity_available / lot.quantity_received) * 100;
    if (percentage === 0) {
      return <span className="text-xs text-red-600 font-semibold">หมดสต็อก</span>;
    } else if (percentage < 20) {
      return <span className="text-xs text-red-600">ต่ำมาก</span>;
    } else if (percentage < 50) {
      return <span className="text-xs text-orange-600">ปานกลาง</span>;
    }
    return null;
  };

  // Filter lots based on search and quality
  const filteredLots = data?.items?.filter((lot: InventoryLot) => {
    const matchesSearch = !searchQuery ||
      lot.lot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.product?.name_th?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lot.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesQuality = qualityFilter === 'all' || lot.quality_status === qualityFilter;

    return matchesSearch && matchesQuality;
  }) || [];

  // Calculate statistics
  const totalLots = data?.total || 0;
  const totalItems = data?.items?.reduce((sum: number, lot: InventoryLot) => sum + lot.quantity_available, 0) || 0;
  const lowStockLots = data?.items?.filter((lot: InventoryLot) => {
    const percentage = (lot.quantity_available / lot.quantity_received) * 100;
    return percentage < 20 && lot.quantity_available > 0;
  }).length || 0;
  const expiringCount = expiringData?.items?.length || 0;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">คลังสินค้าและ Lot</h1>
          <p className="text-sm text-gray-600 mt-1">
            ระบบจัดการคลังสินค้าแบบ Lot-based พร้อม FEFO (First Expire First Out)
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">จำนวน Lot ทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-900">{totalLots}</p>
              <p className="text-xs text-blue-600 mt-1">Lots</p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">จำนวนสินค้าคงคลัง</p>
              <p className="text-3xl font-bold text-green-900">{totalItems.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">ชิ้น</p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">สต็อกต่ำ</p>
              <p className="text-3xl font-bold text-orange-900">{lowStockLots}</p>
              <p className="text-xs text-orange-600 mt-1">Lots ต่ำกว่า 20%</p>
            </div>
            <div className="p-3 bg-orange-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">ใกล้หมดอายุ</p>
              <p className="text-3xl font-bold text-red-900">{expiringCount}</p>
              <p className="text-xs text-red-600 mt-1">ภายใน 30 วัน</p>
            </div>
            <div className="p-3 bg-red-600 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Alert */}
      {expiringData && expiringData.items.length > 0 && (
        <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 text-lg">แจ้งเตือน: สินค้าใกล้หมดอายุ</h3>
              <p className="text-orange-700 mt-1">
                มี <span className="font-bold">{expiringData.items.length} Lot</span> ที่จะหมดอายุภายใน 30 วัน
              </p>
              <div className="mt-3 space-y-2">
                {expiringData.items.slice(0, 3).map((lot: InventoryLot) => (
                  <div key={lot.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                    <span className="font-semibold">{lot.product?.name_th}</span>
                    <span className="text-gray-600">- Lot: {lot.lot_number}</span>
                    <span className="text-orange-700 font-medium">หมดอายุ: {formatDate(lot.expiry_date)}</span>
                  </div>
                ))}
                {expiringData.items.length > 3 && (
                  <p className="text-sm text-orange-600 ml-4">และอีก {expiringData.items.length - 3} รายการ...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
            <input
              type="text"
              placeholder="ค้นหาด้วย Lot Number, ชื่อสินค้า, SKU..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">คลังสินค้า</label>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-56"
            >
              <option value="all">ทั้งหมด</option>
              {warehousesData?.items?.map((warehouse: Warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} - {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ QC</label>
            <select
              value={qualityFilter}
              onChange={(e) => {
                setQualityFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="passed">ผ่าน QC</option>
              <option value="pending">รอตรวจ</option>
              <option value="quarantine">กักกัน</option>
              <option value="failed">ไม่ผ่าน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lots Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !filteredLots || filteredLots.length === 0 ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="mt-2 text-gray-500">ไม่พบข้อมูล Lot</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สินค้า
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lot / Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คลัง
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      คงเหลือ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จอง
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันหมดอายุ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ QC
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLots.map((lot: InventoryLot) => (
                    <tr key={lot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lot.product?.name_th || '-'}
                        </div>
                        <div className="text-xs text-gray-500">SKU: {lot.product?.sku || '-'}</div>
                        {lot.supplier && (
                          <div className="text-xs text-blue-600 mt-1">
                            ผู้จัดจำหน่าย: {lot.supplier.name_th}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono font-semibold text-gray-900">{lot.lot_number}</div>
                        {lot.batch_number && (
                          <div className="text-xs text-gray-500">Batch: {lot.batch_number}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          รับเข้า: {formatDate(lot.received_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{lot.warehouse?.name || '-'}</div>
                        <div className="text-xs text-gray-500">{lot.warehouse?.code || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {lot.quantity_available} / {lot.quantity_received}
                        </div>
                        {getStockLevelIndicator(lot)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-orange-600 font-medium">{lot.quantity_reserved}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(lot.expiry_date)}</div>
                        {lot.manufacture_date && (
                          <div className="text-xs text-gray-500">
                            ผลิต: {formatDate(lot.manufacture_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">{getQualityBadge(lot.quality_status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => setViewingLot(lot)}
                          className="text-teal-600 hover:text-teal-900 inline-flex items-center gap-1"
                          title="ดูรายละเอียด Lot"
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
                          <span className="text-sm">ดูรายละเอียด</span>
                        </button>
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

      {/* Lot Details Modal */}
      {viewingLot && (
        <LotDetailsModal
          isOpen={!!viewingLot}
          onClose={() => setViewingLot(null)}
          lot={viewingLot}
        />
      )}
    </div>
  );
}
