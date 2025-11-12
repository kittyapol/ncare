import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Supplier } from '@/types';

// Validation Schema
const supplierSchema = z.object({
  code: z.string().min(1, 'กรุณาระบุรหัสผู้จัดจำหน่าย').max(50, 'รหัสยาวเกินไป'),
  name_th: z.string().min(1, 'กรุณาระบุชื่อภาษาไทย').max(255, 'ชื่อยาวเกินไป'),
  name_en: z.string().max(255, 'ชื่อยาวเกินไป').optional().or(z.literal('')),
  tax_id: z.string().max(20, 'เลขผู้เสียภาษียาวเกินไป').optional().or(z.literal('')),

  // Contact
  contact_person: z.string().max(255, 'ชื่อยาวเกินไป').optional().or(z.literal('')),
  email: z.string().email('อีเมลไม่ถูกต้อง').max(255).optional().or(z.literal('')),
  phone: z.string().max(20, 'เบอร์โทรยาวเกินไป').optional().or(z.literal('')),
  fax: z.string().max(20, 'เบอร์แฟกซ์ยาวเกินไป').optional().or(z.literal('')),
  mobile: z.string().max(20, 'เบอร์มือถือยาวเกินไป').optional().or(z.literal('')),

  // Address
  address: z.string().max(1000, 'ที่อยู่ยาวเกินไป').optional().or(z.literal('')),
  city: z.string().max(100, 'เมืองยาวเกินไป').optional().or(z.literal('')),
  province: z.string().max(100, 'จังหวัดยาวเกินไป').optional().or(z.literal('')),
  postal_code: z.string().max(10, 'รหัสไปรษณีย์ยาวเกินไป').optional().or(z.literal('')),
  country: z.string().max(100, 'ประเทศยาวเกินไป').optional().or(z.literal('')),

  // Business terms
  payment_terms: z.string().max(100, 'เงื่อนไขยาวเกินไป').optional().or(z.literal('')),
  credit_limit: z.string().max(100, 'วงเงินเครดิตยาวเกินไป').optional().or(z.literal('')),
  discount_terms: z.string().max(100, 'เงื่อนไขส่วนลดยาวเกินไป').optional().or(z.literal('')),

  // Status
  is_active: z.boolean().default(true),
  rating: z.enum(['A', 'B', 'C', 'D', '']).optional(),

  // Notes
  notes: z.string().max(2000, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  supplier?: Supplier;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          code: supplier.code,
          name_th: supplier.name_th,
          name_en: supplier.name_en || '',
          tax_id: supplier.tax_id || '',
          contact_person: supplier.contact_person || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          fax: supplier.fax || '',
          mobile: supplier.mobile || '',
          address: supplier.address || '',
          city: supplier.city || '',
          province: supplier.province || '',
          postal_code: supplier.postal_code || '',
          country: supplier.country || 'Thailand',
          payment_terms: supplier.payment_terms || '',
          credit_limit: supplier.credit_limit || '',
          discount_terms: supplier.discount_terms || '',
          is_active: supplier.is_active,
          rating: (supplier.rating as any) || '',
          notes: supplier.notes || '',
        }
      : {
          code: '',
          name_th: '',
          name_en: '',
          tax_id: '',
          contact_person: '',
          email: '',
          phone: '',
          fax: '',
          mobile: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          country: 'Thailand',
          payment_terms: '',
          credit_limit: '',
          discount_terms: '',
          is_active: true,
          rating: '',
          notes: '',
        },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const payload = {
        ...data,
        // Convert empty strings to null for optional fields
        name_en: data.name_en || null,
        tax_id: data.tax_id || null,
        contact_person: data.contact_person || null,
        email: data.email || null,
        phone: data.phone || null,
        fax: data.fax || null,
        mobile: data.mobile || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postal_code || null,
        country: data.country || 'Thailand',
        payment_terms: data.payment_terms || null,
        credit_limit: data.credit_limit || null,
        discount_terms: data.discount_terms || null,
        rating: data.rating || null,
        notes: data.notes || null,
      };
      const response = await api.post('/suppliers/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการสร้างผู้จัดจำหน่าย');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const payload = {
        ...data,
        name_en: data.name_en || null,
        tax_id: data.tax_id || null,
        contact_person: data.contact_person || null,
        email: data.email || null,
        phone: data.phone || null,
        fax: data.fax || null,
        mobile: data.mobile || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        postal_code: data.postal_code || null,
        country: data.country || 'Thailand',
        payment_terms: data.payment_terms || null,
        credit_limit: data.credit_limit || null,
        discount_terms: data.discount_terms || null,
        rating: data.rating || null,
        notes: data.notes || null,
      };
      const response = await api.put(`/suppliers/${supplier!.id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', supplier!.id] });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการแก้ไขผู้จัดจำหน่าย');
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    if (supplier) {
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
          {supplier ? 'แก้ไขผู้จัดจำหน่าย' : 'เพิ่มผู้จัดจำหน่ายใหม่'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">กรอกข้อมูลผู้จัดจำหน่ายอย่างละเอียด</p>
      </div>

      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผู้จัดจำหน่าย <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('code')}
              className="input"
              placeholder="SUP001"
              disabled={!!supplier}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เลขผู้เสียภาษี
            </label>
            <input
              type="text"
              {...register('tax_id')}
              className="input"
              placeholder="0-1234-56789-01-2"
            />
            {errors.tax_id && <p className="text-red-500 text-sm mt-1">{errors.tax_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อภาษาไทย <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name_th')}
              className="input"
              placeholder="บริษัท ABC จำกัด"
            />
            {errors.name_th && (
              <p className="text-red-500 text-sm mt-1">{errors.name_th.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อภาษาอังกฤษ
            </label>
            <input
              type="text"
              {...register('name_en')}
              className="input"
              placeholder="ABC Company Limited"
            />
            {errors.name_en && (
              <p className="text-red-500 text-sm mt-1">{errors.name_en.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              สถานะ
            </label>
            <div className="flex items-center">
              <input type="checkbox" {...register('is_active')} className="mr-2" />
              <span className="text-sm text-gray-700">ใช้งานอยู่</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เรทติ้ง
            </label>
            <select {...register('rating')} className="input">
              <option value="">ไม่ระบุ</option>
              <option value="A">A - ดีเยี่ยม</option>
              <option value="B">B - ดี</option>
              <option value="C">C - พอใช้</option>
              <option value="D">D - ควรปรับปรุง</option>
            </select>
            {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating.message}</p>}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลติดต่อ</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อผู้ติดต่อ
            </label>
            <input
              type="text"
              {...register('contact_person')}
              className="input"
              placeholder="คุณสมชาย ใจดี"
            />
            {errors.contact_person && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_person.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              {...register('email')}
              className="input"
              placeholder="contact@example.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              โทรศัพท์
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="input"
              placeholder="02-123-4567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              มือถือ
            </label>
            <input
              type="tel"
              {...register('mobile')}
              className="input"
              placeholder="08-1234-5678"
            />
            {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              แฟกซ์
            </label>
            <input type="tel" {...register('fax')} className="input" placeholder="02-123-4568" />
            {errors.fax && <p className="text-red-500 text-sm mt-1">{errors.fax.message}</p>}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ที่อยู่</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ที่อยู่
            </label>
            <textarea
              {...register('address')}
              rows={3}
              className="input"
              placeholder="123 ถนนสุขุมวิท แขวงคลองเตย"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เมือง/อำเภอ
              </label>
              <input
                type="text"
                {...register('city')}
                className="input"
                placeholder="คลองเตย"
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จังหวัด
              </label>
              <input
                type="text"
                {...register('province')}
                className="input"
                placeholder="กรุงเทพมหานคร"
              />
              {errors.province && (
                <p className="text-red-500 text-sm mt-1">{errors.province.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสไปรษณีย์
              </label>
              <input
                type="text"
                {...register('postal_code')}
                className="input"
                placeholder="10110"
              />
              {errors.postal_code && (
                <p className="text-red-500 text-sm mt-1">{errors.postal_code.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ประเทศ
            </label>
            <input
              type="text"
              {...register('country')}
              className="input"
              placeholder="Thailand"
            />
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Terms */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เงื่อนไขทางธุรกิจ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เงื่อนไขการชำระเงิน
            </label>
            <input
              type="text"
              {...register('payment_terms')}
              className="input"
              placeholder="Net 30"
            />
            {errors.payment_terms && (
              <p className="text-red-500 text-sm mt-1">{errors.payment_terms.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วงเงินเครดิต
            </label>
            <input
              type="text"
              {...register('credit_limit')}
              className="input"
              placeholder="100,000 บาท"
            />
            {errors.credit_limit && (
              <p className="text-red-500 text-sm mt-1">{errors.credit_limit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เงื่อนไขส่วนลด
            </label>
            <input
              type="text"
              {...register('discount_terms')}
              className="input"
              placeholder="2/10 Net 30"
            />
            {errors.discount_terms && (
              <p className="text-red-500 text-sm mt-1">{errors.discount_terms.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">หมายเหตุ</h3>
        <textarea
          {...register('notes')}
          rows={4}
          className="input"
          placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับผู้จัดจำหน่าย..."
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
          {isSubmitting ? 'กำลังบันทึก...' : supplier ? 'บันทึกการแก้ไข' : 'เพิ่มผู้จัดจำหน่าย'}
        </button>
      </div>
    </form>
  );
}
