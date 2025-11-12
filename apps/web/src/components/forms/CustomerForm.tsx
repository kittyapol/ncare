import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Customer } from '@/types';

// Validation Schema
const customerSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสลูกค้า').max(50, 'รหัสยาวเกินไป'),
  name: z.string().min(1, 'กรุณาระบุชื่อลูกค้า').max(255, 'ชื่อยาวเกินไป'),

  // Personal info
  national_id: z.string().max(20, 'เลขบัตรประชาชนยาวเกินไป').optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),

  // Contact
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  phone: z.string().max(20, 'เบอร์โทรศัพท์ยาวเกินไป').optional().or(z.literal('')),
  mobile: z.string().max(20, 'เบอร์มือถือยาวเกินไป').optional().or(z.literal('')),

  // Address
  address: z.string().max(500, 'ที่อยู่ยาวเกินไป').optional().or(z.literal('')),
  city: z.string().max(100, 'เขต/อำเภอยาวเกินไป').optional().or(z.literal('')),
  province: z.string().max(100, 'จังหวัดยาวเกินไป').optional().or(z.literal('')),
  postal_code: z.string().max(10, 'รหัสไปรษณีย์ยาวเกินไป').optional().or(z.literal('')),

  // Loyalty program
  loyalty_points: z.coerce.number().int().min(0, 'คะแนนต้องไม่ติดลบ').default(0),
  member_since: z.string().optional().or(z.literal('')),
  membership_tier: z.enum(['bronze', 'silver', 'gold', 'platinum', '']).optional(),

  // Medical info
  allergies: z.string().max(1000, 'ข้อมูลการแพ้ยาวเกินไป').optional().or(z.literal('')),
  chronic_conditions: z.string().max(1000, 'ข้อมูลโรคประจำตัวยาวเกินไป').optional().or(z.literal('')),

  // Status and notes
  is_active: z.boolean().default(true),
  notes: z.string().max(2000, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          code: customer.code,
          name: customer.name,
          national_id: customer.national_id || '',
          date_of_birth: customer.date_of_birth || '',
          gender: (customer.gender as 'male' | 'female' | 'other' | '') || '',
          email: customer.email || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          address: customer.address || '',
          city: customer.city || '',
          province: customer.province || '',
          postal_code: customer.postal_code || '',
          loyalty_points: customer.loyalty_points || 0,
          member_since: customer.member_since || '',
          membership_tier: (customer.membership_tier as 'bronze' | 'silver' | 'gold' | 'platinum' | '') || '',
          allergies: customer.allergies || '',
          chronic_conditions: customer.chronic_conditions || '',
          is_active: customer.is_active,
          notes: customer.notes || '',
        }
      : {
          code: '',
          name: '',
          national_id: '',
          date_of_birth: '',
          gender: '',
          email: '',
          phone: '',
          mobile: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          loyalty_points: 0,
          member_since: '',
          membership_tier: '',
          allergies: '',
          chronic_conditions: '',
          is_active: true,
          notes: '',
        },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = {
        ...data,
        // Convert empty strings to null for optional fields
        national_id: data.national_id || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postal_code || null,
        member_since: data.member_since || null,
        membership_tier: data.membership_tier || null,
        allergies: data.allergies || null,
        chronic_conditions: data.chronic_conditions || null,
        notes: data.notes || null,
      };
      const response = await api.post('/customers/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการสร้างข้อมูลลูกค้า');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = {
        ...data,
        // Convert empty strings to null for optional fields
        national_id: data.national_id || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postal_code || null,
        member_since: data.member_since || null,
        membership_tier: data.membership_tier || null,
        allergies: data.allergies || null,
        chronic_conditions: data.chronic_conditions || null,
        notes: data.notes || null,
      };
      const response = await api.put(`/customers/${customer!.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      alert(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า');
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    if (customer) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {customer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          กรอกข้อมูลลูกค้าสำหรับระบบบริหารจัดการร้านขายยา
        </p>
      </div>

      {/* Basic Information */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('code')}
              className="input"
              placeholder="เช่น CUST001"
              disabled={!!customer}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input type="text" {...register('name')} className="input" placeholder="ชื่อเต็ม" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลขบัตรประชาชน</label>
            <input
              type="text"
              {...register('national_id')}
              className="input"
              placeholder="1-2345-67890-12-3"
              maxLength={17}
            />
            {errors.national_id && (
              <p className="text-red-500 text-sm mt-1">{errors.national_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันเกิด</label>
            <input type="date" {...register('date_of_birth')} className="input" />
            {errors.date_of_birth && (
              <p className="text-red-500 text-sm mt-1">{errors.date_of_birth.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
            <select {...register('gender')} className="input">
              <option value="">ไม่ระบุ</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
              <option value="other">อื่นๆ</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
          </div>

          <div className="flex items-center">
            <input type="checkbox" {...register('is_active')} className="mr-2 h-4 w-4" />
            <label className="text-sm font-medium text-gray-700">ลูกค้าใช้งานอยู่</label>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              {...register('email')}
              className="input"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="02-123-4567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">มือถือ</label>
            <input
              type="tel"
              {...register('mobile')}
              className="input"
              placeholder="098-765-4321"
            />
            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ที่อยู่</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
            <textarea
              {...register('address')}
              rows={3}
              className="input"
              placeholder="บ้านเลขที่, หมู่, ซอย, ถนน"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เขต/อำเภอ</label>
              <input type="text" {...register('city')} className="input" placeholder="เช่น คลองเตย" />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จังหวัด</label>
              <input
                type="text"
                {...register('province')}
                className="input"
                placeholder="เช่น กรุงเทพมหานคร"
              />
              {errors.province && (
                <p className="text-red-500 text-sm mt-1">{errors.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสไปรษณีย์</label>
              <input
                type="text"
                {...register('postal_code')}
                className="input"
                placeholder="10110"
                maxLength={5}
              />
              {errors.postal_code && (
                <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Program */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">โปรแกรมสะสมคะแนน</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คะแนนสะสม</label>
            <input
              type="number"
              {...register('loyalty_points')}
              className="input"
              min="0"
              step="1"
            />
            {errors.loyalty_points && (
              <p className="text-red-500 text-sm mt-1">{errors.loyalty_points.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สมาชิกตั้งแต่</label>
            <input type="date" {...register('member_since')} className="input" />
            {errors.member_since && (
              <p className="text-red-500 text-sm mt-1">{errors.member_since.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ระดับสมาชิก</label>
            <select {...register('membership_tier')} className="input">
              <option value="">ไม่มี</option>
              <option value="bronze">Bronze (ทองแดง)</option>
              <option value="silver">Silver (เงิน)</option>
              <option value="gold">Gold (ทอง)</option>
              <option value="platinum">Platinum (แพลทินัม)</option>
            </select>
            {errors.membership_tier && (
              <p className="text-red-500 text-sm mt-1">{errors.membership_tier.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลทางการแพทย์</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประวัติการแพ้ยา/อาหาร
            </label>
            <textarea
              {...register('allergies')}
              rows={3}
              className="input"
              placeholder="ระบุยาหรืออาหารที่แพ้ (ถ้ามี)"
            />
            {errors.allergies && (
              <p className="text-red-500 text-sm mt-1">{errors.allergies.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              ข้อมูลนี้จะช่วยเภสัชกรในการตรวจสอบและป้องกันการแพ้ยา
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">โรคประจำตัว</label>
            <textarea
              {...register('chronic_conditions')}
              rows={3}
              className="input"
              placeholder="ระบุโรคประจำตัว (ถ้ามี)"
            />
            {errors.chronic_conditions && (
              <p className="text-red-500 text-sm mt-1">{errors.chronic_conditions.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              เช่น เบาหวาน, ความดันโลหิตสูง, โรคหัวใจ เป็นต้น
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-gray-300 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h3>
        <textarea
          {...register('notes')}
          rows={4}
          className="input"
          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
        />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
      </div>

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
          {isSubmitting ? 'กำลังบันทึก...' : customer ? 'บันทึกการแก้ไข' : 'เพิ่มลูกค้า'}
        </button>
      </div>
    </form>
  );
}
