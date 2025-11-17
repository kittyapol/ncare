export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'pharmacist' | 'staff' | 'cashier';
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  loyalty_points: number;
  member_since?: string;
  membership_tier?: string;
  allergies?: string;
  chronic_conditions?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  code: string;
  name_th: string;
  name_en?: string;
  description?: string;
  parent_id?: string;
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

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: 'main' | 'branch' | 'cold_storage' | 'quarantine';
  address?: string;
  is_active: boolean;
  created_at: string;
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
  // Nested relationships (when included in response)
  product?: Product;
  warehouse?: Warehouse;
  supplier?: Supplier;
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
  // Extended analytics data (optional)
  weekly_sales?: number;
  monthly_sales?: number;
  total_revenue?: number;
  total_orders?: number;
  average_order_value?: number;
}

// Analytics Data Types
export interface SalesTrendData {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProductData {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

export interface CategorySalesData {
  category: string;
  sales: number;
  percentage: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

// ============================================================================
// Prescription Management Types
// ============================================================================

export interface Prescription {
  id: string;
  prescription_number: string;
  customer_id: string;
  doctor_name: string;
  doctor_license: string;
  hospital_clinic?: string;
  prescription_date: string;
  valid_until?: string;
  diagnosis?: string;
  status: 'pending_verification' | 'verified' | 'dispensed' | 'partially_dispensed' | 'cancelled' | 'expired';
  prescription_type: 'acute' | 'chronic' | 'controlled' | 'narcotic';
  is_refillable: boolean;
  max_refills?: number;
  refills_remaining?: number;
  // Pharmacist verification
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  // Dispensing information
  dispensed_by?: string;
  dispensed_at?: string;
  sales_order_id?: string;
  // Document attachments
  has_documents: boolean;
  document_count: number;
  // Safety checks
  drug_interaction_checked: boolean;
  allergy_checked: boolean;
  warning_notes?: string;
  // Controlled substance logging (for FDA compliance)
  is_controlled_substance: boolean;
  controlled_log_notes?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Nested relations
  customer?: Customer;
  items?: PrescriptionItem[];
  documents?: PrescriptionDocument[];
  refills?: PrescriptionRefill[];
  verifications?: PharmacistVerification[];
}

export interface PrescriptionItem {
  id: string;
  prescription_id: string;
  product_id: string;
  drug_name: string;
  generic_name?: string;
  strength?: string;
  dosage_form?: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  dosage_instructions: string;
  frequency?: string;
  duration?: string;
  special_instructions?: string;
  is_substitutable: boolean;
  substitution_notes?: string;
  // Safety flags
  requires_counseling: boolean;
  has_interaction_warning: boolean;
  has_allergy_warning: boolean;
  warning_message?: string;
  created_at: string;
  updated_at?: string;
  // Nested relations
  product?: Product;
}

export interface PrescriptionDocument {
  id: string;
  prescription_id: string;
  document_type: 'prescription_image' | 'prescription_pdf' | 'id_card' | 'insurance_card' | 'other';
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export interface PrescriptionRefill {
  id: string;
  prescription_id: string;
  refill_number: number;
  refill_date: string;
  quantity_dispensed: number;
  dispensed_by: string;
  sales_order_id?: string;
  pharmacist_notes?: string;
  created_at: string;
  // Nested relations
  sales_order?: SalesOrder;
}

export interface PharmacistVerification {
  id: string;
  prescription_id: string;
  pharmacist_id: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'needs_clarification';
  verification_date: string;
  // Verification checklist
  prescription_validity_checked: boolean;
  doctor_license_verified: boolean;
  drug_interactions_checked: boolean;
  allergies_checked: boolean;
  dosage_verified: boolean;
  duration_appropriate: boolean;
  // Decision and notes
  decision: 'approve' | 'reject' | 'request_clarification';
  rejection_reason?: string;
  clarification_notes?: string;
  pharmacist_notes?: string;
  // Follow-up actions
  requires_doctor_contact: boolean;
  doctor_contacted_at?: string;
  doctor_response?: string;
  created_at: string;
  updated_at?: string;
  // Nested relations
  pharmacist?: User;
}

// ============================================================================
// Drug Safety & Interaction Types
// ============================================================================

export interface DrugInteraction {
  id: string;
  drug_a_id: string;
  drug_b_id: string;
  interaction_severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interaction_type: 'pharmacodynamic' | 'pharmacokinetic' | 'both';
  description_th: string;
  description_en?: string;
  clinical_effect?: string;
  management_recommendation: string;
  evidence_level: 'theoretical' | 'case_report' | 'study' | 'established';
  reference_source?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  // Nested relations
  drug_a?: Product;
  drug_b?: Product;
}

export interface DrugAllergyAlert {
  id: string;
  customer_id: string;
  allergen_type: 'drug' | 'ingredient' | 'class';
  allergen_name: string;
  product_id?: string;
  active_ingredient?: string;
  drug_class?: string;
  reaction_severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction_type?: string;
  symptoms?: string;
  onset_date?: string;
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  // Nested relations
  customer?: Customer;
  product?: Product;
}

export interface SafetyCheck {
  id: string;
  check_type: 'prescription_verification' | 'drug_interaction' | 'allergy_check' | 'dosage_validation';
  entity_id: string; // prescription_id, sales_order_id, etc.
  entity_type: 'prescription' | 'sales_order';
  check_date: string;
  performed_by: string;
  check_result: 'pass' | 'warning' | 'fail';
  // Check details
  warnings_found: number;
  errors_found: number;
  critical_issues: number;
  details: SafetyCheckDetail[];
  override_allowed: boolean;
  overridden_by?: string;
  override_reason?: string;
  override_at?: string;
  notes?: string;
  created_at: string;
}

export interface SafetyCheckDetail {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'interaction' | 'allergy' | 'dosage' | 'contraindication' | 'duplicate_therapy' | 'age_related' | 'pregnancy' | 'other';
  message: string;
  recommendation?: string;
  affected_drugs?: string[];
}
