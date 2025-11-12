"""
Seed data script for development and testing
Run with: python -m scripts.seed_data
"""
import sys
import os
from datetime import date, datetime, timedelta
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product, Category, DosageForm, DrugType
from app.models.inventory import InventoryLot, Warehouse, QualityStatus, WarehouseType
from app.models.supplier import Supplier
from app.models.customer import Customer


def seed_users(db):
    """Create initial users"""
    print("Creating users...")

    users_data = [
        {
            "email": "admin@pharmacy.com",
            "password": "admin123",
            "full_name": "Admin User",
            "role": UserRole.ADMIN,
            "phone": "02-123-4567",
        },
        {
            "email": "manager@pharmacy.com",
            "password": "manager123",
            "full_name": "Manager User",
            "role": UserRole.MANAGER,
            "phone": "02-123-4568",
        },
        {
            "email": "pharmacist@pharmacy.com",
            "password": "pharmacist123",
            "full_name": "Pharmacist User",
            "role": UserRole.PHARMACIST,
            "phone": "02-123-4569",
        },
        {
            "email": "cashier@pharmacy.com",
            "password": "cashier123",
            "full_name": "Cashier User",
            "role": UserRole.CASHIER,
            "phone": "02-123-4570",
        },
    ]

    created_users = {}
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                phone=user_data.get("phone"),
                is_active=True,
            )
            db.add(user)
            created_users[user_data["role"]] = user
            print(f"  ✓ Created user: {user_data['email']}")
        else:
            created_users[user_data["role"]] = existing
            print(f"  - User exists: {user_data['email']}")

    db.commit()
    return created_users


def seed_categories(db):
    """Create product categories"""
    print("\nCreating categories...")

    categories_data = [
        {"code": "CAT001", "name_th": "ยาแก้ปวด-ลดไข้", "name_en": "Pain Relief & Fever"},
        {"code": "CAT002", "name_th": "ยาแก้แพ้", "name_en": "Antihistamines"},
        {"code": "CAT003", "name_th": "ยาปฏิชีวนะ", "name_en": "Antibiotics"},
        {"code": "CAT004", "name_th": "วิตามินและอาหารเสริม", "name_en": "Vitamins & Supplements"},
        {"code": "CAT005", "name_th": "ยาทาภายนอก", "name_en": "Topical Medications"},
        {
            "code": "CAT006",
            "name_th": "ยารักษาโรคเรื้อรัง",
            "name_en": "Chronic Disease Medications",
        },
        {
            "code": "CAT007",
            "name_th": "ยาบรรเทาอาการทางเดินหายใจ",
            "name_en": "Respiratory Medications",
        },
        {"code": "CAT008", "name_th": "ยาสมุนไพร", "name_en": "Herbal Medicine"},
    ]

    created_categories = {}
    for cat_data in categories_data:
        existing = db.query(Category).filter(Category.code == cat_data["code"]).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
            created_categories[cat_data["code"]] = category
            print(f"  ✓ Created category: {cat_data['name_th']}")
        else:
            created_categories[cat_data["code"]] = existing
            print(f"  - Category exists: {cat_data['name_th']}")

    db.commit()
    return created_categories


def seed_warehouses(db):
    """Create warehouses"""
    print("\nCreating warehouses...")

    warehouses_data = [
        {
            "code": "WH001",
            "name": "คลังสินค้าหลัก",
            "type": WarehouseType.MAIN,
            "address": "123 ถนนพระราม 4",
        },
        {
            "code": "WH002",
            "name": "คลังเย็น",
            "type": WarehouseType.COLD_STORAGE,
            "address": "123 ถนนพระราม 4 (ห้องเย็น)",
        },
    ]

    created_warehouses = {}
    for wh_data in warehouses_data:
        existing = db.query(Warehouse).filter(Warehouse.code == wh_data["code"]).first()
        if not existing:
            warehouse = Warehouse(**wh_data)
            db.add(warehouse)
            created_warehouses[wh_data["code"]] = warehouse
            print(f"  ✓ Created warehouse: {wh_data['name']}")
        else:
            created_warehouses[wh_data["code"]] = existing
            print(f"  - Warehouse exists: {wh_data['name']}")

    db.commit()
    return created_warehouses


