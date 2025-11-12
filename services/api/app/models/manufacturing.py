import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ManufacturingStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ManufacturingOrder(Base):
    __tablename__ = "manufacturing_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    mo_number = Column(String(100), unique=True, nullable=False, index=True)

    # Product to manufacture
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    # Quantities
    quantity_to_produce = Column(Integer, nullable=False)
    quantity_produced = Column(Integer, default=0)

    # Batch info
    batch_number = Column(String(100), unique=True)
    lot_number = Column(String(100))

    # Status
    status = Column(Enum(ManufacturingStatus), default=ManufacturingStatus.DRAFT)
    quality_status = Column(String(50))

    # References
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"))

    # Dates
    scheduled_start_date = Column(DateTime(timezone=True))
    scheduled_end_date = Column(DateTime(timezone=True))
    actual_start_date = Column(DateTime(timezone=True))
    actual_end_date = Column(DateTime(timezone=True))

    # Notes
    notes = Column(Text)
    quality_notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    product = relationship("Product")
    supervisor = relationship("User")
    warehouse = relationship("Warehouse")
    bom_items = relationship("BillOfMaterials", back_populates="manufacturing_order")

    def __repr__(self):
        return f"<ManufacturingOrder {self.mo_number}>"


class BillOfMaterials(Base):
    """Bill of Materials - Components needed for manufacturing"""

    __tablename__ = "bill_of_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manufacturing_order_id = Column(UUID(as_uuid=True), ForeignKey("manufacturing_orders.id"))

    # Component details
    component_product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity_required = Column(Numeric(10, 2), nullable=False)
    quantity_consumed = Column(Numeric(10, 2), default=0)

    # Unit
    unit_of_measure = Column(String(50))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    manufacturing_order = relationship("ManufacturingOrder", back_populates="bom_items")
    component_product = relationship("Product")

    def __repr__(self):
        return f"<BillOfMaterials {self.component_product_id}>"
