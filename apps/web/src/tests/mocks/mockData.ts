import type {
  User,
  Customer,
  Product,
  SalesOrder,
  PurchaseOrder,
  Supplier,
  Prescription,
} from '@/types';

/**
 * Mock User Data
 */
export const mockUser: User = {
  id: '1',
  email: 'admin@pharmacy.com',
  full_name: 'Admin User',
  role: 'admin',
  phone: '0812345678',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockPharmacist: User = {
  id: '2',
  email: 'pharmacist@pharmacy.com',
  full_name: 'Pharmacist User',
  role: 'pharmacist',
  phone: '0823456789',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock Customer Data
 */
export const mockCustomer: Customer = {
  id: '1',
  code: 'CUST-001',
  name: 'สมชาย ใจดี',
  national_id: '1234567890123',
  date_of_birth: '1990-01-01',
  gender: 'male',
  email: 'somchai@email.com',
  phone: '0891234567',
  mobile: '0891234567',
  address: '123 ถนนสุขุมวิท',
  city: 'กรุงเทพมหานคร',
  province: 'กรุงเทพมหานคร',
  postal_code: '10110',
  loyalty_points: 150,
  member_since: '2024-01-01',
  membership_tier: 'gold',
  allergies: 'Penicillin',
  chronic_conditions: 'Diabetes, Hypertension',
  is_active: true,
  notes: 'VIP Customer',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock Product Data
 */
export const mockProduct: Product = {
  id: '1',
  sku: 'PARA-500',
  barcode: '8851234567890',
  name_th: 'พาราเซตามอล 500 มก.',
  name_en: 'Paracetamol 500mg',
  generic_name: 'Paracetamol',
  description: 'ยาแก้ปวด ลดไข้',
  category_id: 'cat-1',
  active_ingredient: 'Paracetamol 500mg',
  dosage_form: 'tablet',
  strength: '500mg',
  drug_type: 'otc',
  fda_number: 'FDA-123456',
  manufacturer: 'GPO',
  cost_price: 50.0,
  selling_price: 75.0,
  is_vat_applicable: true,
  vat_rate: 7,
  vat_category: 'standard',
  unit_of_measure: 'tablet',
  minimum_stock: 100,
  reorder_point: 200,
  is_prescription_required: false,
  is_controlled_substance: false,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

export const mockPrescriptionDrug: Product = {
  ...mockProduct,
  id: '2',
  sku: 'AMO-500',
  name_th: 'อะม็อกซีซิลลิน 500 มก.',
  name_en: 'Amoxicillin 500mg',
  generic_name: 'Amoxicillin',
  drug_type: 'prescription',
  is_prescription_required: true,
};

/**
 * Mock Supplier Data
 */
export const mockSupplier: Supplier = {
  id: '1',
  code: 'SUP-001',
  name_th: 'บริษัท ยา จำกัด',
  name_en: 'Medicine Company Ltd.',
  tax_id: '0123456789012',
  contact_person: 'นายสมหมาย ขายยา',
  email: 'contact@medicine.com',
  phone: '021234567',
  fax: '021234568',
  mobile: '0812345678',
  address: '456 ถนนพระราม 4',
  city: 'กรุงเทพมหานคร',
  province: 'กรุงเทพมหานคร',
  postal_code: '10110',
  country: 'Thailand',
  payment_terms: 'Net 30',
  credit_limit: '1000000',
  discount_terms: '5%',
  is_active: true,
  rating: '5',
  notes: 'Reliable supplier',
  created_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock Sales Order Data
 */
export const mockSalesOrder: SalesOrder = {
  id: '1',
  order_number: 'SO-2024-001',
  customer_id: '1',
  prescription_number: undefined,
  subtotal: 1000.0,
  discount_amount: 50.0,
  tax_rate: 7,
  tax_amount: 66.5,
  total_amount: 1016.5,
  payment_method: 'cash',
  payment_status: 'paid',
  paid_amount: 1020.0,
  change_amount: 3.5,
  status: 'completed',
  cashier_id: '1',
  pharmacist_id: undefined,
  notes: '',
  order_date: '2024-01-15T10:30:00Z',
  completed_at: '2024-01-15T10:35:00Z',
  created_at: '2024-01-15T10:30:00Z',
  items: [
    {
      id: '1',
      sales_order_id: '1',
      product_id: '1',
      lot_id: 'lot-1',
      quantity: 10,
      unit_price: 75.0,
      discount_amount: 0,
      line_total: 750.0,
      vat_amount: 49.07,
      price_before_vat: 700.93,
      price_including_vat: 750.0,
      created_at: '2024-01-15T10:30:00Z',
      product: mockProduct,
    },
  ],
};

/**
 * Mock Purchase Order Data
 */
export const mockPurchaseOrder: PurchaseOrder = {
  id: '1',
  po_number: 'PO-2024-001',
  supplier_id: '1',
  subtotal: 5000.0,
  discount_amount: 250.0,
  tax_amount: 332.5,
  shipping_cost: 100.0,
  total_amount: 5182.5,
  status: 'confirmed',
  order_date: '2024-01-10T09:00:00Z',
  expected_delivery_date: '2024-01-17T09:00:00Z',
  actual_delivery_date: undefined,
  created_by: '1',
  approved_by: '1',
  notes: 'Regular order',
  terms_and_conditions: 'Net 30 days',
  created_at: '2024-01-10T09:00:00Z',
  items: [
    {
      id: '1',
      purchase_order_id: '1',
      product_id: '1',
      quantity_ordered: 1000,
      quantity_received: 0,
      unit_price: 50.0,
      discount_amount: 0,
      line_total: 50000.0,
      notes: '',
      created_at: '2024-01-10T09:00:00Z',
      product: mockProduct,
    },
  ],
  supplier: mockSupplier,
};

/**
 * Mock Prescription Data
 */
export const mockPrescription: Prescription = {
  id: '1',
  prescription_number: 'RX-2024-001',
  customer_id: '1',
  doctor_name: 'นพ. สมชาย แพทย์ดี',
  doctor_license: 'MD-12345',
  hospital_clinic: 'โรงพยาบาลรามาธิบดี',
  prescription_date: '2024-01-15T08:00:00Z',
  valid_until: '2024-02-15T08:00:00Z',
  diagnosis: 'Upper Respiratory Tract Infection',
  status: 'pending_verification',
  prescription_type: 'acute',
  is_refillable: false,
  max_refills: 0,
  refills_remaining: 0,
  verified_by: undefined,
  verified_at: undefined,
  verification_notes: undefined,
  dispensed_by: undefined,
  dispensed_at: undefined,
  sales_order_id: undefined,
  has_documents: true,
  document_count: 2,
  drug_interaction_checked: false,
  allergy_checked: false,
  warning_notes: undefined,
  is_controlled_substance: false,
  controlled_log_notes: undefined,
  notes: 'Regular prescription',
  created_at: '2024-01-15T08:00:00Z',
  updated_at: undefined,
  customer: mockCustomer,
  items: [
    {
      id: '1',
      prescription_id: '1',
      product_id: '2',
      drug_name: 'อะม็อกซีซิลลิน 500 มก.',
      generic_name: 'Amoxicillin',
      strength: '500mg',
      dosage_form: 'capsule',
      quantity_prescribed: 21,
      quantity_dispensed: 0,
      dosage_instructions: 'รับประทานครั้งละ 1 แคปซูล วันละ 3 ครั้ง หลังอาหาร',
      frequency: '3 times daily',
      duration: '7 days',
      special_instructions: 'ต้องรับประทานให้ครบตามที่สั่ง',
      is_substitutable: false,
      substitution_notes: undefined,
      requires_counseling: true,
      has_interaction_warning: false,
      has_allergy_warning: false,
      warning_message: undefined,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: undefined,
      product: mockPrescriptionDrug,
    },
  ],
  documents: [],
  refills: [],
  verifications: [],
};

/**
 * Mock API Response Helpers
 */
export const mockApiResponse = <T,>(data: T, delay = 0): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, status = 400, delay = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        response: {
          status,
          data: { message },
        },
      });
    }, delay);
  });
};