def seed_suppliers(db):
    """Create suppliers"""
    print("\nCreating suppliers...")

    suppliers_data = [
        {
            "code": "SUP001",
            "name_th": "บริษัท ไทยฟาร์มา จำกัด",
            "name_en": "Thai Pharma Co., Ltd.",
            "tax_id": "0105536001234",
            "contact_person": "คุณสมชาย ใจดี",
            "email": "contact@thaipharma.co.th",
            "phone": "02-234-5678",
            "address": "99 ถนนพระราม 9",
            "city": "กรุงเทพฯ",
            "province": "กรุงเทพมหานคร",
            "postal_code": "10400",
            "payment_terms": "Net 30",
            "rating": "A",
        },
        {
            "code": "SUP002",
            "name_th": "บริษัท เมดิคอล ซัพพลาย จำกัด",
            "name_en": "Medical Supply Co., Ltd.",
            "tax_id": "0105536001235",
            "contact_person": "คุณสมหญิง รักษ์ดี",
            "email": "info@medsupply.co.th",
            "phone": "02-345-6789",
            "address": "555 ถนนสุขุมวิท",
            "city": "กรุงเทพฯ",
            "province": "กรุงเทพมหานคร",
            "postal_code": "10110",
            "payment_terms": "Net 45",
            "rating": "A",
        },
    ]

    created_suppliers = {}
    for sup_data in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.code == sup_data["code"]).first()
        if not existing:
            supplier = Supplier(**sup_data)
            db.add(supplier)
            created_suppliers[sup_data["code"]] = supplier
            print(f"  ✓ Created supplier: {sup_data['name_th']}")
        else:
            created_suppliers[sup_data["code"]] = existing
            print(f"  - Supplier exists: {sup_data['name_th']}")

    db.commit()
    return created_suppliers


def seed_customers(db):
    """Create sample customers"""
    print("\nCreating customers...")

    customers_data = [
        {
            "code": "CUS001",
            "name": "นายสมศักดิ์ ทดสอบ",
            "email": "somsak@email.com",
            "phone": "08-1234-5678",
            "address": "123 ถนนสุขุมวิท",
            "city": "กรุงเทพฯ",
            "province": "กรุงเทพมหานคร",
            "loyalty_points": 100,
            "member_since": date.today(),
            "membership_tier": "Silver",
        },
        {
            "code": "CUS002",
            "name": "นางสาวสมหญิง ตัวอย่าง",
            "email": "somying@email.com",
            "phone": "08-2345-6789",
            "address": "456 ถนนพระราม 4",
            "city": "กรุงเทพฯ",
            "province": "กรุงเทพมหานคร",
            "loyalty_points": 250,
            "member_since": date.today() - timedelta(days=90),
            "membership_tier": "Gold",
        },
    ]

    created_customers = {}
    for cus_data in customers_data:
        existing = db.query(Customer).filter(Customer.code == cus_data["code"]).first()
        if not existing:
            customer = Customer(**cus_data)
            db.add(customer)
            created_customers[cus_data["code"]] = customer
            print(f"  ✓ Created customer: {cus_data['name']}")
        else:
            created_customers[cus_data["code"]] = existing
            print(f"  - Customer exists: {cus_data['name']}")

    db.commit()
    return created_customers


