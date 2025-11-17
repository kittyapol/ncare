import api from './api';
import type {
  Prescription,
  PrescriptionDocument,
  PrescriptionRefill,
  PharmacistVerification,
  DrugInteraction,
  DrugAllergyAlert,
  SafetyCheck,
} from '@/types';

// ============================================================================
// Prescription API
// ============================================================================

export const prescriptionApi = {
  /**
   * Get all prescriptions with optional filters
   */
  getAll: async (params?: {
    customer_id?: string;
    status?: string;
    prescription_type?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get<Prescription[]>('/prescriptions', { params });
    return response.data;
  },

  /**
   * Get prescription by ID with full details
   */
  getById: async (id: string) => {
    const response = await api.get<Prescription>(`/prescriptions/${id}`);
    return response.data;
  },

  /**
   * Create new prescription
   */
  create: async (data: {
    customer_id: string;
    doctor_name: string;
    doctor_license: string;
    hospital_clinic?: string;
    prescription_date: string;
    valid_until?: string;
    diagnosis?: string;
    prescription_type: 'acute' | 'chronic' | 'controlled' | 'narcotic';
    is_refillable: boolean;
    max_refills?: number;
    notes?: string;
    items: Array<{
      product_id: string;
      drug_name: string;
      generic_name?: string;
      strength?: string;
      dosage_form?: string;
      quantity_prescribed: number;
      dosage_instructions: string;
      frequency?: string;
      duration?: string;
      special_instructions?: string;
      is_substitutable: boolean;
    }>;
  }) => {
    const response = await api.post<Prescription>('/prescriptions', data);
    return response.data;
  },

  /**
   * Update prescription
   */
  update: async (id: string, data: Partial<Prescription>) => {
    const response = await api.put<Prescription>(`/prescriptions/${id}`, data);
    return response.data;
  },

  /**
   * Cancel prescription
   */
  cancel: async (id: string, reason?: string) => {
    const response = await api.post<Prescription>(`/prescriptions/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Get prescriptions pending verification (for pharmacist queue)
   */
  getPendingVerification: async () => {
    const response = await api.get<Prescription[]>('/prescriptions/pending-verification');
    return response.data;
  },

  /**
   * Get customer prescription history
   */
  getCustomerHistory: async (customerId: string) => {
    const response = await api.get<Prescription[]>(`/customers/${customerId}/prescriptions`);
    return response.data;
  },
};

// ============================================================================
// Prescription Verification API
// ============================================================================

export const verificationApi = {
  /**
   * Submit pharmacist verification
   */
  verify: async (prescriptionId: string, data: {
    prescription_validity_checked: boolean;
    doctor_license_verified: boolean;
    drug_interactions_checked: boolean;
    allergies_checked: boolean;
    dosage_verified: boolean;
    duration_appropriate: boolean;
    decision: 'approve' | 'reject' | 'request_clarification';
    rejection_reason?: string;
    clarification_notes?: string;
    pharmacist_notes?: string;
    requires_doctor_contact: boolean;
  }) => {
    const response = await api.post<PharmacistVerification>(
      `/prescriptions/${prescriptionId}/verify`,
      data
    );
    return response.data;
  },

  /**
   * Get verification history for prescription
   */
  getHistory: async (prescriptionId: string) => {
    const response = await api.get<PharmacistVerification[]>(
      `/prescriptions/${prescriptionId}/verifications`
    );
    return response.data;
  },

  /**
   * Update verification (for clarifications)
   */
  update: async (verificationId: string, data: Partial<PharmacistVerification>) => {
    const response = await api.put<PharmacistVerification>(
      `/verifications/${verificationId}`,
      data
    );
    return response.data;
  },
};

// ============================================================================
// Prescription Document API
// ============================================================================

export const prescriptionDocumentApi = {
  /**
   * Upload prescription document
   */
  upload: async (prescriptionId: string, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    const response = await api.post<PrescriptionDocument>(
      `/prescriptions/${prescriptionId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Get all documents for prescription
   */
  getAll: async (prescriptionId: string) => {
    const response = await api.get<PrescriptionDocument[]>(
      `/prescriptions/${prescriptionId}/documents`
    );
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (documentId: string) => {
    await api.delete(`/prescription-documents/${documentId}`);
  },

  /**
   * Get document download URL
   */
  getDownloadUrl: (documentId: string) => {
    return `${api.defaults.baseURL}/prescription-documents/${documentId}/download`;
  },
};

// ============================================================================
// Prescription Refill API
// ============================================================================

export const refillApi = {
  /**
   * Create prescription refill
   */
  create: async (prescriptionId: string, data: {
    quantity_dispensed: number;
    sales_order_id?: string;
    pharmacist_notes?: string;
  }) => {
    const response = await api.post<PrescriptionRefill>(
      `/prescriptions/${prescriptionId}/refills`,
      data
    );
    return response.data;
  },

  /**
   * Get refill history
   */
  getHistory: async (prescriptionId: string) => {
    const response = await api.get<PrescriptionRefill[]>(
      `/prescriptions/${prescriptionId}/refills`
    );
    return response.data;
  },

  /**
   * Check refill eligibility
   */
  checkEligibility: async (prescriptionId: string) => {
    const response = await api.get<{
      eligible: boolean;
      reason?: string;
      refills_remaining: number;
      last_refill_date?: string;
      days_since_last_refill?: number;
    }>(`/prescriptions/${prescriptionId}/refills/check-eligibility`);
    return response.data;
  },
};

// ============================================================================
// Drug Safety API
// ============================================================================

export const drugSafetyApi = {
  /**
   * Check drug interactions for prescription
   */
  checkInteractions: async (productIds: string[]) => {
    const response = await api.post<{
      has_interactions: boolean;
      interactions: DrugInteraction[];
      max_severity: string;
    }>('/drug-safety/check-interactions', { product_ids: productIds });
    return response.data;
  },

  /**
   * Check customer allergies against products
   */
  checkAllergies: async (customerId: string, productIds: string[]) => {
    const response = await api.post<{
      has_allergies: boolean;
      alerts: DrugAllergyAlert[];
      max_severity: string;
    }>('/drug-safety/check-allergies', {
      customer_id: customerId,
      product_ids: productIds,
    });
    return response.data;
  },

  /**
   * Perform comprehensive safety check
   */
  performSafetyCheck: async (data: {
    entity_type: 'prescription' | 'sales_order';
    entity_id: string;
    customer_id: string;
    product_ids: string[];
    check_interactions?: boolean;
    check_allergies?: boolean;
    check_dosage?: boolean;
  }) => {
    const response = await api.post<SafetyCheck>('/drug-safety/safety-check', data);
    return response.data;
  },

  /**
   * Get all drug interactions in database
   */
  getAllInteractions: async (params?: {
    severity?: string;
    product_id?: string;
    skip?: number;
    limit?: number;
  }) => {
    const response = await api.get<DrugInteraction[]>('/drug-interactions', { params });
    return response.data;
  },

  /**
   * Get customer allergy alerts
   */
  getCustomerAllergies: async (customerId: string) => {
    const response = await api.get<DrugAllergyAlert[]>(
      `/customers/${customerId}/allergy-alerts`
    );
    return response.data;
  },

  /**
   * Create allergy alert for customer
   */
  createAllergyAlert: async (data: {
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
    notes?: string;
  }) => {
    const response = await api.post<DrugAllergyAlert>('/allergy-alerts', data);
    return response.data;
  },

  /**
   * Update allergy alert
   */
  updateAllergyAlert: async (id: string, data: Partial<DrugAllergyAlert>) => {
    const response = await api.put<DrugAllergyAlert>(`/allergy-alerts/${id}`, data);
    return response.data;
  },

  /**
   * Override safety check (with justification)
   */
  overrideSafetyCheck: async (
    safetyCheckId: string,
    data: {
      override_reason: string;
      pharmacist_notes?: string;
    }
  ) => {
    const response = await api.post<SafetyCheck>(
      `/safety-checks/${safetyCheckId}/override`,
      data
    );
    return response.data;
  },
};

// ============================================================================
// Prescription Dispensing API
// ============================================================================

export const dispensingApi = {
  /**
   * Dispense prescription (create sales order from prescription)
   */
  dispense: async (prescriptionId: string, data: {
    items: Array<{
      prescription_item_id: string;
      product_id: string;
      lot_id?: string;
      quantity: number;
      unit_price: number;
    }>;
    payment_method?: string;
    discount_amount?: number;
    notes?: string;
  }) => {
    const response = await api.post(`/prescriptions/${prescriptionId}/dispense`, data);
    return response.data;
  },

  /**
   * Get dispensing queue (verified prescriptions ready to dispense)
   */
  getQueue: async () => {
    const response = await api.get<Prescription[]>('/prescriptions/dispensing-queue');
    return response.data;
  },

  /**
   * Mark prescription as dispensed
   */
  markDispensed: async (prescriptionId: string, salesOrderId: string) => {
    const response = await api.post<Prescription>(
      `/prescriptions/${prescriptionId}/mark-dispensed`,
      { sales_order_id: salesOrderId }
    );
    return response.data;
  },
};

export default {
  prescriptions: prescriptionApi,
  verification: verificationApi,
  documents: prescriptionDocumentApi,
  refills: refillApi,
  safety: drugSafetyApi,
  dispensing: dispensingApi,
};
