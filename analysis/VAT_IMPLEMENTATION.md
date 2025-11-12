# VAT/Non-VAT Implementation Guide

## Overview

This document describes the implementation of VAT (Value Added Tax) and Non-VAT product handling in the Pharmacy ERP System, complying with Thai tax regulations.

## Business Requirements

### Thai VAT Regulations
- **Standard VAT Rate:** 7%
- **Zero-Rated:** Export goods, certain essential items
- **Exempt:** Medical services, educational services
- **Exempt Pharmaceuticals:** Certain life-saving drugs (as per Ministry of Finance)

### Product Classification

#### VAT-Applicable Products (is_vat_applicable = true)
- OTC medications
- Health supplements
- Medical devices
- Cosmetics
- Health products

#### Non-VAT Products (is_vat_applicable = false)
- Prescription drugs (certain categories)
- Life-saving medications
- Government-subsidized drugs
- Vaccines (specific types)

## Database Schema Changes

### Products Table
```sql
ALTER TABLE products ADD COLUMN is_vat_applicable BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN vat_rate NUMERIC(5,2) DEFAULT 7.00;
ALTER TABLE products ADD COLUMN vat_category VARCHAR(50) DEFAULT 'standard';
```

**Fields:**
- `is_vat_applicable` - Whether VAT applies to this product
- `vat_rate` - VAT rate (default 7%)
- `vat_category` - Tax category (standard, zero-rated, exempt)

### Sales Order Items Table
```sql
ALTER TABLE sales_order_items ADD COLUMN vat_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE sales_order_items ADD COLUMN price_before_vat NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE sales_order_items ADD COLUMN price_including_vat NUMERIC(10,2) DEFAULT 0.00;
```

**Calculation Logic:**
```python
if product.is_vat_applicable:
    price_before_vat = unit_price * quantity
    vat_amount = price_before_vat * (vat_rate / 100)
    price_including_vat = price_before_vat + vat_amount
else:
    price_before_vat = unit_price * quantity
    vat_amount = 0.00
    price_including_vat = price_before_vat
```

### Sales Orders Table
```sql
ALTER TABLE sales_orders ADD COLUMN vat_total NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE sales_orders ADD COLUMN non_vat_total NUMERIC(10,2) DEFAULT 0.00;
```

**Totals Breakdown:**
- `subtotal` - Total before VAT
- `vat_total` - Total VAT amount (only from VAT-applicable items)
- `non_vat_total` - Total from non-VAT items
- `total_amount` - Grand total (subtotal + vat_total)

## API Changes

### Product Creation/Update
```json
{
  "sku": "MED001",
  "name_th": "พาราเซตามอล",
  "is_vat_applicable": true,
  "vat_rate": 7.00,
  "vat_category": "standard",
  "selling_price": 100.00
}
```

### Sales Order Response
```json
{
  "order_number": "SO-20240115001",
  "items": [
    {
      "product_id": "...",
      "quantity": 2,
      "unit_price": 100.00,
      "price_before_vat": 200.00,
      "vat_amount": 14.00,
      "price_including_vat": 214.00
    }
  ],
  "subtotal": 200.00,
  "vat_total": 14.00,
  "non_vat_total": 0.00,
  "total_amount": 214.00
}
```

## Receipt Format

### Tax Invoice / Receipt

```
==========================================
        ร้านยา ABC Pharmacy
    123 ถนนสุขุมวิท กรุงเทพฯ 10110
    Tax ID: 0-1055-36001-23-4
==========================================

Date: 15/01/2024 14:30:25
Invoice: SO-20240115001
Cashier: John Doe

------------------------------------------
Item                  Qty    Price   Total
------------------------------------------
พาราเซตามอล 500mg      2    100.00  200.00
(VAT 7%)

วิตามินซี 1000mg       1     50.00   50.00
(VAT 7%)

ยาปฏิชีวนะ XXX        1    150.00  150.00
(Non-VAT)
------------------------------------------

Sub-total (Before VAT):         400.00
VAT (7%):                        17.50
Non-VAT Items:                  150.00
------------------------------------------
Total:                          417.50

Payment (Cash):                 500.00
Change:                          82.50
==========================================

Thank you for your purchase!
==========================================
```

## Reporting Requirements