def seed_products(db, categories):
    """Create sample products"""
    print("\nCreating products...")

    products_data = [
        {
            "sku": "MED001",
            "barcode": "8850123456789",
            "name_th": "พาราเซตามอล 500 มก.",
            "name_en": "Paracetamol 500mg",
            "generic_name": "Paracetamol",
            "category_id": categories["CAT001"].id,
            "active_ingredient": "Paracetamol 500mg",
            "dosage_form": DosageForm.TABLET,
            "strength": "500mg",
            "drug_type": DrugType.OTC,
            "fda_number": "1A 12/12345",
            "manufacturer": "บริษัท ไทยฟาร์มา จำกัด",
            "cost_price": Decimal("2.50"),
            "selling_price": Decimal("5.00"),
            "minimum_stock": 100,
            "reorder_point": 200,
            "is_prescription_required": False,
        },
        {
            "sku": "MED002",
            "barcode": "8850123456790",
            "name_th": "อะม็อกซีซิลลิน 500 มก.",
            "name_en": "Amoxicillin 500mg",
            "generic_name": "Amoxicillin",
            "category_id": categories["CAT003"].id,
            "active_ingredient": "Amoxicillin 500mg",
            "dosage_form": DosageForm.CAPSULE,
            "strength": "500mg",
            "drug_type": DrugType.PRESCRIPTION,
            "fda_number": "1A 12/12346",
            "manufacturer": "บริษัท ไทยฟาร์มา จำกัด",
            "cost_price": Decimal("8.00"),
            "selling_price": Decimal("15.00"),
            "minimum_stock": 50,
            "reorder_point": 100,
            "is_prescription_required": True,
        },
        {
            "sku": "MED003",
            "barcode": "8850123456791",
            "name_th": "เซติริซีน 10 มก.",
            "name_en": "Cetirizine 10mg",
            "generic_name": "Cetirizine",
            "category_id": categories["CAT002"].id,
            "active_ingredient": "Cetirizine HCl 10mg",
            "dosage_form": DosageForm.TABLET,
            "strength": "10mg",
            "drug_type": DrugType.OTC,
            "fda_number": "1A 12/12347",
            "manufacturer": "บริษัท เมดิคอล ซัพพลาย จำกัด",
            "cost_price": Decimal("3.00"),
            "selling_price": Decimal("6.00"),
            "minimum_stock": 50,
            "reorder_point": 100,
            "is_prescription_required": False,
        },
        {
            "sku": "SUP001",
            "barcode": "8850123456792",
            "name_th": "วิตามินซี 1000 มก.",
            "name_en": "Vitamin C 1000mg",
            "generic_name": "Ascorbic Acid",
            "category_id": categories["CAT004"].id,
            "active_ingredient": "Ascorbic Acid 1000mg",
            "dosage_form": DosageForm.TABLET,
            "strength": "1000mg",
            "drug_type": DrugType.OTC,
            "fda_number": "1A 12/12348",
            "manufacturer": "บริษัท เมดิคอล ซัพพลาย จำกัด",
            "cost_price": Decimal("5.00"),
            "selling_price": Decimal("10.00"),
            "minimum_stock": 100,
            "reorder_point": 150,
            "is_prescription_required": False,
        },
        {
            "sku": "MED004",
            "barcode": "8850123456793",
            "name_th": "ยาแก้ไอน้ำเชื่อม 60 มล.",
            "name_en": "Cough Syrup 60ml",
            "generic_name": "Dextromethorphan",
            "category_id": categories["CAT007"].id,
            "active_ingredient": "Dextromethorphan HBr 15mg/5ml",
            "dosage_form": DosageForm.SYRUP,
            "strength": "15mg/5ml",
            "drug_type": DrugType.OTC,
            "fda_number": "1A 12/12349",
            "manufacturer": "บริษัท ไทยฟาร์มา จำกัด",
            "cost_price": Decimal("25.00"),
            "selling_price": Decimal("45.00"),
            "unit_of_measure": "bottle",
            "minimum_stock": 30,
            "reorder_point": 50,
            "is_prescription_required": False,
        },
    ]

    created_products = {}
    for prod_data in products_data:
        existing = db.query(Product).filter(Product.sku == prod_data["sku"]).first()
        if not existing:
            product = Product(**prod_data)
            db.add(product)
            created_products[prod_data["sku"]] = product
            print(f"  ✓ Created product: {prod_data['name_th']}")
        else:
            created_products[prod_data["sku"]] = existing
            print(f"  - Product exists: {prod_data['name_th']}")

    db.commit()
    return created_products


