import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import prescriptionService from '@/services/prescriptionApi';
import type { Prescription } from '@/types';
import PrescriptionDetailsModal from '@/components/modals/PrescriptionDetailsModal';

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch prescriptions
  const { data: prescriptions = [], isLoading, refetch } = useQuery({
    queryKey: ['prescriptions', statusFilter, typeFilter],
    queryFn: () => prescriptionService.prescriptions.getAll({
      status: statusFilter || undefined,
      prescription_type: typeFilter || undefined,
    }),
  });

  // Filter prescriptions by search term
  const filteredPrescriptions = prescriptions.filter(prescription =>
    prescription.prescription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prescription.doctor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors = {
      pending_verification: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      dispensed: 'bg-green-100 text-green-800',
      partially_dispensed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    const colors = {
      acute: 'bg-blue-50 text-blue-700 border-blue-200',
      chronic: 'bg-purple-50 text-purple-700 border-purple-200',
      controlled: 'bg-orange-50 text-orange-700 border-orange-200',
      narcotic: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ใบสั่งยา</h1>
          <p className="text-gray-600 mt-1">จัดการใบสั่งยาและการตรวจสอบโดยเภสัชกร</p>
        </div>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          onClick={() => {
            setSelectedPrescription(null);
            setIsDetailsModalOpen(true);
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มใบสั่งยา
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">รอตรวจสอบ</p>
              <p className="text-3xl font-bold mt-1">
                {prescriptions.filter(p => p.status === 'pending_verification').length}
              </p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">ตรวจสอบแล้ว</p>
              <p className="text-3xl font-bold mt-1">
                {prescriptions.filter(p => p.status === 'verified').length}
              </p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">จ่ายยาแล้ว</p>
              <p className="text-3xl font-bold mt-1">
                {prescriptions.filter(p => p.status === 'dispensed').length}
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">รอเติมยา</p>
              <p className="text-3xl font-bold mt-1">
                {prescriptions.filter(p => p.is_refillable && (p.refills_remaining || 0) > 0).length}
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="ค้นหาเลขที่ใบสั่งยา, ผู้ป่วย, แพทย์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="pending_verification">รอตรวจสอบ</option>
              <option value="verified">ตรวจสอบแล้ว</option>
              <option value="dispensed">จ่ายยาแล้ว</option>
              <option value="partially_dispensed">จ่ายยาบางส่วน</option>
              <option value="cancelled">ยกเลิก</option>
              <option value="expired">หมดอายุ</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">ประเภททั้งหมด</option>
              <option value="acute">ยาเฉพาะครั้ง</option>
              <option value="chronic">ยาโรคเรื้อรัง</option>
              <option value="controlled">ยาควบคุมพิเศษ</option>
              <option value="narcotic">ยาเสพติด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">ไม่พบใบสั่งยา</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เลขที่ใบสั่งยา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ป่วย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    แพทย์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สั่งยา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การแจ้งเตือน
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrescriptions.map((prescription) => (
                  <tr
                    key={prescription.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(prescription)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {prescription.prescription_number}
                      </div>
                      {prescription.is_refillable && (
                        <div className="text-xs text-purple-600">
                          เติมยาได้ {prescription.refills_remaining || 0} ครั้ง
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prescription.customer?.name || '-'}</div>
                      <div className="text-xs text-gray-500">{prescription.customer?.code || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prescription.doctor_name}</div>
                      <div className="text-xs text-gray-500">ใบอนุญาต: {prescription.doctor_license}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(prescription.prescription_date).toLocaleDateString('th-TH')}
                      </div>
                      {prescription.valid_until && (
                        <div className="text-xs text-gray-500">
                          ใช้ได้ถึง: {new Date(prescription.valid_until).toLocaleDateString('th-TH')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(prescription.prescription_type)}`}>
                        {prescription.prescription_type === 'acute' && 'เฉพาะครั้ง'}
                        {prescription.prescription_type === 'chronic' && 'โรคเรื้อรัง'}
                        {prescription.prescription_type === 'controlled' && 'ควบคุมพิเศษ'}
                        {prescription.prescription_type === 'narcotic' && 'ยาเสพติด'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                        {prescription.status === 'pending_verification' && 'รอตรวจสอบ'}
                        {prescription.status === 'verified' && 'ตรวจสอบแล้ว'}
                        {prescription.status === 'dispensed' && 'จ่ายยาแล้ว'}
                        {prescription.status === 'partially_dispensed' && 'จ่ายยาบางส่วน'}
                        {prescription.status === 'cancelled' && 'ยกเลิก'}
                        {prescription.status === 'expired' && 'หมดอายุ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {!prescription.drug_interaction_checked && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ยังไม่ตรวจปฏิกิริยายา
                          </span>
                        )}
                        {!prescription.allergy_checked && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            ยังไม่ตรวจแพ้ยา
                          </span>
                        )}
                        {prescription.has_documents && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                            </svg>
                            มีเอกสาร {prescription.document_count}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(prescription);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Details Modal */}
      {isDetailsModalOpen && (
        <PrescriptionDetailsModal
          prescription={selectedPrescription}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedPrescription(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
