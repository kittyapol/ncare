import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

describe('cartStore', () => {
  const mockProduct = {
    id: '1',
    sku: 'PARA-500',
    name_th: 'พาราเซตามอล 500 มก.',
    name_en: 'Paracetamol 500mg',
    selling_price: 75.0,
    barcode: '8851234567890',
    is_vat_applicable: true,
    vat_rate: 7,
  };

  const mockCartItem = {
    product_id: '1',
    product: mockProduct,
    quantity: 2,
    unit_price: 75.0,
    discount_amount: 0,
  };

  beforeEach(() => {
    // Reset store state before each test
    useCartStore.getState().clearCart();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have empty cart initially', () => {
      const state = useCartStore.getState();

      expect(state.items).toEqual([]);
      expect(state.customer_id).toBeUndefined();
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', () => {
      useCartStore.getState().addItem(mockCartItem);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product_id).toBe('1');
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].line_total).toBe(150.0); // 2 * 75
    });

    it('should calculate line_total correctly', () => {
      const itemWithDiscount = {
        ...mockCartItem,
        discount_amount: 10,
      };

      useCartStore.getState().addItem(itemWithDiscount);

      const state = useCartStore.getState();
      expect(state.items[0].line_total).toBe(140.0); // (2 * 75) - 10
    });

    it('should increase quantity when adding existing item', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().addItem(mockCartItem);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(4); // 2 + 2
      expect(state.items[0].line_total).toBe(300.0); // 4 * 75
    });

    it('should add multiple different products', () => {
      const product2 = {
        ...mockCartItem,
        product_id: '2',
        product: {
          ...mockProduct,
          id: '2',
          sku: 'AMO-500',
          name_th: 'อะม็อกซีซิลลิน',
        },
      };

      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().addItem(product2);

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().removeItem('1');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should not affect other items when removing', () => {
      const product2 = {
        ...mockCartItem,
        product_id: '2',
        product: { ...mockProduct, id: '2' },
      };

      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().addItem(product2);
      useCartStore.getState().removeItem('1');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].product_id).toBe('2');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().updateQuantity('1', 5);

      const state = useCartStore.getState();
      expect(state.items[0].quantity).toBe(5);
      expect(state.items[0].line_total).toBe(375.0); // 5 * 75
    });

    it('should recalculate line_total when updating quantity', () => {
      const itemWithDiscount = {
        ...mockCartItem,
        discount_amount: 25,
      };

      useCartStore.getState().addItem(itemWithDiscount);
      useCartStore.getState().updateQuantity('1', 3);

      const state = useCartStore.getState();
      expect(state.items[0].line_total).toBe(200.0); // (3 * 75) - 25
    });
  });

  describe('updateDiscount', () => {
    it('should update item discount', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().updateDiscount('1', 20);

      const state = useCartStore.getState();
      expect(state.items[0].discount_amount).toBe(20);
      expect(state.items[0].line_total).toBe(130.0); // (2 * 75) - 20
    });

    it('should handle zero discount', () => {
      useCartStore.getState().addItem({ ...mockCartItem, discount_amount: 50 });
      useCartStore.getState().updateDiscount('1', 0);

      const state = useCartStore.getState();
      expect(state.items[0].discount_amount).toBe(0);
      expect(state.items[0].line_total).toBe(150.0); // 2 * 75
    });
  });

  describe('setCustomer', () => {
    it('should set customer_id', () => {
      useCartStore.getState().setCustomer('customer-123');

      const state = useCartStore.getState();
      expect(state.customer_id).toBe('customer-123');
    });

    it('should clear customer_id when undefined', () => {
      useCartStore.getState().setCustomer('customer-123');
      useCartStore.getState().setCustomer(undefined);

      const state = useCartStore.getState();
      expect(state.customer_id).toBeUndefined();
    });
  });

  describe('clearCart', () => {
    it('should clear all items and customer', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().setCustomer('customer-123');
      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toEqual([]);
      expect(state.customer_id).toBeUndefined();
    });
  });

  describe('getSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      useCartStore.getState().addItem(mockCartItem); // 150
      useCartStore.getState().addItem({
        ...mockCartItem,
        product_id: '2',
        product: { ...mockProduct, id: '2' },
        quantity: 3,
        unit_price: 50.0,
      }); // 150

      const subtotal = useCartStore.getState().getSubtotal();
      expect(subtotal).toBe(300.0);
    });

    it('should return 0 for empty cart', () => {
      const subtotal = useCartStore.getState().getSubtotal();
      expect(subtotal).toBe(0);
    });

    it('should include discounts in subtotal', () => {
      useCartStore.getState().addItem({
        ...mockCartItem,
        discount_amount: 10,
      }); // (2 * 75) - 10 = 140

      const subtotal = useCartStore.getState().getSubtotal();
      expect(subtotal).toBe(140.0);
    });
  });

  describe('getTax (VAT)', () => {
    it('should calculate 7% VAT for VAT-applicable items', () => {
      useCartStore.getState().addItem(mockCartItem); // line_total: 150

      const tax = useCartStore.getState().getTax();
      expect(tax).toBeCloseTo(10.5, 2); // 150 * 0.07
    });

    it('should not add VAT for non-VAT items', () => {
      const nonVATItem = {
        ...mockCartItem,
        product: {
          ...mockProduct,
          is_vat_applicable: false,
        },
      };

      useCartStore.getState().addItem(nonVATItem);

      const tax = useCartStore.getState().getTax();
      expect(tax).toBe(0);
    });

    it('should handle mixed VAT and non-VAT items', () => {
      const vatItem = mockCartItem; // 150 * 0.07 = 10.5
      const nonVATItem = {
        ...mockCartItem,
        product_id: '2',
        product: {
          ...mockProduct,
          id: '2',
          is_vat_applicable: false,
        },
      };

      useCartStore.getState().addItem(vatItem);
      useCartStore.getState().addItem(nonVATItem);

      const tax = useCartStore.getState().getTax();
      expect(tax).toBeCloseTo(10.5, 2);
    });

    it('should use custom VAT rate if specified', () => {
      const customVATItem = {
        ...mockCartItem,
        product: {
          ...mockProduct,
          vat_rate: 10, // Custom 10% VAT
        },
      };

      useCartStore.getState().addItem(customVATItem); // 150 * 0.10 = 15

      const tax = useCartStore.getState().getTax();
      expect(tax).toBeCloseTo(15.0, 2);
    });
  });

  describe('getTotal', () => {
    it('should calculate total including VAT', () => {
      useCartStore.getState().addItem(mockCartItem); // subtotal: 150, VAT: 10.5

      const total = useCartStore.getState().getTotal();
      expect(total).toBeCloseTo(160.5, 2); // 150 + 10.5
    });

    it('should return 0 for empty cart', () => {
      const total = useCartStore.getState().getTotal();
      expect(total).toBe(0);
    });

    it('should handle complex cart', () => {
      // Item 1: 2 x 75 = 150, VAT: 10.5
      useCartStore.getState().addItem(mockCartItem);

      // Item 2: 3 x 50 = 150, no VAT
      useCartStore.getState().addItem({
        product_id: '2',
        product: {
          ...mockProduct,
          id: '2',
          selling_price: 50,
          is_vat_applicable: false,
        },
        quantity: 3,
        unit_price: 50,
        discount_amount: 0,
      });

      // Item 3: 1 x 100 - 10 discount = 90, VAT: 6.3
      useCartStore.getState().addItem({
        product_id: '3',
        product: {
          ...mockProduct,
          id: '3',
          selling_price: 100,
        },
        quantity: 1,
        unit_price: 100,
        discount_amount: 10,
      });

      const subtotal = useCartStore.getState().getSubtotal(); // 150 + 150 + 90 = 390
      const tax = useCartStore.getState().getTax(); // 10.5 + 0 + 6.3 = 16.8
      const total = useCartStore.getState().getTotal(); // 406.8

      expect(subtotal).toBe(390);
      expect(tax).toBeCloseTo(16.8, 2);
      expect(total).toBeCloseTo(406.8, 2);
    });
  });

  describe('persistence', () => {
    it('should persist cart state', () => {
      useCartStore.getState().addItem(mockCartItem);
      useCartStore.getState().setCustomer('customer-123');

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.customer_id).toBe('customer-123');
    });
  });
});
