import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { PurchaseOrder, Supplier, Product } from '@/types';

// Validation Schema
const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
  product_name: z.string().optional(),
  quantity: z.coerce.number().int().min(1, 'จำนวนต้องมากกว่า 0'),
  unit_price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  line_total: z.number().default(0),
});

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'กรุณาเลือกผู้จัดจำหน่าย'),
  expected_delivery_date: z.string().optional(),
  notes: z.string().max(1000, 'หมายเหตุยาวเกินไป').optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PurchaseOrderForm({ purchaseOrder, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const queryClient = useQueryClient();
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers/', { params: { is_active: true, limit: 100 } });
      return response.data;
    },
  });

  // Search products
  const { data: productsData } = useQuery({
    queryKey: ['products-search', searchProduct],
    queryFn: async () => {
      if (!searchProduct) return { items: [] };
      const response = await api.get('/inventory/products/', {
        params: { search: searchProduct, limit: 10 },
      });
      return response.data;
    },
    enabled: searchProduct.length > 0,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: purchaseOrder
      ? {
          supplier_id: purchaseOrder.supplier_id,
          expected_delivery_date: purchaseOrder.expected_delivery_date,
          notes: purchaseOrder.notes || '',
          items: purchaseOrder.items.map((item) => ({
            product_id: item.product_id,
            product_name: item.product?.name_th || '',
            quantity: item.quantity_ordered,
            unit_price: item.unit_price,
            line_total: item.line_total,
          })),
        }
      : {
          supplier_id: '',
          expected_delivery_date: '',
          notes: '',
          items: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');

  // Calculate totals
  useEffect(() => {
    items.forEach((item, index) => {
      const total = (item.quantity || 0) * (item.unit_price || 0);
      if (item.line_total !== total) {
        setValue(`items.${index}.line_total`, total);
      }
    });
  }, [items, setValue]);

  const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const total = subtotal;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: PurchaseOrderFormData) => {
      const payload = {
        supplier_id: data.supplier_id,
        expected_delivery_date: data.expected_delivery_date || null,
        notes: data.notes,
        items: data.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };
      const response = await api.post('/purchase/orders/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'เกิดข้อผิดพลาดในการสร้าง PO');
    },
  });

  const onSubmit = async (data: PurchaseOrderFormData) => {
    await createMutation.mutateAsync(data);
  };

  const handleAddProduct = (product: Product) => {
    // Check if product already in list
    const existingIndex = items.findIndex((item) => item.product_id === product.id);
    if (existingIndex >= 0) {
      // Increase quantity
      const currentQty = items[existingIndex].quantity || 0;
      setValue(`items.${existingIndex}.quantity`, currentQty + 1);
    } else {
      // Add new item
      append({
        product_id: product.id,
        product_name: product.name_th,
        quantity: 1,
        unit_price: product.cost_price,
        line_total: product.cost_price,
      });
    }
    setSearchProduct('');
    setShowProductSearch(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {purchaseOrder ? 'แก้ไขใบสั่งซื้อ' : 'สร้างใบสั่งซื้อใหม่'}
        </h2>
        <p className="text-sm text-gray-600 mt-1">กรอกข้อมูลสำหรับสั่งซื้อสินค้าจากผู้จัดจำหน่าย</p>
      </div>

      {/* Supplier and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ผู้จัดจำหน่าย <span className="text-red-500">*</span>
          </label>
          <select {...register('supplier_id')} className="input" disabled={!!purchaseOrder}>
            <option value="">เลือกผู้จัดจำหน่าย</option>
            {suppliersData?.items?.map((supplier: Supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.code} - {supplier.name_th}
              </option>
            ))}
          </select>
          {errors.supplier_id && (
            <p className="text-red-500 text-sm mt-1">{errors.supplier_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่คาดว่าจะได้รับ
          </label>
          <input type="date" {...register('expected_delivery_date')} className="input" />
          {errors.expected_delivery_date && (
            <p className="text-red-500 text-sm mt-1">{errors.expected_delivery_date.message}</p>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">รายการสินค้า</h3>
          <button
            type="button"
            onClick={() => setShowProductSearch(!showProductSearch)}
            className="btn btn-primary"
          >
            + เพิ่มสินค้า
          </button>
        </div>

        {/* Product Search */}
        {showProductSearch && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="ค้นหาสินค้า (ชื่อ, SKU, Barcode)..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="input mb-2"
              autoFocus
            />
            {productsData?.items && productsData.items.length > 0 && (
              <div className="bg-white border border-gray-200 rounded max-h-60 overflow-y-auto">
                {productsData.items.map((product: Product) => (
                  <div
                    key={product.id}
                    onClick={() => handleAddProduct(product)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">{product.name_th}</p>
                    <p className="text-sm text-gray-500">
                      SKU: {product.sku} | ราคาทุน: ฿{product.cost_price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items Table */}
        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ยังไม่มีรายการสินค้า กดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    สินค้า
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-32">
                    จำนวน
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    ราคา/หน่วย
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                    รวม
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-20">
                    ลบ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {items[index].product_name}
                      </p>
                      <input type="hidden" {...register(`items.${index}.product_id`)} />
                      <input type="hidden" {...register(`items.${index}.product_name`)} />
                      {errors.items?.[index]?.product_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.items[index]?.product_id?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`)}
                        className="input text-center"
                        min="1"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        {...register(`items.${index}.unit_price`)}
                        className="input text-right"
                        step="0.01"
                        min="0"
                      />
                      {errors.items?.[index]?.unit_price && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.items[index]?.unit_price?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ฿{(items[index].line_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {errors.items && typeof errors.items === 'object' && !Array.isArray(errors.items) && (
          <p className="text-red-500 text-sm mt-2">{(errors.items as any).message}</p>
        )}

        {/* Totals */}
        {fields.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">ยอดรวม:</span>
                  <span className="font-medium">
                    ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold border-t-2 border-gray-400">
                  <span className="text-gray-900">รวมทั้งสิ้น:</span>
                  <span className="text-gray-900">
                    ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
        <textarea
          {...register('notes')}
          rows={3}
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
          {isSubmitting ? 'กำลังบันทึก...' : purchaseOrder ? 'บันทึกการแก้ไข' : 'สร้างใบสั่งซื้อ'}
        </button>
      </div>
    </form>
  );
}
