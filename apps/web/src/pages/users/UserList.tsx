import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import UserForm from '@/components/forms/UserForm';
import api from '@/services/api';
import { format } from 'date-fns';

export default function UserList() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<boolean | null>(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', statusFilter, roleFilter],
    queryFn: async () => {
      const response = await api.get('/users/');
      let filteredUsers = response.data as User[];

      // Filter by status
      if (statusFilter !== null) {
        filteredUsers = filteredUsers.filter((u) => u.is_active === statusFilter);
      }

      // Filter by role
      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter((u) => u.role === roleFilter);
      }

      return filteredUsers;
    },
  });

  // Get current user (for preventing self-deletion)
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data as User;
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการปิดการใช้งานผู้ใช้');
    },
  });

  const handleDeactivate = (user: User) => {
    if (currentUser && user.id === currentUser.id) {
      alert('ไม่สามารถปิดการใช้งานบัญชีของตัวเองได้');
      return;
    }

    if (window.confirm(`ต้องการปิดการใช้งานผู้ใช้ "${user.full_name}" หรือไม่?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleStyles: Record<
      string,
      { bg: string; text: string; label: string; icon: string }
    > = {
      admin: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin', icon: '👑' },
      manager: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Manager', icon: '📊' },
      pharmacist: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: 'Pharmacist',
        icon: '💊',
      },
      staff: { bg: 'bg-green-100', text: 'text-green-800', label: 'Staff', icon: '👤' },
      cashier: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cashier', icon: '💰' },
    };

    const style = roleStyles[role] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: role,
      icon: '👤',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon} {style.label}
      </span>
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        <p className="text-sm text-gray-600 mt-2">
          กรุณาตรวจสอบว่าคุณมีสิทธิ์ Admin ในการเข้าถึงหน้านี้
        </p>
      </div>
    );
  }

  // Show form if creating or editing
  if (showCreateForm || editingUser) {
    return (
      <div>
        <UserForm
          user={editingUser || undefined}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingUser(null);
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingUser(null);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            จัดการผู้ใช้งาน (User Management)
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงระบบ (Admin Only)
          </p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
          + เพิ่มผู้ใช้งานใหม่
        </button>
      </div>

      {/* Security Notice */}
      <div className="card border-l-4 border-blue-500 bg-blue-50 mb-6">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">ข้อมูลความปลอดภัย</p>
            <p className="mt-1">
              การจัดการผู้ใช้งานต้องใช้สิทธิ์ Admin เท่านั้น
              กรุณาตรวจสอบสิทธิ์การเข้าถึงอย่างรอบคอบก่อนมอบสิทธิ์ Admin ให้ผู้อื่น
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={statusFilter === null ? 'all' : statusFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val === 'all' ? null : val === 'active');
              }}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">ใช้งาน</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">ทั้งหมด</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="staff">Staff</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : !users || users.length === 0 ? (
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <p className="mt-2 text-gray-500">ไม่พบผู้ใช้งาน</p>
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary mt-4">
              เพิ่มผู้ใช้งานคนแรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ใช้งาน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เบอร์โทร
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สร้างเมื่อ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user: User) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-gray-50 ${
                      currentUser && user.id === currentUser.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-lg">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name}
                            {currentUser && user.id === currentUser.id && (
                              <span className="ml-2 text-xs text-blue-600">(คุณ)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="แก้ไข"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Deactivate */}
                        {user.is_active && (
                          <button
                            onClick={() => handleDeactivate(user)}
                            className={`hover:text-red-900 ${
                              currentUser && user.id === currentUser.id
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600'
                            }`}
                            title={
                              currentUser && user.id === currentUser.id
                                ? 'ไม่สามารถปิดบัญชีตัวเองได้'
                                : 'ปิดการใช้งาน'
                            }
                            disabled={currentUser && user.id === currentUser.id}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {users && users.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="card">
            <div className="text-sm text-gray-600">ผู้ใช้งานทั้งหมด</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">ใช้งานอยู่</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.is_active).length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Admin</div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.role === 'admin').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Pharmacist</div>
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === 'pharmacist').length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Staff/Cashier</div>
            <div className="text-2xl font-bold text-primary-600">
              {users.filter((u) => u.role === 'staff' || u.role === 'cashier').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
