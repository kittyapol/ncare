import enum
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    po_number = Column(String(100), unique=True, nullable=False, index=True)

    # Supplier
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)

    # Financial
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(12, 2), default=0)
    tax_amount = Column(Numeric(12, 2), default=0)
    shipping_cost = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)

    # Status
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.DRAFT)

    # Dates
    order_date = Column(Date, nullable=False)
    expected_delivery_date = Column(Date)
    actual_delivery_date = Column(Date)

    # References
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Notes
    notes = Column(Text)
    terms_and_conditions = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship(
        "PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan"
    )
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<PurchaseOrder {self.po_number}>"


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    # Quantities
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0)

    # Pricing
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    line_total = Column(Numeric(12, 2), nullable=False)

    # VAT Breakdown (สำหรับบัญชีและภาษีซื้อ)
    is_vat_included = Column(Boolean, default=True)  # ราคารวม VAT หรือไม่
    vat_rate = Column(Numeric(5, 2), default=7.00)  # อัตรา VAT %
    vat_amount = Column(Numeric(10, 2), default=0)  # จำนวน VAT
    price_before_vat = Column(Numeric(10, 2), default=0)  # ราคาก่อน VAT
    price_including_vat = Column(Numeric(10, 2), default=0)  # ราคารวม VAT

    # Notes
    notes = Column(String(500))

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

    def __repr__(self):
        return f"<PurchaseOrderItem {self.product_id}>"
