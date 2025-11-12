from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class PurchaseOrderItemBase(BaseModel):
    product_id: str
    quantity_ordered: int
    unit_price: Decimal
    discount_amount: Decimal = Decimal("0.00")
    line_total: Decimal
    notes: Optional[str] = None


class PurchaseOrderItemCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: Decimal


class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: str
    purchase_order_id: str
    quantity_received: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: str
    order_date: date
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    terms_and_conditions: Optional[str] = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: str
    items: List[PurchaseOrderItemCreate]
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: str
    po_number: str
    subtotal: Decimal
    discount_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")
    shipping_cost: Decimal = Decimal("0.00")
    total_amount: Decimal
    status: PurchaseOrderStatus
    actual_delivery_date: Optional[date] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PurchaseOrderList(BaseModel):
    items: List[PurchaseOrderResponse]
    total: int


class ReceiveItemData(BaseModel):
    product_id: str
    quantity: int
    lot_number: str
    manufacture_date: Optional[date] = None
    expiry_date: date


class ReceivePurchaseOrderRequest(BaseModel):
    warehouse_id: str
    items: List[ReceiveItemData]


class ReceivePurchaseOrderResponse(BaseModel):
    message: str
