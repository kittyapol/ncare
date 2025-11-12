import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '@/stores/cartStore';
import { useSearchProducts } from '@/hooks/useProducts';
import BarcodeInput from '@/components/barcode/BarcodeInput';
import api from '@/services/api';

export default function POSInterface() {
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const { data: searchResults } = useSearchProducts(search);
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post('/sales/orders/', orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const response = await api.post(`/sales/orders/${orderId}/complete`, data);
      return response.data;
    },
    onSuccess: () => {
      clearCart();
      setShowPayment(false);
      setPaidAmount(0);
      alert('Sale completed successfully!');
    },
  });

  const handleAddProduct = (product: any) => {
    addItem({
      product_id: product.id,
      product: product,
      quantity: 1,
      unit_price: parseFloat(product.selling_price),
      discount_amount: 0,
    });
    setSearch('');
  };

  const handleBarcodeScanned = async (code: string) => {
    try {
      const response = await api.get('/inventory/products/', {
        params: { search: code, limit: 1 },
      });

      if (response.data.items && response.data.items.length > 0) {
        handleAddProduct(response.data.items[0]);
      } else {
        alert('Product not found');
      }
    } catch (error) {
      alert('Error searching for product');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      // Create order
      const orderData = {
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const order = await createOrderMutation.mutateAsync(orderData);

      // Show payment dialog
      setShowPayment(true);
      setPaidAmount(getTotal());
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error creating order');
    }
  };

  const handleCompletePayment = async () => {
    if (!createOrderMutation.data) return;

    if (paidAmount < getTotal()) {
      alert('Insufficient payment amount');
      return;
    }

    try {
      await completeOrderMutation.mutateAsync({
        orderId: createOrderMutation.data.id,
        data: {
          payment_method: paymentMethod,
          paid_amount: paidAmount,
        },
      });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Error completing payment');
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const change = paidAmount - total;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search product by name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                autoFocus
              />

              <BarcodeInput
                value={barcode}
                onChange={setBarcode}
                placeholder="Scan or enter barcode"
                onScan={handleBarcodeScanned}
              />
            </div>
          </div>

          {/* Search Results */}
          {search && searchResults && searchResults.length > 0 && (
            <div className="card">
              <h2 className="font-bold mb-3">Search Results</h2>
              <div className="space-y-2">
                {searchResults.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleAddProduct(product)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{product.name_th}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        ฿{parseFloat(product.selling_price).toLocaleString()}
                      </p>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="card h-fit">
          <h2 className="font-bold mb-4">Cart ({items.length} items)</h2>

          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Cart is empty</div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product_id} className="py-2 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name_th}</p>
                        <p className="text-xs text-gray-500">{item.product.sku}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          ฿{item.unit_price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="font-medium">฿{item.line_total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (7%):</span>
                  <span>฿{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button onClick={handleCheckout} className="btn btn-primary w-full mt-4">
                Checkout
              </button>

              <button onClick={clearCart} className="btn btn-secondary w-full mt-2">
                Clear Cart
              </button>
            </>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Payment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="promptpay">PromptPay</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount to Pay</label>
                <p className="text-2xl font-bold text-primary-600">
                  ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount Paid</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="input"
                  step="0.01"
                  min={total}
                />
              </div>

              {paidAmount >= total && (
                <div>
                  <label className="block text-sm font-medium mb-1">Change</label>
                  <p className="text-xl font-bold text-green-600">
                    ฿{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowPayment(false)}
                className="btn btn-secondary flex-1"
                disabled={completeOrderMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                className="btn btn-primary flex-1"
                disabled={paidAmount < total || completeOrderMutation.isPending}
              >
                {completeOrderMutation.isPending ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
