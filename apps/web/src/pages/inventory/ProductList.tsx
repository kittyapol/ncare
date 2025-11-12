import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Product } from '@/types';
import ProductFormModal from '@/components/modals/ProductFormModal';

export default function ProductList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;
  const queryClient = useQueryClient();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Delete confirmation state
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: async () => {
      const response = await api.get('/inventory/products/', {
        params: {
          skip: page * limit,
          limit,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/inventory/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingProduct(null);
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  const cancelDelete = () => {
    setDeletingProduct(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button onClick={handleAddProduct} className="btn btn-primary">
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Reset to first page on search
          }}
          className="input"
        />
      </div>

      {/* Products Table */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No products found</p>
            <button onClick={handleAddProduct} className="btn btn-primary mt-4">
              Create First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">SKU</th>
                  <th className="text-left py-3 px-4">Name (TH)</th>
                  <th className="text-left py-3 px-4">Name (EN)</th>
                  <th className="text-right py-3 px-4">Selling Price</th>
                  <th className="text-center py-3 px-4">VAT</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((product: Product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{product.sku}</td>
                    <td className="py-3 px-4">{product.name_th}</td>
                    <td className="py-3 px-4 text-gray-600">{product.name_en || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      ฿{Number(product.selling_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {product.is_vat_applicable ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {product.vat_rate}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">No VAT</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          title="Edit product"
                        >
                          Edit
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {data?.items?.length > 0 ? page * limit + 1 : 0} to{' '}
                {Math.min((page + 1) * limit, data?.total || 0)} of {data?.total || 0} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data?.items || data.items.length < limit}
                  className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={editingProduct}
      />

      {/* Delete Confirmation Dialog */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={cancelDelete} />

          {/* Dialog */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Delete Product</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deletingProduct.name_th}</strong>? This action
                cannot be undone.
              </p>

              {deleteMutation.isError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  Failed to delete product. Please try again.
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="btn btn-secondary"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
