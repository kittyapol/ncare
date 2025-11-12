export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'pharmacist' | 'staff' | 'cashier';
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name_th: string;
  name_en?: string;
  generic_name?: string;
  description?: string;
  category_id?: string;
  active_ingredient?: string;
  dosage_form?: string;
  strength?: string;
  drug_type?: 'prescription' | 'otc' | 'controlled' | 'dangerous';
  fda_number?: string;
  manufacturer?: string;
  cost_price: number;
  selling_price: number;
  // VAT fields for Thailand tax compliance
  is_vat_applicable: boolean;
  vat_rate: number;
  vat_category: 'standard' | 'exempt' | 'zero-rated';
  unit_of_measure: string;
  minimum_stock: number;
  reorder_point: number;
  is_prescription_required: boolean;
  is_controlled_substance: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InventoryLot {
  id: string;
  product_id: string;
  warehouse_id: string;
  supplier_id?: string;
  lot_number: string;
  batch_number?: string;
  quantity_received: number;
  quantity_available: number;
  quantity_reserved: number;
  quantity_damaged: number;
  manufacture_date?: string;
  expiry_date: string;
  received_date: string;
  quality_status: 'passed' | 'failed' | 'quarantine' | 'pending';
  quality_checked_at?: string;
  quality_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id?: string;
  prescription_number?: string;
  subtotal: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  paid_amount: number;
  change_amount: number;
  status: 'draft' | 'confirmed' | 'completed' | 'cancelled';
  cashier_id: string;
  pharmacist_id?: string;
  notes?: string;
  order_date: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  lot_id?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  // VAT breakdown for tax reporting
  vat_amount: number;
  price_before_vat: number;
  price_including_vat: number;
  created_at: string;
  // Nested product data (when included in response)
  product?: Product;
}

export interface Supplier {
  id: string;
  code: string;
  name_th: string;
  name_en?: string;
  tax_id?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  fax?: string;
  mobile?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  payment_terms?: string;
  credit_limit?: string;
  discount_terms?: string;
  is_active: boolean;
  rating?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  created_by?: string;
  approved_by?: string;
  notes?: string;
  terms_and_conditions?: string;
  created_at: string;
  updated_at?: string;
  items: PurchaseOrderItem[];
  // Nested relations (when included)
  supplier?: Supplier;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  notes?: string;
  created_at: string;
  // Nested product data (when included)
  product?: Product;
}

export interface DashboardStats {
  today_sales: number;
  total_products: number;
  low_stock_items: number;
  expiring_items: number;
}