### Daily Sales Report
```
Date: 15/01/2024

VAT Sales:
  Sales (Before VAT):    10,000.00
  VAT Amount (7%):          700.00
  Total VAT Sales:      10,700.00

Non-VAT Sales:            5,000.00

Total Sales:             15,700.00
```

### Monthly VAT Report (for Revenue Department)
```
Period: January 2024

VAT Collected:
  Standard Rate (7%):     50,000.00
  Zero-Rated:                  0.00

Input VAT (Purchases):    30,000.00

Net VAT Payable:          20,000.00
```

## Frontend Implementation

### Product Form
```typescript
<div>
  <label>VAT Applicable</label>
  <select name="is_vat_applicable">
    <option value="true">Yes (VAT 7%)</option>
    <option value="false">No (Exempt)</option>
  </select>

  <label>VAT Category</label>
  <select name="vat_category">
    <option value="standard">Standard (7%)</option>
    <option value="zero-rated">Zero-Rated (0%)</option>
    <option value="exempt">Exempt</option>
  </select>
</div>
```

### POS Display
```typescript
// Cart item display
<div className="cart-item">
  <span>{product.name_th}</span>
  <span>{quantity} × ฿{unitPrice}</span>
  <span>฿{lineTotal}</span>
  {item.vatAmount > 0 && (
    <small className="vat-badge">VAT 7%</small>
  )}
</div>

// Totals
<div className="totals">
  <div>Sub-total: ฿{subtotal}</div>
  <div>VAT (7%): ฿{vatTotal}</div>
  {nonVatTotal > 0 && (
    <div>Non-VAT Items: ฿{nonVatTotal}</div>
  )}
  <div className="total">Total: ฿{total}</div>
</div>
```

## Compliance Considerations

### Tax Invoice Requirements (Thailand)
1. ✅ Tax ID displayed
2. ✅ Running number (invoice number)
3. ✅ Date and time
4. ✅ Item details with VAT breakdown
5. ✅ Separate VAT and non-VAT totals
6. ✅ Company name and address

### Record Keeping
- Keep all tax invoices for 5 years
- Monthly VAT reports submitted to Revenue Department
- Separate books for VAT and non-VAT transactions

## Testing Scenarios

### Test Case 1: Mixed VAT/Non-VAT Sale
```
Products:
1. Paracetamol (VAT) - ฿100 × 2 = ฿200 + VAT ฿14 = ฿214
2. Antibiotic (Non-VAT) - ฿150 × 1 = ฿150

Expected:
- Subtotal: ฿350
- VAT Total: ฿14
- Non-VAT Total: ฿150
- Grand Total: ฿364
```

### Test Case 2: All VAT Items
```
Products:
1. Vitamin C (VAT) - ฿50 × 5 = ฿250 + VAT ฿17.50 = ฿267.50

Expected:
- Subtotal: ฿250
- VAT Total: ฿17.50
- Non-VAT Total: ฿0
- Grand Total: ฿267.50
```

### Test Case 3: All Non-VAT Items
```
Products:
1. Prescription Drug (Non-VAT) - ฿200 × 1 = ฿200

Expected:
- Subtotal: ฿200
- VAT Total: ฿0
- Non-VAT Total: ฿200
- Grand Total: ฿200
```

## Migration Strategy

### Step 1: Database Migration
```bash
cd services/api
alembic upgrade head
```

### Step 2: Update Existing Products
```sql
-- Set default VAT status for existing products
UPDATE products
SET is_vat_applicable = true,
    vat_rate = 7.00,
    vat_category = 'standard'
WHERE drug_type IN ('otc');

UPDATE products
SET is_vat_applicable = false,
    vat_rate = 0.00,
    vat_category = 'exempt'
WHERE drug_type IN ('prescription', 'controlled', 'dangerous');
```

### Step 3: Test Calculations
Run test suite to verify VAT calculations

### Step 4: Update Frontend
Deploy updated POS interface with VAT display

## Future Enhancements

1. **Multi-Rate VAT Support**
   - Different VAT rates for different product categories
   - Support for future rate changes

2. **VAT Exemption Management**
   - Customer-based exemptions (hospitals, government)
   - Temporary exemptions

3. **Advanced Reporting**
   - PP.30 form generation (Thai VAT return)
   - Por Por.09 (withholding tax)
   - Electronic submission ready

4. **International Support**
   - Different tax systems for export
   - Multi-currency VAT handling

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Author:** Development Team
