import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import prescriptionService from '@/services/prescriptionApi';
import type { Prescription } from '@/types';
import PharmacistVerificationModal from './PharmacistVerificationModal';
import SafetyCheckPanel from '../prescription/SafetyCheckPanel';

interface Props {
  prescription: Prescription | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PrescriptionDetailsModal({ prescription, isOpen, onClose }: Props) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'documents' | 'verification' | 'safety'>('details');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Fetch full prescription details if ID provided
  const { data: fullPrescription, isLoading } = useQuery({
    queryKey: ['prescription', prescription?.id],
    queryFn: () => prescription?.id
      ? prescriptionService.prescriptions.getById(prescription.id)
      : Promise.resolve(prescription),
    enabled: !!prescription?.id && isOpen,
  });

  const prescriptionData = fullPrescription || prescription;

  if (!isOpen) return null;

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

  const getTypeColor = (type: string) => {
    const colors = {
      acute: 'bg-blue-50 text-blue-700 border-blue-200',
      chronic: 'bg-purple-50 text-purple-700 border-purple-200',
      controlled: 'bg-orange-50 text-orange-700 border-orange-200',
      narcotic: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div>
              <h2 className="text-xl font-bold">รายละเอียดใบสั่งยา</h2>
              {prescriptionData && (
                <p className="text-indigo-100 text-sm">
                  เลขที่: {prescriptionData.prescription_number}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : prescriptionData ? (
            <>
              {/* Status Banner */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(prescriptionData.status)}`}>
                    {prescriptionData.status === 'pending_verification' && 'รอตรวจสอบ'}
                    {prescriptionData.status === 'verified' && 'ตรวจสอบแล้ว'}
                    {prescriptionData.status === 'dispensed' && 'จ่ายยาแล้ว'}
                    {prescriptionData.status === 'partially_dispensed' && 'จ่ายยาบางส่วน'}
                    {prescriptionData.status === 'cancelled' && 'ยกเลิก'}
                    {prescriptionData.status === 'expired' && 'หมดอายุ'}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTypeColor(prescriptionData.prescription_type)}`}>
                    {prescriptionData.prescription_type === 'acute' && 'ยาเฉพาะครั้ง'}
                    {prescriptionData.prescription_type === 'chronic' && 'ยาโรคเรื้อรัง'}
                    {prescriptionData.prescription_type === 'controlled' && 'ยาควบคุมพิเศษ'}
                    {prescriptionData.prescription_type === 'narcotic' && 'ยาเสพติด'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {prescriptionData.status === 'pending_verification' && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ตรวจสอบใบสั่งยา
                    </button>
                  )}
                  {prescriptionData.status === 'verified' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      จ่ายยา
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-white">
                <div className="flex px-6 gap-6">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'details'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ข้อมูลใบสั่งยา
                  </button>
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'items'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    รายการยา ({prescriptionData.items?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'documents'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    เอกสาร ({prescriptionData.document_count || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'verification'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    การตรวจสอบ
                  </button>
                  <button
                    onClick={() => setActiveTab('safety')}
                    className={`py-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'safety'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ความปลอดภัย
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Patient Information */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        ข้อมูลผู้ป่วย
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-blue-700 font-medium">ชื่อผู้ป่วย</p>
                          <p className="text-sm text-blue-900">{prescriptionData.customer?.name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 font-medium">รหัสผู้ป่วย</p>
                          <p className="text-sm text-blue-900">{prescriptionData.customer?.code || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 font-medium">อายุ</p>
                          <p className="text-sm text-blue-900">
                            {prescriptionData.customer?.date_of_birth
                              ? `${Math.floor((Date.now() - new Date(prescriptionData.customer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ปี`
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-700 font-medium">โทรศัพท์</p>
                          <p className="text-sm text-blue-900">{prescriptionData.customer?.phone || '-'}</p>
                        </div>
                        {prescriptionData.customer?.allergies && (
                          <div className="col-span-2">
                            <p className="text-xs text-red-700 font-medium">ประวัติแพ้ยา</p>
                            <p className="text-sm text-red-900 bg-red-50 p-2 rounded border border-red-200">
                              {prescriptionData.customer.allergies}
                            </p>
                          </div>
                        )}
                        {prescriptionData.customer?.chronic_conditions && (
                          <div className="col-span-2">
                            <p className="text-xs text-orange-700 font-medium">โรคประจำตัว</p>
                            <p className="text-sm text-orange-900 bg-orange-50 p-2 rounded border border-orange-200">
                              {prescriptionData.customer.chronic_conditions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescription Information */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ข้อมูลใบสั่งยา
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">แพทย์ผู้สั่งยา</p>
                          <p className="text-sm text-gray-900">{prescriptionData.doctor_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">เลขที่ใบอนุญาต</p>
                          <p className="text-sm text-gray-900">{prescriptionData.doctor_license}</p>
                        </div>
                        {prescriptionData.hospital_clinic && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600 font-medium">โรงพยาบาล/คลินิก</p>
                            <p className="text-sm text-gray-900">{prescriptionData.hospital_clinic}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 font-medium">วันที่สั่งยา</p>
                          <p className="text-sm text-gray-900">
                            {new Date(prescriptionData.prescription_date).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        {prescriptionData.valid_until && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">ใช้ได้ถึง</p>
                            <p className="text-sm text-gray-900">
                              {new Date(prescriptionData.valid_until).toLocaleDateString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        )}
                        {prescriptionData.diagnosis && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600 font-medium">การวินิจฉัย</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                              {prescriptionData.diagnosis}
                            </p>
                          </div>
                        )}
                        {prescriptionData.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-600 font-medium">หมายเหตุ</p>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                              {prescriptionData.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Refill Information */}
                    {prescriptionData.is_refillable && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          ข้อมูลการเติมยา
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-purple-700 font-medium">จำนวนครั้งที่เติมได้ทั้งหมด</p>
                            <p className="text-sm text-purple-900">{prescriptionData.max_refills || 0} ครั้ง</p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-700 font-medium">เหลือจำนวนครั้งที่เติมได้</p>
                            <p className="text-sm text-purple-900 font-bold">{prescriptionData.refills_remaining || 0} ครั้ง</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'items' && (
                  <div className="space-y-3">
                    {prescriptionData.items && prescriptionData.items.length > 0 ? (
                      prescriptionData.items.map((item, index) => (
                        <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                                <h4 className="text-base font-semibold text-gray-900">{item.drug_name}</h4>
                                {item.has_interaction_warning && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full">
                                    ⚠️ ปฏิกิริยายา
                                  </span>
                                )}
                                {item.has_allergy_warning && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                    ⚠️ แพ้ยา
                                  </span>
                                )}
                              </div>
                              {item.generic_name && (
                                <p className="text-sm text-gray-600">{item.generic_name}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                                {item.strength && <span>ขนาด: {item.strength}</span>}
                                {item.dosage_form && <span>รูปแบบ: {item.dosage_form}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                สั่ง: {item.quantity_prescribed} {prescriptionData.items?.[0]?.product?.unit_of_measure || 'เม็ด'}
                              </p>
                              {item.quantity_dispensed > 0 && (
                                <p className="text-xs text-green-600">
                                  จ่ายแล้ว: {item.quantity_dispensed}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-blue-50 p-3 rounded border border-blue-100">
                              <p className="text-xs font-medium text-blue-900 mb-1">วิธีใช้ยา</p>
                              <p className="text-sm text-blue-800">{item.dosage_instructions}</p>
                              {item.frequency && (
                                <p className="text-xs text-blue-700 mt-1">ความถี่: {item.frequency}</p>
                              )}
                              {item.duration && (
                                <p className="text-xs text-blue-700">ระยะเวลา: {item.duration}</p>
                              )}
                            </div>
                            {item.special_instructions && (
                              <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                                <p className="text-xs font-medium text-yellow-900 mb-1">คำเตือนพิเศษ</p>
                                <p className="text-sm text-yellow-800">{item.special_instructions}</p>
                              </div>
                            )}
                            {item.warning_message && (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-xs font-medium text-red-900 mb-1">⚠️ คำเตือน</p>
                                <p className="text-sm text-red-800">{item.warning_message}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p>ไม่มีรายการยา</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        อัพโหลดเอกสาร
                      </button>
                    </div>
                    {prescriptionData.documents && prescriptionData.documents.length > 0 ? (
                      prescriptionData.documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between hover:border-indigo-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 rounded-lg p-3">
                              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.file_size / 1024).toFixed(2)} KB •
                                อัพโหลดเมื่อ {new Date(doc.uploaded_at).toLocaleDateString('th-TH')}
                              </p>
                            </div>
                          </div>
                          <button className="text-indigo-600 hover:text-indigo-800 p-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <p>ไม่มีเอกสารแนบ</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'verification' && (
                  <div className="space-y-4">
                    {prescriptionData.verified_by ? (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-green-900 mb-2">ตรวจสอบและอนุมัติแล้ว</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-green-700">ตรวจสอบโดย:</span>
                                <span className="text-green-900 font-medium ml-1">{prescriptionData.verified_by}</span>
                              </div>
                              <div>
                                <span className="text-green-700">เมื่อ:</span>
                                <span className="text-green-900 font-medium ml-1">
                                  {prescriptionData.verified_at
                                    ? new Date(prescriptionData.verified_at).toLocaleDateString('th-TH')
                                    : '-'}
                                </span>
                              </div>
                            </div>
                            {prescriptionData.verification_notes && (
                              <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                <p className="text-xs text-gray-600 font-medium">หมายเหตุการตรวจสอบ:</p>
                                <p className="text-sm text-gray-900">{prescriptionData.verification_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-yellow-800">ใบสั่งยานี้ยังไม่ได้รับการตรวจสอบจากเภสัชกร</p>
                        </div>
                      </div>
                    )}

                    {/* Verification History */}
                    {prescriptionData.verifications && prescriptionData.verifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">ประวัติการตรวจสอบ</h4>
                        <div className="space-y-2">
                          {prescriptionData.verifications.map((verification) => (
                            <div key={verification.id} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  {new Date(verification.verification_date).toLocaleString('th-TH')}
                                </span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  verification.decision === 'approve'
                                    ? 'bg-green-100 text-green-800'
                                    : verification.decision === 'reject'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {verification.decision === 'approve' && 'อนุมัติ'}
                                  {verification.decision === 'reject' && 'ปฏิเสธ'}
                                  {verification.decision === 'request_clarification' && 'ต้องการข้อมูลเพิ่มเติม'}
                                </span>
                              </div>
                              {verification.pharmacist_notes && (
                                <p className="text-sm text-gray-700">{verification.pharmacist_notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'safety' && prescriptionData.id && (
                  <SafetyCheckPanel prescriptionId={prescriptionData.id} customerId={prescriptionData.customer_id} />
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ปิด
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              ไม่พบข้อมูลใบสั่งยา
            </div>
          )}
        </div>
      </div>

      {/* Pharmacist Verification Modal */}
      {isVerificationModalOpen && prescriptionData && (
        <PharmacistVerificationModal
          prescription={prescriptionData}
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['prescription', prescriptionData.id] });
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
          }}
        />
      )}
    </>
  );
}
