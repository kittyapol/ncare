import { useState } from 'react';

export default function POSInterface() {
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <input
              type="text"
              placeholder="Scan barcode or search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              autoFocus
            />
          </div>

          <div className="card">
            <h2 className="font-bold mb-4">Products</h2>
            <div className="text-center text-gray-500 py-8">
              Search for products to add to cart
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="card">
          <h2 className="font-bold mb-4">Cart</h2>

          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Cart is empty</div>
          ) : (
            <div>
              <div className="space-y-2 mb-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x ฿{item.unit_price}
                      </p>
                    </div>
                    <div className="font-medium">
                      ฿{(item.quantity * item.unit_price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (7%):</span>
                  <span>฿{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              </div>

              <button className="btn btn-primary w-full mt-4">Complete Sale</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
