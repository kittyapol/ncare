"""
Seed script for pharmacy product categories
Thai pharmacy-specific category structure with hierarchical organization
"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models.product import Base, Category

# Category structure for Thai pharmacy
PHARMACY_CATEGORIES = [
    # 1. Respiratory System
    {
        "code": "CAT-01",
        "name_th": "กลุ่มยาระบบทางเดินหายใจ",
        "name_en": "Respiratory System Drugs",
        "description": "ยาสำหรับรักษาโรคทางเดินหายใจ เช่น ไอ หวัด หอบหืด",
        "children": [],
    },
    # 2. Allergy
    {
        "code": "CAT-02",
        "name_th": "กลุ่มยาโรคภูมิแพ้",
        "name_en": "Allergy Medications",
        "description": "ยาแก้แพ้ ลมพิษ แพ้อากาศ",
        "children": [],
    },
    # 3. Digestive System
    {
        "code": "CAT-03",
        "name_th": "กลุ่มยาระบบทางเดินอาหาร",
        "name_en": "Digestive System Drugs",
        "description": "ยาสำหรับระบบทางเดินอาหาร เช่น แก้ท้องเสีย ท้องผูก กรดไหลย้อน",
        "children": [],
    },
    # 4. Central Nervous System
    {
        "code": "CAT-04",
        "name_th": "กลุ่มยาระบบประสาทส่วนกลาง",
        "name_en": "Central Nervous System Drugs",
        "description": "ยานอนหลับ ยาคลายกังวล ยาแก้ซึมเศร้า",
        "children": [],
    },
    # 5. Urinary and Reproductive System
    {
        "code": "CAT-05",
        "name_th": "กลุ่มยาระบบทางเดินปัสสาวะและสืบพันธุ์",
        "name_en": "Urinary and Reproductive System Drugs",
        "description": "ยาสำหรับระบบทางเดินปัสสาวะและสืบพันธุ์",
        "children": [],
    },
    # 6. Antibiotics and Antimicrobials
    {
        "code": "CAT-06",
        "name_th": "กลุ่มยาฆ่าเชื้อ",
        "name_en": "Antibiotics and Antimicrobials",
        "description": "ยาปฏิชีวนะและยาต้านเชื้อ",
        "children": [
            {
                "code": "CAT-06.1",
                "name_th": "ยาฆ่าเชื้อแบคทีเรีย",
                "name_en": "Antibacterial Drugs",
                "description": "ยาปฏิชีวนะ Amoxicillin, Ciprofloxacin, etc.",
            },
            {
                "code": "CAT-06.2",
                "name_th": "ยาต้านไวรัส",
                "name_en": "Antiviral Drugs",
                "description": "ยาต้านไวรัส Oseltamivir, Acyclovir, etc.",
            },
            {
                "code": "CAT-06.3",
                "name_th": "ยาต้านเชื้อรา",
                "name_en": "Antifungal Drugs",
                "description": "ยาต้านเชื้อรา Fluconazole, Ketoconazole, etc.",
            },
        ],
    },
    # 7. Eye, Ear, and Throat
    {
        "code": "CAT-07",
        "name_th": "กลุ่มยา ตา หู และ คอ",
        "name_en": "Eye, Ear, and Throat Medications",
        "description": "ยาหยอดตา ยาหยอดหู ยาอม",
        "children": [],
    },
    # 8. Contraceptives and Vaginal Products
    {
        "code": "CAT-08",
        "name_th": "ยาคุมกำเนิด และช่องคลอด",
        "name_en": "Contraceptives and Vaginal Products",
        "description": "ยาคุมกำเนิด ยาทางช่องคลอด",
        "children": [],
    },
    # 9. Pain Relief and Fever Reducers
    {
        "code": "CAT-09",
        "name_th": "กลุ่มยาแก้ปวด ลดไข้",
        "name_en": "Pain Relief and Antipyretics",
        "description": "ยาแก้ปวด ลดไข้ Paracetamol, Ibuprofen, etc.",
        "children": [],
    },
    # 10. Musculoskeletal System
    {
        "code": "CAT-10",
        "name_th": "กลุ่มยาระบบกล้ามเนื้อ และกระดูก",
        "name_en": "Musculoskeletal System Drugs",
        "description": "ยาบำรุงกระดูก ยาคลายกล้ามเนื้อ แคลเซียม",
        "children": [],
    },
    # 11. Oral and Dental
    {
        "code": "CAT-11",
        "name_th": "กลุ่มยาช่องปาก และ ฟัน",
        "name_en": "Oral and Dental Products",
        "description": "ยาบ้วนปาก ยาสีฟัน แผ่นแปะแผลในปาก",
        "children": [],
    },
    # 12. Dermatological
    {
        "code": "CAT-12",
        "name_th": "กลุ่มยาทาผิวหนัง",
        "name_en": "Dermatological Products",
        "description": "ยาทาผิว ครีม โลชั่น สำหรับรักษาโรคผิวหนัง",
        "children": [],
    },
    # 13. Cosmetics and Beauty
    {
        "code": "CAT-13",
        "name_th": "กลุ่ม ผิว ผม เล็บ และความงาม",
        "name_en": "Cosmetics and Beauty Products",
        "description": "ผลิตภัณฑ์บำรุงผิว ผม เล็บ และเครื่องสำอาง",
        "children": [],
    },
    # 14. Pediatric Products
    {
        "code": "CAT-14",
        "name_th": "กลุ่มยาน้ำเด็ก",
        "name_en": "Pediatric Products",
        "description": "ยาสำหรับเด็ก ยาน้ำเด็ก วิตามินเด็ก",
        "children": [],
    },
    # 15. Chronic Disease Management
    {
        "code": "CAT-15",
        "name_th": "กลุ่มยาโรคเรื้อรัง",
        "name_en": "Chronic Disease Management",
        "description": "ยาสำหรับโรคเรื้อรัง เบาหวาน ความดัน หัวใจ",
        "children": [
            {
                "code": "CAT-15.1",
                "name_th": "ยาหลอดเลือดและหัวใจ",
                "name_en": "Cardiovascular Drugs",
                "description": "ยาความดัน ยาหัวใจ ยาลดไขมัน",
            },
            {
                "code": "CAT-15.2",
                "name_th": "ยาต่อมไร้ท่อและเมตาบอลิซึม",
                "name_en": "Endocrine and Metabolic Drugs",
                "description": "ยาเบาหวาน ยาไทรอยด์ ฮอร์โมน",
            },
        ],
    },
    # 16. Controlled Substances
    {
        "code": "CAT-16",
        "name_th": "ยาควบคุมพิเศษ",
        "name_en": "Controlled Substances",
        "description": "ยาที่อยู่ในบัญชียาเสพติดให้โทษและยาควบคุมพิเศษ",
        "children": [],
    },
    # 17. Traditional and Herbal Medicine
    {
        "code": "CAT-17",
        "name_th": "ยาแผนโบราณและสมุนไพร",
        "name_en": "Traditional and Herbal Medicine",
        "description": "ยาแผนโบราณ ยาสมุนไพร จากธรรมชาติ",
        "children": [],
    },
    # 18. Dietary Supplements and Nutrition
    {
        "code": "CAT-18",
        "name_th": "ผลิตภัณฑ์อาหารเสริม และโภชนาการ",
        "name_en": "Dietary Supplements and Nutrition",
        "description": "อาหารเสริม วิตามิน แร่ธาตุ โปรตีน",
        "children": [],
    },
    # 19. Medical Devices
    {
        "code": "CAT-19",
        "name_th": "อุปกรณ์การแพทย์",
        "name_en": "Medical Devices",
        "description": "เครื่องวัดความดัน เครื่องวัดน้ำตาล หน้ากากอนามัย",
        "children": [],
    },
    # 20. First Aid
    {
        "code": "CAT-20",
        "name_th": "ปฐมพยาบาล",
        "name_en": "First Aid Products",
        "description": "ผ้าพันแผล แอลกอฮอล์ ผลิตภัณฑ์ปฐมพยาบาล",
        "children": [],
    },
]


def seed_categories(db: Session):
    """Seed pharmacy categories into database"""
    print("🌱 Starting to seed pharmacy categories...")

    # Check if categories already exist
    existing_count = db.query(Category).count()
    if existing_count > 0:
        print(f"⚠️  Found {existing_count} existing categories. Skipping seed.")
        print("   To re-seed, please truncate the categories table first.")
        return

    total_created = 0

    for cat_data in PHARMACY_CATEGORIES:
        # Create parent category
        parent_category = Category(
            code=cat_data["code"],
            name_th=cat_data["name_th"],
            name_en=cat_data.get("name_en"),
            description=cat_data.get("description"),
            is_active=True,
        )
        db.add(parent_category)
        db.flush()  # Flush to get the ID
        total_created += 1

        print(f"✅ Created: {cat_data['code']} - {cat_data['name_th']}")

        # Create child categories if any
        if cat_data.get("children"):
            for child_data in cat_data["children"]:
                child_category = Category(
                    code=child_data["code"],
                    name_th=child_data["name_th"],
                    name_en=child_data.get("name_en"),
                    description=child_data.get("description"),
                    parent_id=parent_category.id,  # Link to parent
                    is_active=True,
                )
                db.add(child_category)
                total_created += 1

                print(f"  ↳ {child_data['code']} - {child_data['name_th']}")

    db.commit()
    print(f"\n🎉 Successfully created {total_created} categories!")
    print(f"   - {len(PHARMACY_CATEGORIES)} parent categories")
    print(f"   - {total_created - len(PHARMACY_CATEGORIES)} subcategories")


def main():
    """Main function to run the seed script"""
    print("=" * 60)
    print("Pharmacy Category Seed Script")
    print("=" * 60)

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Create database session
    db = SessionLocal()

    try:
        seed_categories(db)
    except Exception as e:
        print(f"\n❌ Error occurred: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

    print("\n✨ Seed script completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
