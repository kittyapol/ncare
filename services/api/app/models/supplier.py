import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)

    # Company info
    name_th = Column(String(255), nullable=False)
    name_en = Column(String(255))
    tax_id = Column(String(20), unique=True)

    # Contact
    contact_person = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    fax = Column(String(20))
    mobile = Column(String(20))

    # Address
    address = Column(Text)
    city = Column(String(100))
    province = Column(String(100))
    postal_code = Column(String(10))
    country = Column(String(100), default="Thailand")

    # Business terms
    payment_terms = Column(String(100))  # e.g., "Net 30"
    credit_limit = Column(String(100))
    discount_terms = Column(String(100))

    # Status
    is_active = Column(Boolean, default=True)
    rating = Column(String(10))  # A, B, C

    # Notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    inventory_lots = relationship("InventoryLot", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier {self.code} - {self.name_th}>"
