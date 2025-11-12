import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Product } from '@/types';

export default function ProductDetails() {
  const { id } = useParams();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/inventory/products/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Product Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">SKU</label>
              <p className="font-medium">{product.sku}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Barcode</label>
              <p className="font-medium">{product.barcode || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Name (Thai)</label>
              <p className="font-medium">{product.name_th}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Name (English)</label>
              <p className="font-medium">{product.name_en || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Cost Price</label>
              <p className="font-medium">฿{product.cost_price.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Selling Price</label>
              <p className="font-medium">฿{product.selling_price.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Stock Info */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Stock Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Minimum Stock</label>
              <p className="font-medium">{product.minimum_stock}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Reorder Point</label>
              <p className="font-medium">{product.reorder_point}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Unit of Measure</label>
              <p className="font-medium">{product.unit_of_measure}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
