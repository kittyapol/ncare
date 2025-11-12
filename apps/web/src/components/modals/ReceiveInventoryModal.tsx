import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { PurchaseOrder } from '@/types';

// Validation Schema
const receiveItemSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  quantity_ordered: z.number(),
  quantity_to_receive: z.coerce.number().int().min(0, 'จำนวนต้องไม่ติดลบ'),
  lot_number: z.string().min(1, 'กรุณาระบุ Lot Number'),
  manufacture_date: z.string().optional(),
  expiry_date: z.string().min(1, 'กรุณาระบุวันหมดอายุ'),
});

const receiveInventorySchema = z.object({
  warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
  items: z.array(receiveItemSchema),
});

type ReceiveInventoryFormData = z.infer<typeof receiveInventorySchema>;

interface ReceiveInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
}

export default function ReceiveInventoryModal({
  isOpen,
  onClose,
  purchaseOrder,
}: ReceiveInventoryModalProps) {
  const queryClient = useQueryClient();

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/inventory/warehouses/');
      return response.data;
    },
    enabled: isOpen,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReceiveInventoryFormData>({
    resolver: zodResolver(receiveInventorySchema),
    defaultValues: {
      warehouse_id: '',
      items: purchaseOrder.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product?.name_th || '',
        quantity_ordered: item.quantity_ordered,
        quantity_to_receive: item.quantity_ordered - item.quantity_received,
        lot_number: '',
        manufacture_date: '',
        expiry_date: '',
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'items',
  });

  // Receive mutation
  const receiveMutation = useMutation({
    mutationFn: async (data: ReceiveInventoryFormData) => {
      const payload = {
        warehouse_id: data.warehouse_id,
        items: data.items
          .filter((item) => item.quantity_to_receive > 0)
          .map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity_to_receive,
            lot_number: item.lot_number,
            manufacture_date: item.manufacture_date || null,
            expiry_date: item.expiry_date,
          })),
      };

      if (payload.items.length === 0) {
        throw new Error('กรุณาระบุจำนวนที่ต้องการรับอย่างน้อย 1 รายการ');
      }

      const response = await api.post(`/purchase/orders/${purchaseOrder.id}/receive`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lots'] });
      alert('รับของเข้าคลังสำเร็จ');
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || error.message || 'เกิดข้อผิดพลาดในการรับของเข้าคลัง');
    },
  });

  const onSubmit = async (data: ReceiveInventoryFormData) => {
    await receiveMutation.mutateAsync(data);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">รับของเข้าคลัง</h3>
                <p className="text-sm text-gray-600 mt-1">
                  PO: {purchaseOrder.po_number} | ผู้จัดจำหน่าย: {purchaseOrder.supplier?.name_th}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
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

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Warehouse Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกคลังสินค้า <span className="text-red-500">*</span>
                  </label>
                  <select {...register('warehouse_id')} className="input w-full max-w-md">
                    <option value="">เลือกคลังสินค้า</option>
                    {warehousesData?.items?.map((warehouse: any) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {errors.warehouse_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.warehouse_id.message}</p>
                  )}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          สินค้า
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                          สั่งซื้อ
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                          รับแล้ว
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">
                          รับครั้งนี้
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                          Lot Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                          วันผลิต
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                          วันหมดอายุ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fields.map((field, index) => {
                        const item = purchaseOrder.items[index];
                        return (
                          <tr key={field.id}>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">
                                {item.product?.name_th}
                              </p>
                              <p className="text-xs text-gray-500">SKU: {item.product?.sku}</p>
                              <input type="hidden" {...register(`items.${index}.product_id`)} />
                              <input type="hidden" {...register(`items.${index}.product_name`)} />
                              <input type="hidden" {...register(`items.${index}.quantity_ordered`)} />
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {item.quantity_ordered}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-green-600">
                              {item.quantity_received}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                {...register(`items.${index}.quantity_to_receive`)}
                                className="input text-center"
                                min="0"
                                max={item.quantity_ordered - item.quantity_received}
                              />
                              {errors.items?.[index]?.quantity_to_receive && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.items[index]?.quantity_to_receive?.message}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                {...register(`items.${index}.lot_number`)}
                                className="input"
                                placeholder="LOT-XXX"
                              />
                              {errors.items?.[index]?.lot_number && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.items[index]?.lot_number?.message}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                {...register(`items.${index}.manufacture_date`)}
                                className="input"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                {...register(`items.${index}.expiry_date`)}
                                className="input"
                              />
                              {errors.items?.[index]?.expiry_date && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors.items[index]?.expiry_date?.message}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Instructions */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    คำแนะนำในการรับของเข้าคลัง:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>กรอกจำนวนที่รับจริงในคอลัมน์ "รับครั้งนี้"</li>
                    <li>ระบุ Lot Number สำหรับการตรวจสอบย้อนกลับ</li>
                    <li>ระบุวันหมดอายุเพื่อการจัดการ FEFO (First Expire First Out)</li>
                    <li>สามารถรับของบางส่วนได้ โดยไม่ต้องรับครบทุกรายการ</li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'กำลังบันทึก...' : 'รับของเข้าคลัง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
