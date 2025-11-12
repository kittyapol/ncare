import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Product } from '@/types';

// Zod Validation Schema
const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  barcode: z.string().optional(),
  name_th: z.string().min(1, 'Thai name is required').max(255, 'Name too long'),
  name_en: z.string().max(255, 'Name too long').optional(),
  generic_name: z.string().optional(),
  description: z.string().optional(),
  category_id: z.string().optional(),
  active_ingredient: z.string().optional(),
  dosage_form: z.string().optional(),
  strength: z.string().optional(),
  drug_type: z.enum(['prescription', 'otc', 'controlled', 'dangerous']).default('otc'),
  fda_number: z.string().optional(),
  manufacturer: z.string().optional(),
  cost_price: z.coerce.number().min(0, 'Cost price must be >= 0').default(0),
  selling_price: z.coerce.number().min(0, 'Selling price must be >= 0').default(0),
  is_vat_applicable: z.boolean().default(true),
  vat_rate: z.coerce.number().min(0).max(100).default(7),
  vat_category: z.enum(['standard', 'exempt', 'zero-rated']).default('standard'),
  unit_of_measure: z.string().default('unit'),
  minimum_stock: z.coerce.number().int().min(0).default(0),
  reorder_point: z.coerce.number().int().min(0).default(0),
  is_prescription_required: z.boolean().default(false),
  is_controlled_substance: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          ...product,
          cost_price: Number(product.cost_price),
          selling_price: Number(product.selling_price),
          vat_rate: Number(product.vat_rate),
        }
      : {
          drug_type: 'otc',
          is_vat_applicable: true,
          vat_rate: 7,
          vat_category: 'standard',
          unit_of_measure: 'unit',
          is_active: true,
        },
  });

  // Watch VAT applicable to show/hide VAT fields
  const isVatApplicable = watch('is_vat_applicable');

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.post('/inventory/products/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess?.();
    },
  });

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await api.put(`/inventory/products/${product!.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', product!.id] });
      onSuccess?.();
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } catch (error: unknown) {
      console.error('Failed to save product:', error);
      // Error will be shown via mutation error state
    }
  };

  const mutation = isEdit ? updateMutation : createMutation;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Display */}
      {mutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong>{' '}
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to save product'}
        </div>
      )}

      {/* Basic Information */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input {...register('sku')} className="input" placeholder="PRD001" />
            {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku.message}</p>}
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium mb-1">Barcode</label>
            <input {...register('barcode')} className="input" placeholder="1234567890123" />
            {errors.barcode && <p className="text-red-500 text-sm mt-1">{errors.barcode.message}</p>}
          </div>

          {/* Name Thai */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Product Name (Thai) <span className="text-red-500">*</span>
            </label>
            <input {...register('name_th')} className="input" placeholder="ยาแก้ปวด" />
            {errors.name_th && <p className="text-red-500 text-sm mt-1">{errors.name_th.message}</p>}
          </div>

          {/* Name English */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Product Name (English)</label>
            <input {...register('name_en')} className="input" placeholder="Pain Relief Medicine" />
            {errors.name_en && <p className="text-red-500 text-sm mt-1">{errors.name_en.message}</p>}
          </div>

          {/* Generic Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Generic Name</label>
            <input {...register('generic_name')} className="input" placeholder="Paracetamol" />
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium mb-1">Manufacturer</label>
            <input {...register('manufacturer')} className="input" placeholder="ABC Pharma" />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Product description..." />
          </div>
        </div>
      </div>

      {/* Drug Information */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Drug Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Drug Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Drug Type</label>
            <select {...register('drug_type')} className="input">
              <option value="otc">OTC (Over the Counter)</option>
              <option value="prescription">Prescription</option>
              <option value="controlled">Controlled Substance</option>
              <option value="dangerous">Dangerous Drug</option>
            </select>
          </div>

          {/* FDA Number */}
          <div>
            <label className="block text-sm font-medium mb-1">FDA Number</label>
            <input {...register('fda_number')} className="input" placeholder="1A 123/2567" />
          </div>

          {/* Active Ingredient */}
          <div>
            <label className="block text-sm font-medium mb-1">Active Ingredient</label>
            <input {...register('active_ingredient')} className="input" placeholder="Paracetamol" />
          </div>

          {/* Dosage Form */}
          <div>
            <label className="block text-sm font-medium mb-1">Dosage Form</label>
            <input {...register('dosage_form')} className="input" placeholder="Tablet, Capsule, Syrup" />
          </div>

          {/* Strength */}
          <div>
            <label className="block text-sm font-medium mb-1">Strength</label>
            <input {...register('strength')} className="input" placeholder="500mg" />
          </div>

          {/* Unit of Measure */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit of Measure</label>
            <input {...register('unit_of_measure')} className="input" placeholder="unit, box, bottle" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Pricing & VAT</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Cost Price (฿) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('cost_price')}
              className="input"
              placeholder="0.00"
            />
            {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price.message}</p>}
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Selling Price (฿) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('selling_price')}
              className="input"
              placeholder="0.00"
            />
            {errors.selling_price && (
              <p className="text-red-500 text-sm mt-1">{errors.selling_price.message}</p>
            )}
          </div>

          {/* VAT Applicable */}
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register('is_vat_applicable')} className="rounded" />
              <span className="text-sm font-medium">Apply VAT (Value Added Tax)</span>
            </label>
          </div>

          {/* VAT Rate - Show only if VAT applicable */}
          {isVatApplicable && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">VAT Rate (%)</label>
                <input type="number" step="0.01" {...register('vat_rate')} className="input" placeholder="7.00" />
                {errors.vat_rate && <p className="text-red-500 text-sm mt-1">{errors.vat_rate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">VAT Category</label>
                <select {...register('vat_category')} className="input">
                  <option value="standard">Standard (7%)</option>
                  <option value="exempt">Exempt</option>
                  <option value="zero-rated">Zero-rated</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inventory */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Inventory Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Minimum Stock */}
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Stock</label>
            <input type="number" {...register('minimum_stock')} className="input" placeholder="10" />
            {errors.minimum_stock && (
              <p className="text-red-500 text-sm mt-1">{errors.minimum_stock.message}</p>
            )}
          </div>

          {/* Reorder Point */}
          <div>
            <label className="block text-sm font-medium mb-1">Reorder Point</label>
            <input type="number" {...register('reorder_point')} className="input" placeholder="20" />
            {errors.reorder_point && (
              <p className="text-red-500 text-sm mt-1">{errors.reorder_point.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Status & Controls</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('is_prescription_required')} className="rounded" />
            <span className="text-sm">Prescription Required</span>
          </label>

          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('is_controlled_substance')} className="rounded" />
            <span className="text-sm">Controlled Substance</span>
          </label>

          <label className="flex items-center space-x-2">
            <input type="checkbox" {...register('is_active')} className="rounded" />
            <span className="text-sm">Active (Available for sale)</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
