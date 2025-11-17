import { useQuery } from '@tanstack/react-query';
import { Customer, SalesOrder } from '@/types';
import api from '@/services/api';
import { format } from 'date-fns';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onEdit: () => void;
}

export default function CustomerProfileModal({
  isOpen,
  onClose,
  customer,
  onEdit,
}: CustomerProfileModalProps) {
  // Fetch customer's sales orders
  const { data: salesOrdersData } = useQuery({
    queryKey: ['sales-orders', 'customer', customer.id],
    queryFn: async () => {
      const response = await api.get('/sales/orders/', {
        params: { customer_id: customer.id, limit: 10 },
      });
      return response.data;
    },
    enabled: isOpen,
  });

  const salesOrders: SalesOrder[] = salesOrdersData?.items || [];

  // Calculate statistics
  const totalOrders = salesOrders.length;
  const totalAmount = salesOrders.reduce((sum, so) => sum + so.total_amount, 0);
  const completedOrders = salesOrders.filter((so) => so.status === 'completed').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels: Record<string, string> = {
      draft: 'ร่าง',
      confirmed: 'ยืนยันแล้ว',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusStyles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {statusLabels[status] || status}
      </span>
    );
  };

  const getMembershipBadge = (tier?: string) => {
    if (!tier) return <span className="text-gray-400 text-sm">ไม่มีสมาชิกภาพ</span>;

    const tierStyles: Record<string, string> = {
      Bronze: 'bg-amber-700 text-white border-amber-800',
      Silver: 'bg-gray-400 text-white border-gray-500',
      Gold: 'bg-yellow-400 text-yellow-900 border-yellow-500',
      Platinum: 'bg-purple-600 text-white border-purple-700',
    };

    const tierIcons: Record<string, string> = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Platinum: '💎',
    };

    return (
      <div className="flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-lg text-sm font-semibold border-2 ${
            tierStyles[tier] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {tierIcons[tier] || ''} {tier}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-indigo-700 font-medium mt-1">
                  รหัส: {customer.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                แก้ไข
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
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

          {/* Modal Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">ยอดสั่งซื้อ</p>
                    <p className="text-3xl font-bold text-blue-900">{totalOrders}</p>
                    <p className="text-xs text-blue-600 mt-1">รายการทั้งหมด</p>
                  </div>
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">มูลค่ารวม</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(totalAmount)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">ยอดซื้อทั้งหมด</p>
                  </div>
                  <div className="p-3 bg-green-600 rounded-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">คำสั่งซื้อสำเร็จ</p>
                    <p className="text-3xl font-bold text-purple-900">{completedOrders}</p>
                    <p className="text-xs text-purple-600 mt-1">ชำระเงินแล้ว</p>
                  </div>
                  <div className="p-3 bg-purple-600 rounded-lg">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ข้อมูลลูกค้า
                </h4>

                <div className="space-y-4">
                  {/* Membership */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">ระดับสมาชิก</label>
                    <div className="mt-1">{getMembershipBadge(customer.membership_tier)}</div>
                  </div>

                  {/* Gender */}
                  {customer.gender && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">เพศ</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {customer.gender === 'male' ? 'ชาย' : customer.gender === 'female' ? 'หญิง' : 'ไม่ระบุ'}
                      </p>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {customer.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">วันเกิด</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(customer.date_of_birth), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    {customer.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">โทรศัพท์</label>
                        <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.phone}
                        </p>
                      </div>
                    )}

                    {customer.mobile && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">มือถือ</label>
                        <p className="mt-1 text-sm text-gray-900">{customer.mobile}</p>
                      </div>
                    )}
                  </div>

                  {customer.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">อีเมล</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {customer.email}
                      </p>
                    </div>
                  )}

                  {/* Address */}
                  {customer.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">ที่อยู่</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.address}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">สถานะ</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          customer.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {customer.is_active ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ข้อมูลสุขภาพ
                </h4>

                <div className="space-y-4">
                  {customer.allergies && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-red-700 mb-1 block flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        แพ้ยา / สารก่อภูมิแพ้
                      </label>
                      <p className="text-sm text-red-900 whitespace-pre-wrap">{customer.allergies}</p>
                    </div>
                  )}

                  {customer.chronic_conditions && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-orange-700 mb-1 block">
                        โรคประจำตัว
                      </label>
                      <p className="text-sm text-orange-900 whitespace-pre-wrap">
                        {customer.chronic_conditions}
                      </p>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        หมายเหตุ
                      </label>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
                    </div>
                  )}

                  {!customer.allergies && !customer.chronic_conditions && !customer.notes && (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">ยังไม่มีข้อมูลสุขภาพ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Orders History */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  ประวัติการซื้อ
                </h4>
                {totalOrders > 10 && (
                  <a
                    href={`/sales-orders?customer=${customer.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    ดูทั้งหมด →
                  </a>
                )}
              </div>

              {salesOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-sm">ยังไม่มีประวัติการซื้อ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          เลขที่ออเดอร์
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          วันที่สั่งซื้อ
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          มูลค่า
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          สถานะ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salesOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <a
                              href={`/sales-orders/${order.id}`}
                              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              {order.order_number}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatDateTime(order.order_date)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(order.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={onClose} className="btn btn-secondary">
              ปิด
            </button>
            <button onClick={onEdit} className="btn btn-primary">
              แก้ไขข้อมูล
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
