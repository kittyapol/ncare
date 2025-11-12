import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class DosageForm(str, enum.Enum):
    TABLET = "tablet"
    CAPSULE = "capsule"
    SYRUP = "syrup"
    INJECTION = "injection"
    CREAM = "cream"
    OINTMENT = "ointment"
    DROPS = "drops"
    POWDER = "powder"
    SUPPOSITORY = "suppository"


class DrugType(str, enum.Enum):
    PRESCRIPTION = "prescription"
    OTC = "otc"
    CONTROLLED = "controlled"
    DANGEROUS = "dangerous"


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name_th = Column(String(255), nullable=False)
    name_en = Column(String(255))
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    parent = relationship("Category", remote_side=[id], backref="children")
    products = relationship("Product", back_populates="category")

    def __repr__(self):
        return f"<Category {self.name_th}>"


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    barcode = Column(String(100), unique=True, index=True)

    # Names
    name_th = Column(String(255), nullable=False)
    name_en = Column(String(255))
    generic_name = Column(String(255))
    description = Column(Text)

    # Category
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))

    # Pharmaceutical details
    active_ingredient = Column(String(500))
    dosage_form = Column(Enum(DosageForm))
    strength = Column(String(100))  # e.g., "500mg"
    drug_type = Column(Enum(DrugType), default=DrugType.OTC)
    fda_number = Column(String(100))
    manufacturer = Column(String(255))

    # Pricing
    cost_price = Column(Numeric(10, 2), nullable=False, default=0)
    selling_price = Column(Numeric(10, 2), nullable=False, default=0)

    # VAT (Value Added Tax) - Thailand Tax Compliance
    is_vat_applicable = Column(Boolean, default=True)
    vat_rate = Column(Numeric(5, 2), default=7.00)  # Thailand standard VAT rate is 7%
    vat_category = Column(String(50), default='standard')  # standard, exempt, zero-rated

    # Stock management
    unit_of_measure = Column(String(50), default="unit")
    minimum_stock = Column(Integer, default=0)
    reorder_point = Column(Integer, default=0)

    # Flags
    is_prescription_required = Column(Boolean, default=False)
    is_controlled_substance = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_serialized = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")
    inventory_lots = relationship("InventoryLot", back_populates="product")

    def __repr__(self):
        return f"<Product {self.sku} - {self.name_th}>"