def seed_inventory_lots(db, products, warehouses, suppliers):
    """Create inventory lots"""
    print("\nCreating inventory lots...")

    main_warehouse = warehouses["WH001"]
    supplier = suppliers["SUP001"]

    lots_data = [
        {
            "product_sku": "MED001",
            "lot_number": "LOT001-2024",
            "quantity_received": 500,
            "quantity_available": 480,
            "manufacture_date": date.today() - timedelta(days=60),
            "expiry_date": date.today() + timedelta(days=730),  # 2 years
            "quality_status": QualityStatus.PASSED,
        },
        {
            "product_sku": "MED002",
            "lot_number": "LOT002-2024",
            "quantity_received": 200,
            "quantity_available": 195,
            "manufacture_date": date.today() - timedelta(days=30),
            "expiry_date": date.today() + timedelta(days=365),  # 1 year
            "quality_status": QualityStatus.PASSED,
        },
        {
            "product_sku": "MED003",
            "lot_number": "LOT003-2024",
            "quantity_received": 300,
            "quantity_available": 290,
            "manufacture_date": date.today() - timedelta(days=45),
            "expiry_date": date.today() + timedelta(days=545),  # 1.5 years
            "quality_status": QualityStatus.PASSED,
        },
        {
            "product_sku": "SUP001",
            "lot_number": "LOT004-2024",
            "quantity_received": 500,
            "quantity_available": 475,
            "manufacture_date": date.today() - timedelta(days=15),
            "expiry_date": date.today() + timedelta(days=1095),  # 3 years
            "quality_status": QualityStatus.PASSED,
        },
        {
            "product_sku": "MED004",
            "lot_number": "LOT005-2024",
            "quantity_received": 100,
            "quantity_available": 95,
            "manufacture_date": date.today() - timedelta(days=20),
            "expiry_date": date.today() + timedelta(days=20),  # Expiring soon!
            "quality_status": QualityStatus.PASSED,
        },
    ]

    for lot_data in lots_data:
        product_sku = lot_data.pop("product_sku")
        product = products.get(product_sku)

        if not product:
            continue

        existing = (
            db.query(InventoryLot).filter(InventoryLot.lot_number == lot_data["lot_number"]).first()
        )

        if not existing:
            lot = InventoryLot(
                product_id=product.id,
                warehouse_id=main_warehouse.id,
                supplier_id=supplier.id,
                received_date=date.today() - timedelta(days=30),
                quality_checked_at=datetime.now() - timedelta(days=29),
                **lot_data,
            )
            db.add(lot)
            print(f"  ✓ Created lot: {lot_data['lot_number']} for {product.name_th}")
        else:
            print(f"  - Lot exists: {lot_data['lot_number']}")

    db.commit()
    print("  ✓ Inventory lots created successfully")


def main():
    """Main seed function"""
    print("=" * 60)
    print("Starting database seeding...")
    print("=" * 60)

    db = SessionLocal()

    try:
        # Seed in order
        users = seed_users(db)
        categories = seed_categories(db)
        warehouses = seed_warehouses(db)
        suppliers = seed_suppliers(db)
        customers = seed_customers(db)
        products = seed_products(db, categories)
        seed_inventory_lots(db, products, warehouses, suppliers)

        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        print("\nLogin credentials:")
        print("  Admin:      admin@pharmacy.com / admin123")
        print("  Manager:    manager@pharmacy.com / manager123")
        print("  Pharmacist: pharmacist@pharmacy.com / pharmacist123")
        print("  Cashier:    cashier@pharmacy.com / cashier123")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
