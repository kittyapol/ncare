# 🎯 แผนการพัฒนาระบบ Pharmacy ERP (nCare)

**วันที่สร้าง:** 12 พฤศจิกายน 2025
**สถานะปัจจุบัน:** 70% สมบูรณ์
**เป้าหมาย:** 95% สมบูรณ์ภายใน 6-8 สัปดาห์

---

## 📊 สถานะปัจจุบัน

### ✅ สิ่งที่ทำเสร็จแล้ว (70%)

```
Backend API:           85% ✅ (50+ endpoints, VAT support, Export services)
Database:              95% ✅ (15 tables, 4 migrations, relationships ครบ)
CI/CD Pipeline:       100% ✅ (Tests, Code Quality, Security Scanning)
Tests:                 92.6% ✅ (27 tests passing)
Documentation:         95% ✅ (API Docs, System Analysis, Guides)

Frontend UI:           40% ⚠️ (Core pages เท่านั้น)
```

### 🎯 เป้าหมาย

**Production Ready:** 95% ภายใน 6-8 สัปดาห์
- Backend: 100% (แก้ไข dict parameters, เพิ่ม missing endpoints)
- Frontend: 85% (Core UI + Management pages)
- Tests: 95% (เพิ่ม Frontend tests, E2E tests)

---

## 🚨 ปัญหาที่ต้องแก้ไขก่อน (CRITICAL - 2-3 ชั่วโมง)

### 1. Dict Parameters ใน API (SECURITY ISSUE)

**ปัญหา:** 4 endpoints ใช้ `dict` แทน Pydantic schemas → ไม่มี validation

**ไฟล์ที่ต้องแก้:**
1. `services/api/app/api/v1/endpoints/customers.py`
   - `POST /api/v1/customers/` - ใช้ `dict` แทน `CustomerCreate`
   - `PUT /api/v1/customers/{id}` - ใช้ `dict` แทน `CustomerUpdate`

2. `services/api/app/api/v1/endpoints/suppliers.py`
   - `POST /api/v1/suppliers/` - ใช้ `dict` แทน `SupplierCreate`
   - `PUT /api/v1/suppliers/{id}` - ใช้ `dict` แทน `SupplierUpdate`

3. `services/api/app/api/v1/endpoints/categories.py`
   - `POST /api/v1/categories/` - ใช้ `dict` แทน `CategoryCreate`

4. `services/api/app/api/v1/endpoints/users.py`
   - `PUT /api/v1/users/{id}` - ใช้ `dict` แทน `UserUpdate`

**การแก้ไข:**
```python
# Before (WRONG)
@router.post("/customers/")
def create_customer(customer_data: dict, db: Session = Depends(get_db)):
    ...

# After (CORRECT)
from app.schemas.customer import CustomerCreate

@router.post("/customers/", response_model=CustomerResponse)
def create_customer(customer_data: CustomerCreate, db: Session = Depends(get_db)):
    ...
```

**เวลาที่ต้องการ:** 2-3 ชั่วโมง
- สร้าง schemas: 1 ชั่วโมง
- แก้ไข endpoints: 1 ชั่วโมง
- Test: 30 นาที

---

## 📋 Phase 0: Critical Fixes (2-3 ชั่วโมง) 🔴

**ความสำคัญ:** CRITICAL - ต้องทำก่อนทุกอย่าง

### Tasks:
- [ ] สร้าง `CustomerCreate`, `CustomerUpdate` schemas
- [ ] สร้าง `SupplierCreate`, `SupplierUpdate` schemas
- [ ] สร้าง `CategoryCreate`, `CategoryUpdate` schemas
- [ ] สร้าง `UserUpdate` schema (ถ้ายังไม่มี)
- [ ] แก้ไข 4 endpoints ที่ใช้ dict
- [ ] เพิ่ม `Category PUT /api/v1/categories/{id}` endpoint
- [ ] เพิ่ม `Category DELETE /api/v1/categories/{id}` endpoint
- [ ] เพิ่ม `Customer DELETE /api/v1/customers/{id}` endpoint
- [ ] Run tests เพื่อยืนยันว่าทำงานถูกต้อง
- [ ] Commit และ push

