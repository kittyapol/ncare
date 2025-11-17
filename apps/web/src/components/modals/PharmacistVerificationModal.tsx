import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import prescriptionService from '@/services/prescriptionApi';
import type { Prescription } from '@/types';
import { toast } from 'react-hot-toast';

interface Props {
  prescription: Prescription;
  isOpen: boolean;
  onClose: () => void;
}

export default function PharmacistVerificationModal({ prescription, isOpen, onClose }: Props) {
  const [checklist, setChecklist] = useState({
    prescription_validity_checked: false,
    doctor_license_verified: false,
    drug_interactions_checked: false,
    allergies_checked: false,
    dosage_verified: false,
    duration_appropriate: false,
  });

  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_clarification'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const [requiresDoctorContact, setRequiresDoctorContact] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: () => prescriptionService.verification.verify(prescription.id, {
      ...checklist,
      decision,
      rejection_reason: decision === 'reject' ? rejectionReason : undefined,
      clarification_notes: decision === 'request_clarification' ? clarificationNotes : undefined,
      pharmacist_notes: pharmacistNotes || undefined,
      requires_doctor_contact: requiresDoctorContact,
    }),
    onSuccess: () => {
      toast.success('บันทึกการตรวจสอบเรียบร้อยแล้ว');
      onClose();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการบันทึกการตรวจสอบ');
    },
  });

  const handleSubmit = () => {
    // Validate
    const allChecked = Object.values(checklist).every(v => v === true);
    if (!allChecked) {
      toast.error('กรุณาทำรายการตรวจสอบให้ครบถ้วน');
      return;
    }

    if (decision === 'reject' && !rejectionReason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    if (decision === 'request_clarification' && !clarificationNotes.trim()) {
      toast.error('กรุณาระบุข้อมูลที่ต้องการเพิ่มเติม');
      return;
    }

    verifyMutation.mutate();
  };

  if (!isOpen) return null;

  const allChecked = Object.values(checklist).every(v => v === true);
  const canSubmit = allChecked && !verifyMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold">ตรวจสอบและอนุมัติใบสั่งยา</h2>
          <p className="text-blue-100 text-sm">เลขที่: {prescription.prescription_number}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Patient Warning */}
          {(prescription.customer?.allergies || prescription.customer?.chronic_conditions) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">⚠️ คำเตือนสำคัญ</h3>
                  {prescription.customer?.allergies && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-red-800">ประวัติแพ้ยา:</p>
                      <p className="text-sm text-red-700">{prescription.customer.allergies}</p>
                    </div>
                  )}
                  {prescription.customer?.chronic_conditions && (
                    <div>
                      <p className="text-xs font-medium text-red-800">โรคประจำตัว:</p>
                      <p className="text-sm text-red-700">{prescription.customer.chronic_conditions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification Checklist */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">รายการตรวจสอบ</h3>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.prescription_validity_checked}
                  onChange={(e) => setChecklist({...checklist, prescription_validity_checked: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ตรวจสอบความถูกต้องของใบสั่งยา</p>
                  <p className="text-xs text-gray-600">ตรวจสอบวันที่สั่งยา วันหมดอายุ และความสมบูรณ์ของข้อมูล</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.doctor_license_verified}
                  onChange={(e) => setChecklist({...checklist, doctor_license_verified: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ยืนยันใบอนุญาตแพทย์</p>
                  <p className="text-xs text-gray-600">ตรวจสอบเลขที่ใบอนุญาตแพทย์ผู้สั่งยา ({prescription.doctor_license})</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.drug_interactions_checked}
                  onChange={(e) => setChecklist({...checklist, drug_interactions_checked: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ตรวจสอบปฏิกิริยาระหว่างยา</p>
                  <p className="text-xs text-gray-600">ตรวจสอบปฏิกิริยาระหว่างยาในใบสั่งยา และยาที่ผู้ป่วยใช้อยู่</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.allergies_checked}
                  onChange={(e) => setChecklist({...checklist, allergies_checked: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ตรวจสอบประวัติแพ้ยา</p>
                  <p className="text-xs text-gray-600">ตรวจสอบการแพ้ยากับประวัติผู้ป่วย</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.dosage_verified}
                  onChange={(e) => setChecklist({...checklist, dosage_verified: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ยืนยันขนาดยา</p>
                  <p className="text-xs text-gray-600">ตรวจสอบความเหมาะสมของขนาดยาและวิธีใช้</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.duration_appropriate}
                  onChange={(e) => setChecklist({...checklist, duration_appropriate: e.target.checked})}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">ตรวจสอบระยะเวลาการใช้ยา</p>
                  <p className="text-xs text-gray-600">ยืนยันความเหมาะสมของระยะเวลาการใช้ยา</p>
                </div>
              </label>
            </div>

            {/* Checklist Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">ความคืบหน้า</span>
                <span className="font-medium text-gray-900">
                  {Object.values(checklist).filter(v => v).length} / {Object.values(checklist).length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(Object.values(checklist).filter(v => v).length / Object.values(checklist).length) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Decision */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">การตัดสินใจ</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:border-green-300 transition-colors">
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={(e) => setDecision(e.target.value as 'approve')}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <div>
                  <p className="text-sm font-medium text-green-900">✅ อนุมัติใบสั่งยา</p>
                  <p className="text-xs text-green-700">ใบสั่งยาถูกต้องครบถ้วน สามารถจ่ายยาได้</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:border-red-300 transition-colors">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={(e) => setDecision(e.target.value as 'reject')}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <div>
                  <p className="text-sm font-medium text-red-900">❌ ปฏิเสธใบสั่งยา</p>
                  <p className="text-xs text-red-700">พบปัญหาที่ไม่สามารถจ่ายยาได้</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:border-yellow-300 transition-colors">
                <input
                  type="radio"
                  name="decision"
                  value="request_clarification"
                  checked={decision === 'request_clarification'}
                  onChange={(e) => setDecision(e.target.value as 'request_clarification')}
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <div>
                  <p className="text-sm font-medium text-yellow-900">❓ ต้องการข้อมูลเพิ่มเติม</p>
                  <p className="text-xs text-yellow-700">ต้องการสอบถามข้อมูลเพิ่มเติมจากแพทย์หรือผู้ป่วย</p>
                </div>
              </label>
            </div>
          </div>

          {/* Rejection Reason */}
          {decision === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                เหตุผลในการปฏิเสธ <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="ระบุเหตุผลในการปฏิเสธใบสั่งยา..."
              />
            </div>
          )}

          {/* Clarification Notes */}
          {decision === 'request_clarification' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                ข้อมูลที่ต้องการเพิ่มเติม <span className="text-red-600">*</span>
              </label>
              <textarea
                value={clarificationNotes}
                onChange={(e) => setClarificationNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="ระบุข้อมูลที่ต้องการสอบถามเพิ่มเติม..."
              />
            </div>
          )}

          {/* Pharmacist Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              หมายเหตุของเภสัชกร
            </label>
            <textarea
              value={pharmacistNotes}
              onChange={(e) => setPharmacistNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="บันทึกหมายเหตุเพิ่มเติม (ถ้ามี)..."
            />
          </div>

          {/* Requires Doctor Contact */}
          <label className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={requiresDoctorContact}
              onChange={(e) => setRequiresDoctorContact(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <div>
              <p className="text-sm font-medium text-orange-900">ต้องติดต่อแพทย์ผู้สั่งยา</p>
              <p className="text-xs text-orange-700">ต้องการติดต่อแพทย์เพื่อสอบถามข้อมูลเพิ่มเติม</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {!allChecked && (
              <span className="text-orange-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                กรุณาทำรายการตรวจสอบให้ครบถ้วน
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={verifyMutation.isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {verifyMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกการตรวจสอบ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
