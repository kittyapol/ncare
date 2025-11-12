import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Integer,
    Date,
    Enum,
    Boolean,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class QualityStatus(str, enum.Enum):
    PASSED = "passed"
    FAILED = "failed"
    QUARANTINE = "quarantine"
    PENDING = "pending"


class WarehouseType(str, enum.Enum):
    MAIN = "main"
    BRANCH = "branch"
    COLD_STORAGE = "cold_storage"
    QUARANTINE = "quarantine"


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(WarehouseType), default=WarehouseType.MAIN)
    address = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    inventory_lots = relationship("InventoryLot", back_populates="warehouse")

    def __repr__(self):
        return f"<Warehouse {self.code}>"


class InventoryLot(Base):
    __tablename__ = "inventory_lots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"))

    # Lot details
    lot_number = Column(String(100), nullable=False, index=True)
    batch_number = Column(String(100))

    # Quantities
    quantity_received = Column(Integer, nullable=False)
    quantity_available = Column(Integer, nullable=False)
    quantity_reserved = Column(Integer, default=0)
    quantity_damaged = Column(Integer, default=0)

    # Cost tracking (สำคัญ: ต้นทุนจริงต่อหน่วยเมื่อรับของ)
    unit_cost = Column(Numeric(10, 2), nullable=False, default=0.00)

    # Dates
    manufacture_date = Column(Date)
    expiry_date = Column(Date, nullable=False, index=True)
    received_date = Column(Date, nullable=False)

    # Quality
    quality_status = Column(Enum(QualityStatus), default=QualityStatus.PENDING)
    quality_checked_at = Column(DateTime(timezone=True))
    quality_notes = Column(String(500))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product", back_populates="inventory_lots")
    warehouse = relationship("Warehouse", back_populates="inventory_lots")
    supplier = relationship("Supplier", back_populates="inventory_lots")

    def __repr__(self):
        return f"<InventoryLot {self.lot_number} - {self.product_id}>"