**Output:**
- ✅ Validation ครบทุก endpoint
- ✅ Security improved
- ✅ API สมบูรณ์ 100%

---

## 📋 Phase 1: Core UI Completion (2 สัปดาห์) 🔴

**ความสำคัญ:** HIGH - ต้องมีเพื่อใช้งานจริง
**เวลา:** 10-12 วัน (2 สัปดาห์)

### 1.1 Product Form (2-3 วัน)

**ต้องทำ:**
- [ ] สร้าง `ProductForm.tsx` component
  - All fields: name_th, name_en, sku, barcode
  - Category selector (dropdown)
  - Dosage form, drug type (dropdown)
  - Prices: cost_price, sell_price
  - VAT fields: is_vat_applicable, vat_rate
  - Stock: reorder_point, safety_stock
  - FDA number, manufacturer
- [ ] Product Create page (`/products/new`)
- [ ] Product Edit page (`/products/:id/edit`)
- [ ] Image upload (single image)
- [ ] Form validation
- [ ] Auto-generate SKU option
- [ ] Success/Error messages
- [ ] Integration tests

**API ที่ใช้:**
- `POST /api/v1/inventory/products/`
- `PUT /api/v1/inventory/products/{id}`
- `GET /api/v1/categories/` (สำหรับ dropdown)

**Output:**
- ✅ สามารถสร้าง/แก้ไขสินค้าได้ใน UI
- ✅ Validation ครบถ้วน
- ✅ UX ที่ดี

---

### 1.2 Sales Orders History (2-3 วัน)

**ต้องทำ:**
- [ ] แก้ไข `SalesOrders.tsx` ให้แสดงรายการออเดอร์จริง
  - Orders table with columns:
    - Order Number
    - Date
    - Customer (if any)
    - Items count
    - Total amount
    - VAT amount
    - Status (completed/cancelled)
  - Pagination
  - Search by order number
  - Filter by date range
  - Filter by status
- [ ] Order Details Modal
  - แสดงรายละเอียดออเดอร์ทั้งหมด
  - รายการสินค้า (items)
  - VAT breakdown
  - Payment information
  - ปุ่ม Print Receipt (ถ้า Phase 1.3 เสร็จ)
- [ ] Refund/Cancel functionality (optional)

**API ที่ใช้:**
- `GET /api/v1/sales/orders/` (with pagination, filters)
- `GET /api/v1/sales/orders/{id}`

**Output:**
- ✅ ดูประวัติการขายได้
- ✅ ค้นหา/กรองได้
- ✅ ดูรายละเอียดแต่ละออเดอร์

---

### 1.3 Receipt Printing (3-4 วัน)

**ต้องทำ:**
- [ ] Backend: สร้าง Receipt Template
  - ใช้ ReportLab (มีอยู่แล้ว)
  - Format: Thai Tax Invoice
  - แสดงข้อมูล:
    - เลขที่ใบเสร็จ (Order Number)
    - วันที่-เวลา
    - รายการสินค้า (ชื่อ, จำนวน, ราคา)
    - VAT breakdown
    - ยอดรวม
    - วิธีชำระเงิน
    - Barcode (Order Number)
- [ ] Backend: Receipt API endpoint
  - `GET /api/v1/sales/orders/{id}/receipt/pdf`
  - Generate PDF on-the-fly
  - Return PDF file
- [ ] Frontend: Print Receipt button
  - ใน POSInterface (หลัง complete payment)
  - ใน SalesOrders (Order Details Modal)
  - เปิด PDF ใน tab ใหม่
  - Auto-print dialog
- [ ] Email Receipt option (optional)
  - `POST /api/v1/sales/orders/{id}/receipt/email`
  - ส่ง email พร้อม PDF attachment

**Output:**
- ✅ พิมพ์ใบเสร็จได้
- ✅ Format ถูกต้องตาม Tax Invoice
- ✅ มี Barcode

