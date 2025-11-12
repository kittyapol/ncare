from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


class SalesOrderItemCreate(BaseModel):
    """Schema for creating sales order item"""

    product_id: str
    quantity: int = Field(gt=0)
    unit_price: Optional[Decimal] = None  # Will be fetched from product if not provided
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    lot_id: Optional[str] = None


class SalesOrderItemResponse(BaseModel):
    """Schema for sales order item response"""

    id: str
    product_id: str
    quantity: int
    unit_price: Decimal
    discount_amount: Decimal
    line_total: Decimal
    # VAT breakdown
    vat_amount: Decimal
    price_before_vat: Decimal
    price_including_vat: Decimal
    lot_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SalesOrderCreate(BaseModel):
    """Schema for creating sales order"""

    customer_id: Optional[str] = None
    prescription_number: Optional[str] = None
    items: List[SalesOrderItemCreate]
    discount_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class SalesOrderResponse(BaseModel):
    """Schema for sales order response"""

    id: str
    order_number: str
    customer_id: Optional[str] = None
    prescription_number: Optional[str] = None
    # Financial
    subtotal: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    # Payment
    payment_method: Optional[str] = None
    payment_status: str
    paid_amount: Decimal
    change_amount: Decimal
    # Status
    status: str
    # References
    cashier_id: Optional[str] = None
    pharmacist_id: Optional[str] = None
    notes: Optional[str] = None
    # Items
    items: List[SalesOrderItemResponse] = []
    # Timestamps
    order_date: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalesOrderComplete(BaseModel):
    """Schema for completing sales order"""

    payment_method: str
    paid_amount: Decimal = Field(gt=0)
    pharmacist_id: Optional[str] = None


class SalesOrderList(BaseModel):
    """Schema for paginated sales order list"""

    items: List[SalesOrderResponse]
    total: int
    skip: int
    limit: int
