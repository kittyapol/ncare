import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import prescriptionService from '@/services/prescriptionApi';

interface Props {
  prescriptionId: string;
  customerId: string;
}

export default function SafetyCheckPanel({ prescriptionId, customerId }: Props) {
  const [isRunningCheck, setIsRunningCheck] = useState(false);

  // Fetch prescription details to get product IDs
  const { data: prescription } = useQuery({
    queryKey: ['prescription', prescriptionId],
    queryFn: () => prescriptionService.prescriptions.getById(prescriptionId),
  });

  // Run safety check mutation
  const runSafetyCheckMutation = useMutation({
    mutationFn: async () => {
      if (!prescription?.items) {
        throw new Error('No prescription items found');
      }

      const productIds = prescription.items
        .map(item => item.product_id)
        .filter(Boolean);

      return prescriptionService.safety.performSafetyCheck({
        entity_type: 'prescription',
        entity_id: prescriptionId,
        customer_id: customerId,
        product_ids: productIds,
        check_interactions: true,
        check_allergies: true,
        check_dosage: true,
      });
    },
    onSuccess: () => {
      setIsRunningCheck(false);
    },
    onError: () => {
      setIsRunningCheck(false);
    },
  });

  const handleRunSafetyCheck = () => {
    setIsRunningCheck(true);
    runSafetyCheckMutation.mutate();
  };

  const safetyCheck = runSafetyCheckMutation.data;

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: 'bg-blue-50 text-blue-800 border-blue-200',
      warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      error: 'bg-orange-50 text-orange-800 border-orange-200',
      critical: 'bg-red-50 text-red-800 border-red-200',
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Run Safety Check Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">การตรวจสอบความปลอดภัย</h3>
        <button
          onClick={handleRunSafetyCheck}
          disabled={isRunningCheck}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningCheck ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              กำลังตรวจสอบ...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ตรวจสอบความปลอดภัย
            </>
          )}
        </button>
      </div>

      {/* Safety Check Results */}
      {safetyCheck && (
        <div className="space-y-3">
          {/* Summary */}
          <div className={`rounded-lg p-4 border ${
            safetyCheck.check_result === 'pass'
              ? 'bg-green-50 border-green-200'
              : safetyCheck.check_result === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {safetyCheck.check_result === 'pass' && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {safetyCheck.check_result === 'warning' && (
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {safetyCheck.check_result === 'fail' && (
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <h4 className={`text-lg font-semibold ${
                  safetyCheck.check_result === 'pass'
                    ? 'text-green-900'
                    : safetyCheck.check_result === 'warning'
                    ? 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  {safetyCheck.check_result === 'pass' && 'ผ่านการตรวจสอบ'}
                  {safetyCheck.check_result === 'warning' && 'พบข้อควรระวัง'}
                  {safetyCheck.check_result === 'fail' && 'พบปัญหาสำคัญ'}
                </h4>
              </div>
              <div className="text-right text-sm">
                <p className={`font-medium ${
                  safetyCheck.check_result === 'pass'
                    ? 'text-green-800'
                    : safetyCheck.check_result === 'warning'
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  สรุปผลการตรวจสอบ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-2 rounded ${
                safetyCheck.critical_issues > 0 ? 'bg-red-100' : 'bg-white bg-opacity-50'
              }`}>
                <p className="text-2xl font-bold text-red-600">{safetyCheck.critical_issues}</p>
                <p className="text-xs text-gray-600">ปัญหาวิกฤติ</p>
              </div>
              <div className={`p-2 rounded ${
                safetyCheck.errors_found > 0 ? 'bg-orange-100' : 'bg-white bg-opacity-50'
              }`}>
                <p className="text-2xl font-bold text-orange-600">{safetyCheck.errors_found}</p>
                <p className="text-xs text-gray-600">ข้อผิดพลาด</p>
              </div>
              <div className={`p-2 rounded ${
                safetyCheck.warnings_found > 0 ? 'bg-yellow-100' : 'bg-white bg-opacity-50'
              }`}>
                <p className="text-2xl font-bold text-yellow-600">{safetyCheck.warnings_found}</p>
                <p className="text-xs text-gray-600">คำเตือน</p>
              </div>
            </div>
          </div>

          {/* Detailed Issues */}
          {safetyCheck.details && safetyCheck.details.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-900">รายละเอียดการตรวจสอบ</h5>
              {safetyCheck.details.map((detail, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${getSeverityColor(detail.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(detail.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          detail.severity === 'critical' ? 'bg-red-200 text-red-900' :
                          detail.severity === 'error' ? 'bg-orange-200 text-orange-900' :
                          detail.severity === 'warning' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {detail.severity === 'critical' && 'วิกฤติ'}
                          {detail.severity === 'error' && 'ข้อผิดพลาด'}
                          {detail.severity === 'warning' && 'คำเตือน'}
                          {detail.severity === 'info' && 'ข้อมูล'}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          detail.category === 'interaction' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          detail.category === 'allergy' ? 'bg-red-50 text-red-700 border-red-200' :
                          detail.category === 'dosage' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {detail.category === 'interaction' && '🔄 ปฏิกิริยายา'}
                          {detail.category === 'allergy' && '⚠️ แพ้ยา'}
                          {detail.category === 'dosage' && '💊 ขนาดยา'}
                          {detail.category === 'contraindication' && '🚫 ข้อห้าม'}
                          {detail.category === 'duplicate_therapy' && '📋 ซ้ำซ้อน'}
                          {detail.category === 'age_related' && '👤 เกี่ยวกับอายุ'}
                          {detail.category === 'pregnancy' && '🤰 ตั้งครรภ์'}
                          {detail.category === 'other' && 'อื่นๆ'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {detail.message}
                      </p>
                      {detail.recommendation && (
                        <div className="mt-2 p-2 bg-white bg-opacity-70 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">💡 คำแนะนำ:</p>
                          <p className="text-sm text-gray-800">{detail.recommendation}</p>
                        </div>
                      )}
                      {detail.affected_drugs && detail.affected_drugs.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">ยาที่เกี่ยวข้อง:</p>
                          <div className="flex flex-wrap gap-1">
                            {detail.affected_drugs.map((drug, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white bg-opacity-70 text-xs rounded-full border border-gray-300"
                              >
                                {drug}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Issues Found */}
          {(!safetyCheck.details || safetyCheck.details.length === 0) && safetyCheck.check_result === 'pass' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <svg className="w-12 h-12 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-green-900 font-medium">ไม่พบปัญหาด้านความปลอดภัย</p>
              <p className="text-green-700 text-sm mt-1">ใบสั่งยานี้ผ่านการตรวจสอบความปลอดภัยทั้งหมด</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!safetyCheck && !isRunningCheck && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-gray-700 font-medium mb-1">ยังไม่ได้ทำการตรวจสอบความปลอดภัย</p>
          <p className="text-gray-500 text-sm">กดปุ่ม "ตรวจสอบความปลอดภัย" เพื่อเริ่มการตรวจสอบ</p>
        </div>
      )}
    </div>
  );
}