---

### 1.4 Purchase Orders UI (3-4 วัน)

**ต้องทำ:**
- [ ] แก้ไข `PurchaseOrders.tsx`
  - PO List table:
    - PO Number
    - Supplier
    - Order Date
    - Expected Delivery
    - Status (draft/sent/received)
    - Total Amount
  - Pagination
  - Filter by status, supplier, date
- [ ] PO Creation Form
  - Supplier selector (dropdown)
  - Expected delivery date
  - Items table:
    - Product selector (search dropdown)
    - Quantity
    - Unit price
    - Line total (auto-calculate)
  - Subtotal, Total (auto-calculate)
  - Notes
- [ ] PO Details Modal
  - แสดงรายละเอียด PO
  - รายการสินค้า
  - Status
  - Received quantities
- [ ] Receive Goods Interface
  - แสดง PO items
  - สำหรับแต่ละ item:
    - Lot number
    - Batch number (optional)
    - Manufacture date
    - Expiry date
    - Quantity received
    - Warehouse selector
  - ปุ่ม "Receive All" (fill all quantities)
  - ปุ่ม "Submit Receipt"
- [ ] Approval workflow (optional)
  - ปุ่ม Approve/Reject
  - RBAC protection (manager/admin only)

**API ที่ใช้:**
- `GET /api/v1/purchase/orders/`
- `POST /api/v1/purchase/orders/`
- `GET /api/v1/purchase/orders/{id}`
- `POST /api/v1/purchase/orders/{id}/receive`
- `GET /api/v1/suppliers/` (dropdown)

**Output:**
- ✅ สร้าง PO ได้ใน UI
- ✅ รับของเข้าคลังได้
- ✅ Auto-create inventory lots
- ✅ Workflow สมบูรณ์

---

## 📋 Phase 2: Management Pages (1.5 สัปดาห์) 🟡

**ความสำคัญ:** MEDIUM - ควรมีแต่ไม่จำเป็นเร่งด่วน
**เวลา:** 7-9 วัน

### 2.1 Supplier Management (2 วัน)

**ต้องทำ:**
- [ ] `SupplierList.tsx` page
  - Suppliers table (name, contact, tax_id, status)
  - Pagination, Search
- [ ] `SupplierForm.tsx` component
  - All fields: name_th, name_en, tax_id, address, phone, email
  - Contact person, payment terms, credit limit
  - Validation
- [ ] Supplier Profile page
  - แสดงข้อมูลผู้จำหน่าย
  - Purchase history
  - Total purchase amount
  - Outstanding balance
- [ ] CRUD operations
  - Create, Edit, Delete (soft delete)

**API ที่ใช้:**
- `GET /api/v1/suppliers/`
- `POST /api/v1/suppliers/`
- `GET /api/v1/suppliers/{id}`
- `PUT /api/v1/suppliers/{id}`
- `DELETE /api/v1/suppliers/{id}`

---

### 2.2 Customer Management (2-3 วัน)

**ต้องทำ:**
- [ ] `CustomerList.tsx` page
  - Customers table (name, phone, loyalty_points, status)
  - Pagination, Search
- [ ] `CustomerForm.tsx` component
  - Personal info: name, phone, email, address
  - Medical info: allergies, chronic_conditions
  - Preferred contact method
  - Date of birth
  - Validation
- [ ] Customer Profile page
  - แสดงข้อมูลลูกค้า
  - Purchase history
  - Loyalty points management
    - Current points
    - Add/Deduct points
    - Points history
  - Medical info display
- [ ] CRUD operations
  - Create, Edit, Delete

**API ที่ใช้:**
- `GET /api/v1/customers/`
- `GET /api/v1/customers/search`
- `POST /api/v1/customers/`
- `GET /api/v1/customers/{id}`
- `PUT /api/v1/customers/{id}`
- `DELETE /api/v1/customers/{id}`
- `POST /api/v1/customers/{id}/loyalty-points`

---

