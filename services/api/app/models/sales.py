import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    PROMPTPAY = "promptpay"
    CREDIT = "credit"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    REFUNDED = "refunded"


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(100), unique=True, nullable=False, index=True)

    # Customer & References
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    prescription_number = Column(String(100))

    # Financial
    subtotal = Column(Numeric(10, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    tax_rate = Column(Numeric(5, 2), default=7.0)  # 7% VAT
    tax_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), nullable=False)

    # Payment
    payment_method = Column(Enum(PaymentMethod))
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    paid_amount = Column(Numeric(10, 2), default=0)
    change_amount = Column(Numeric(10, 2), default=0)

    # Status
    status = Column(Enum(OrderStatus), default=OrderStatus.DRAFT)

    # References
    cashier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    pharmacist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Notes
    notes = Column(String(500))

    # Timestamps
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="sales_orders")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    cashier = relationship("User", foreign_keys=[cashier_id])
    pharmacist = relationship("User", foreign_keys=[pharmacist_id])

    def __repr__(self):
        return f"<SalesOrder {self.order_number}>"


class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    lot_id = Column(UUID(as_uuid=True), ForeignKey("inventory_lots.id"))

    # Quantities & Pricing
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    line_total = Column(Numeric(10, 2), nullable=False)

    # VAT Breakdown for Tax Reporting
    vat_amount = Column(Numeric(10, 2), default=0)
    price_before_vat = Column(Numeric(10, 2), default=0)
    price_including_vat = Column(Numeric(10, 2), default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="items")
    product = relationship("Product")
    lot = relationship("InventoryLot")

    def __repr__(self):
        return f"<SalesOrderItem {self.product_id}>"
