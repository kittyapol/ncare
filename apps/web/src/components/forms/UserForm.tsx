import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { User } from '@/types';

// Validation Schema
const userSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').min(1, 'กรุณาระบุอีเมล'),
  full_name: z.string().min(1, 'กรุณาระบุชื่อ-นามสกุล').max(255, 'ชื่อยาวเกินไป'),
  role: z.enum(['admin', 'manager', 'pharmacist', 'staff', 'cashier'], {
    required_error: 'กรุณาเลือกบทบาท',
  }),
  phone: z.string().max(20, 'เบอร์โทรศัพท์ยาวเกินไป').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(100, 'รหัสผ่านยาวเกินไป')
    .optional()
    .or(z.literal('')),
  confirm_password: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    // If password is provided, confirm_password must match
    if (data.password && data.password.length > 0) {
      return data.password === data.confirm_password;
    }
    return true;
  },
  {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirm_password'],
  }
);

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user
      ? {
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone: user.phone || '',
          password: '',
          confirm_password: '',
          is_active: user.is_active,
        }
      : {
          email: '',
          full_name: '',
          role: 'staff',
          phone: '',
          password: '',
          confirm_password: '',
          is_active: true,
        },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone || null,
        password: data.password,
      };
      const response = await api.post('/users/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const payload: any = {
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone || null,
        is_active: data.is_active,
      };
      // Don't send password in update (handled separately)
      const response = await api.put(`/users/${user!.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้งาน');
    },
  });

  const onSubmit = async (data: UserFormData) => {
    if (user) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'ผู้ดูแลระบบ (Admin)',
      manager: 'ผู้จัดการ (Manager)',
      pharmacist: 'เภสัชกร (Pharmacist)',
      staff: 'พนักงาน (Staff)',
      cashier: 'แคชเชียร์ (Cashier)',
    };
    return roleLabels[role] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      admin: 'สิทธิ์เต็ม: จัดการผู้ใช้, ตั้งค่าระบบ, ดูรายงานทั้งหมด',
      manager: 'จัดการสินค้า, ผู้จัดจำหน่าย, ดูรายงาน',
      pharmacist: 'จัดการยา, ตรวจสอบใบสั่งยา, ให้คำปรึกษา',
      staff: 'ดูข้อมูลพื้นฐาน, สั่งซื้อสินค้า',
      cashier: 'ขายสินค้า, รับชำระเงิน',
    };
    return descriptions[role] || '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {user
            ? 'แก้ไขข้อมูลผู้ใช้งานในระบบ (ไม่สามารถเปลี่ยนรหัสผ่านได้ที่นี่)'
            : 'เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบจัดการร้านขายยา'}
        </p>
      </div>

      {/* Security Warning for Admin */}
      {!user && (
        <div className="card border-l-4 border-yellow-500 bg-yellow-50">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">ข้อควรระวัง</p>
              <p className="mt-1">
                โปรดตั้งรหัสผ่านที่แข็งแรงและแจ้งให้ผู้ใช้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className="input"
              placeholder="example@pharmacy.com"
              disabled={!!user}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            {user && (
              <p className="text-xs text-gray-500 mt-1">ไม่สามารถเปลี่ยนอีเมลได้หลังสร้างผู้ใช้</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('full_name')}
              className="input"
              placeholder="ชื่อเต็ม"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="098-765-4321"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          {user && (
            <div className="flex items-center">
              <input type="checkbox" {...register('is_active')} className="mr-2 h-4 w-4" />
              <label className="text-sm font-medium text-gray-700">บัญชีใช้งานอยู่</label>
            </div>
          )}
        </div>
      </div>

      {/* Role & Permissions */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          บทบาทและสิทธิ์การใช้งาน
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            บทบาท (Role) <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {(['admin', 'manager', 'pharmacist', 'staff', 'cashier'] as const).map((roleValue) => (
              <label
                key={roleValue}
                className="flex items-start p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="radio"
                  {...register('role')}
                  value={roleValue}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{getRoleLabel(roleValue)}</div>
                  <div className="text-sm text-gray-600 mt-1">{getRoleDescription(roleValue)}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && <p className="text-red-500 text-sm mt-2">{errors.role.message}</p>}
        </div>
      </div>

      {/* Password (Create Only) */}
      {!user && (
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ตั้งรหัสผ่าน</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password')}
                className="input"
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('confirm_password')}
                className="input"
                placeholder="ยืนยันรหัสผ่าน"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{errors.confirm_password.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            ยกเลิก
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting
            ? 'กำลังบันทึก...'
            : user
            ? 'บันทึกการแก้ไข'
            : 'เพิ่มผู้ใช้งาน'}
        </button>
      </div>
    </form>
  );
}