### 2.3 User Management (2 วัน)

**ต้องทำ:**
- [ ] `UserList.tsx` page (Admin only)
  - Users table (name, email, role, status)
  - Pagination, Search
  - Filter by role
- [ ] `UserForm.tsx` component
  - Email, Full name
  - Role selector (dropdown)
  - Password (สำหรับ create)
  - is_active toggle
  - Validation
- [ ] User Profile page
  - แสดงข้อมูลผู้ใช้
  - Activity log (recent actions)
  - Change password form
- [ ] CRUD operations
  - Create, Edit, Deactivate (not delete)
- [ ] RBAC UI
  - Permission matrix display
  - Role descriptions

**API ที่ใช้:**
- `GET /api/v1/users/`
- `POST /api/v1/users/`
- `GET /api/v1/users/{id}`
- `PUT /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}` (deactivate)

---

### 2.4 Category Management (1-2 วัน)

**ต้องทำ:**
- [ ] `CategoryList.tsx` page
  - Tree view (hierarchical)
  - Expand/Collapse categories
  - Product count per category
- [ ] `CategoryForm.tsx` component
  - name_th, name_en
  - Parent category selector (dropdown)
  - Description
- [ ] Drag & Drop reordering (optional)
- [ ] CRUD operations
  - Create, Edit, Delete

**API ที่ใช้:**
- `GET /api/v1/categories/`
- `POST /api/v1/categories/`
- `GET /api/v1/categories/{id}`
- `PUT /api/v1/categories/{id}` (ต้องสร้างใน Phase 0)
- `DELETE /api/v1/categories/{id}` (ต้องสร้างใน Phase 0)

---

## 📋 Phase 3: Reports & Analytics (1 สัปดาห์) 🟢

**ความสำคัญ:** NICE TO HAVE
**เวลา:** 5-7 วัน

### 3.1 Sales Reports (2 วัน)

**ต้องทำ:**
- [ ] แก้ไข `Reports.tsx`
  - Sales Report tab
  - Charts:
    - Daily/Weekly/Monthly sales (Line chart)
    - Sales by category (Pie chart)
    - Top 10 products (Bar chart)
  - Date range picker
  - Export to PDF/Excel (มีอยู่แล้ว)
  - Summary cards:
    - Total sales
    - Total VAT collected
    - Total transactions
    - Average order value

**Library:** Recharts (ติดตั้งแล้ว)

---

### 3.2 Inventory Reports (2 วัน)

**ต้องทำ:**
- [ ] Inventory Report tab
  - Charts:
    - Stock levels by category (Bar chart)
    - Low stock items (Table with alerts)
    - Expiring items (Table with countdown)
  - Filters:
    - Warehouse
    - Category
    - Date range
  - Export to PDF/Excel

---

### 3.3 Dashboard Enhancement (1 วัน)

**ต้องทำ:**
- [ ] เพิ่ม widgets ใน Dashboard
  - Today's sales chart (hourly)
  - Top selling products (today)
  - Recent transactions (real-time)
  - Stock alerts (interactive)
- [ ] Real-time updates (optional)
  - WebSocket หรือ polling
  - Auto-refresh every 30 seconds

---

## 📋 Phase 4: Testing & Quality (1 สัปดาห์) 🟢

**ความสำคัญ:** IMPORTANT
**เวลา:** 5-7 วัน

### 4.1 Frontend Unit Tests (2-3 วัน)

**ต้องทำ:**
- [ ] Setup Vitest + React Testing Library
- [ ] Tests สำหรับ components:
  - ProductForm (validation, submission)
  - POSInterface (cart operations)
  - PaymentModal (payment calculation)
  - ProductSearch (search functionality)
- [ ] Tests สำหรับ stores:
  - authStore (login, logout, token refresh)
  - cartStore (add, remove, update items)
- [ ] Coverage target: 70%+

---

### 4.2 E2E Tests (2-3 วัน)

