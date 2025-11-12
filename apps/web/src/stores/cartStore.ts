import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  product_id: string;
  product: {
    id: string;
    sku: string;
    name_th: string;
    name_en?: string;
    selling_price: number;
    barcode?: string;
    // VAT fields
    is_vat_applicable: boolean;
    vat_rate: number;
  };
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
}

interface CartState {
  items: CartItem[];
  customer_id?: string;
  addItem: (item: Omit<CartItem, 'line_total'>) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  updateDiscount: (product_id: string, discount: number) => void;
  setCustomer: (customer_id?: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customer_id: undefined,

      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex((i) => i.product_id === item.product_id);

        if (existingIndex >= 0) {
          // Update existing item
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          newItems[existingIndex].line_total =
            newItems[existingIndex].quantity * newItems[existingIndex].unit_price -
            newItems[existingIndex].discount_amount;
          set({ items: newItems });
        } else {
          // Add new item
          const line_total = item.quantity * item.unit_price - item.discount_amount;
          set({ items: [...items, { ...item, line_total }] });
        }
      },

      removeItem: (product_id) => {
        set({ items: get().items.filter((i) => i.product_id !== product_id) });
      },

      updateQuantity: (product_id, quantity) => {
        const items = get().items.map((item) => {
          if (item.product_id === product_id) {
            const line_total = quantity * item.unit_price - item.discount_amount;
            return { ...item, quantity, line_total };
          }
          return item;
        });
        set({ items });
      },

      updateDiscount: (product_id, discount_amount) => {
        const items = get().items.map((item) => {
          if (item.product_id === product_id) {
            const line_total = item.quantity * item.unit_price - discount_amount;
            return { ...item, discount_amount, line_total };
          }
          return item;
        });
        set({ items });
      },

      setCustomer: (customer_id) => {
        set({ customer_id });
      },

      clearCart: () => {
        set({ items: [], customer_id: undefined });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.line_total, 0);
      },

      getTax: () => {
        // ✅ เช็ค VAT จาก product แทนที่จะใช้ flat 7%
        return get().items.reduce((sum, item) => {
          if (item.product.is_vat_applicable) {
            const vat_rate = item.product.vat_rate || 7.0;
            return sum + (item.line_total * (vat_rate / 100));
          }
          return sum; // สินค้าไม่มี VAT ไม่บวก
        }, 0);
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax();
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