**ต้องทำ:**
- [ ] Setup Playwright
- [ ] E2E test scenarios:
  - Complete POS transaction flow
  - Product creation flow
  - Purchase order flow
  - User login/logout flow
  - Sales report generation
- [ ] CI/CD integration
  - Add E2E tests to GitHub Actions
  - Run on every PR

---

### 4.3 Performance Testing (1-2 วัน)

**ต้องทำ:**
- [ ] Load testing (Apache Bench หรือ k6)
  - Test API endpoints
  - 100 concurrent users
  - Identify bottlenecks
- [ ] Frontend performance audit
  - Lighthouse CI
  - Bundle size analysis
  - Lazy loading
  - Code splitting
- [ ] Database optimization
  - Index optimization
  - Query optimization
  - Connection pooling tuning

---

## 📋 Phase 5: Security & Deployment (1 สัปดาห์) 🟡

**ความสำคัญ:** CRITICAL สำหรับ Production
**เวลา:** 5-7 วัน

### 5.1 Security Enhancements (2-3 วัน)

**ต้องทำ:**
- [ ] Rate Limiting
  - ติดตั้ง slowapi
  - Configure limits:
    - Login: 5 requests/minute
    - API: 100 requests/minute
    - Search: 20 requests/minute
- [ ] CORS Configuration
  - กำหนด allowed origins สำหรับ production
  - Whitelist specific domains
- [ ] Input Sanitization
  - XSS prevention
  - SQL injection prevention (มีอยู่แล้ว via ORM)
- [ ] Security Headers
  - HSTS
  - X-Frame-Options
  - X-Content-Type-Options
  - Content-Security-Policy
- [ ] HTTPS Enforcement
  - Redirect HTTP → HTTPS
  - SSL certificate setup
- [ ] Environment Variables Security
  - ใช้ secrets management
  - Rotate secrets regularly
- [ ] Security Audit
  - Run Bandit, Safety (มีอยู่แล้วใน CI/CD)
  - Fix vulnerabilities

---

### 5.2 Deployment Preparation (2-3 วัน)

**ต้องทำ:**
- [ ] Production Docker configuration
  - Multi-stage builds
  - Optimize image size
  - Health checks
- [ ] Database Migration strategy
  - Backup/Restore procedures
  - Zero-downtime migration
- [ ] Monitoring setup
  - Error tracking: Sentry
  - APM: New Relic หรือ DataDog
  - Uptime monitoring: UptimeRobot
  - Log aggregation: ELK stack
- [ ] Deployment scripts
  - Blue-Green deployment
  - Rollback procedures
- [ ] Production checklist
  - Environment variables
  - Database backups
  - SSL certificates
  - CDN configuration
  - Email service (SendGrid/Mailgun)

---

### 5.3 Documentation (1 วัน)

**ต้องทำ:**
- [ ] Deployment Guide
  - Step-by-step instructions
  - Environment setup
  - Configuration
- [ ] User Manual (ภาษาไทย)
  - How to use POS
  - How to manage products
  - How to receive goods
  - How to generate reports
- [ ] Admin Guide
  - User management
  - System configuration
  - Troubleshooting
- [ ] API Documentation update
  - Swagger descriptions
  - Examples
  - Error codes

---

## 📊 Summary Timeline

| Phase | Description | Duration | Priority | Status |
|-------|-------------|----------|----------|--------|
| **Phase 0** | Critical Fixes (Dict Parameters, Missing Endpoints) | 2-3 ชม | 🔴 CRITICAL | ⬜ Not Started |
| **Phase 1** | Core UI Completion (Product Form, Sales/PO UI, Receipt) | 2 สัปดาห์ | 🔴 HIGH | ⬜ Not Started |
| **Phase 2** | Management Pages (Suppliers, Customers, Users, Categories) | 1.5 สัปดาห์ | 🟡 MEDIUM | ⬜ Not Started |
| **Phase 3** | Reports & Analytics (Charts, Dashboard) | 1 สัปดาห์ | 🟢 NICE | ⬜ Not Started |
| **Phase 4** | Testing & Quality (Unit, E2E, Performance) | 1 สัปดาห์ | 🟢 IMPORTANT | ⬜ Not Started |
| **Phase 5** | Security & Deployment (Security Audit, Production Setup) | 1 สัปดาห์ | 🟡 CRITICAL | ⬜ Not Started |

**Total Time:** 6-8 สัปดาห์

---

## 🎯 Milestones

### Milestone 1: Quick Launch (3 สัปดาห์) - 80% Production Ready
- ✅ Phase 0 (Critical Fixes)
- ✅ Phase 1 (Core UI)
- ✅ Basic Security (Phase 5.1)

**พร้อมใช้งาน:** POS, Product Management, Purchase Orders, Receipt Printing

---

### Milestone 2: Full Launch (5 สัปดาห์) - 90% Production Ready
- ✅ Milestone 1
- ✅ Phase 2 (Management Pages)
- ✅ Phase 4 (Testing)
- ✅ Phase 5 (Deployment)

**พร้อมใช้งาน:** ระบบครบทุกฟีเจอร์หลัก + Management + Tests

---

### Milestone 3: Complete System (7-8 สัปดาห์) - 95% Production Ready
- ✅ Milestone 2
- ✅ Phase 3 (Reports & Analytics)
- ✅ Performance Optimization
- ✅ Monitoring & Alerting

**พร้อมใช้งาน:** ระบบสมบูรณ์พร้อม Analytics, Reports, Monitoring

---

## 📝 Next Steps (ควรทำตอนนี้)

### Immediate Actions (Today):
1. **Review and approve this plan**
2. **Setup task tracking** (GitHub Projects or Trello)
3. **Prioritize Phase 0** (Critical Fixes)
4. **Assign resources** (developers, designers)

### This Week:
1. **Complete Phase 0** (2-3 hours)
2. **Start Phase 1.1** (Product Form)
3. **Setup Frontend testing environment**

### This Month:
1. **Complete Phase 1** (Core UI)
2. **Start Phase 2** (Management Pages)
3. **Security audit**

---

## 💡 Recommendations

### Development Approach:
1. **Agile/Scrum methodology** - 1-week sprints
2. **Daily standups** - Track progress, blockers
3. **Code reviews** - Mandatory for all PRs
4. **CI/CD** - Already setup ✅
5. **Feature flags** - For gradual rollout

### Team Structure (Suggested):
- **1 Backend Developer** - Phase 0, API enhancements
- **2 Frontend Developers** - Phase 1, 2, 3 (UI development)
- **1 QA Engineer** - Phase 4 (Testing)
- **1 DevOps Engineer** - Phase 5 (Deployment, Monitoring)

### Tools:
- **Project Management:** GitHub Projects, Trello, Jira
- **Design:** Figma (สำหรับ UI mockups)
- **Communication:** Slack, Discord
- **Documentation:** Notion, Confluence

---

## ✅ Success Criteria

**Phase 1 Success:**
- [ ] สามารถสร้าง/แก้ไขสินค้าได้ใน UI
- [ ] สามารถพิมพ์ใบเสร็จได้
- [ ] สามารถดูประวัติการขายได้
- [ ] สามารถสร้าง PO และรับของได้

**Phase 2 Success:**
- [ ] สามารถจัดการผู้จำหน่าย, ลูกค้า, ผู้ใช้ได้
- [ ] สามารถจัดการหมวดหมู่ได้

**Phase 3 Success:**
- [ ] รายงานมี charts และ visualization
- [ ] Export PDF/Excel ทำงานได้

**Phase 4 Success:**
- [ ] Test coverage ≥ 70%
- [ ] E2E tests ครอบคลุม core flows
- [ ] Performance benchmarks met

**Phase 5 Success:**
- [ ] Security audit passed
- [ ] Production deployment successful
- [ ] Monitoring active
- [ ] Zero critical bugs

---

**Created:** 2025-11-12
**Last Updated:** 2025-11-12
**Version:** 1.0
**Status:** 📋 Ready for Review
