from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.product import ProductResponse
from app.schemas.supplier import SupplierResponse


class QualityStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    QUARANTINE = "quarantine"
    PENDING = "pending"


class WarehouseType(str, Enum):
    MAIN = "main"
    BRANCH = "branch"
    COLD_STORAGE = "cold_storage"
    QUARANTINE = "quarantine"


class WarehouseBase(BaseModel):
    code: str
    name: str
    type: WarehouseType = WarehouseType.MAIN
    address: Optional[str] = None
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseResponse(WarehouseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryLotBase(BaseModel):
    product_id: str
    warehouse_id: str
    supplier_id: Optional[str] = None
    lot_number: str
    batch_number: Optional[str] = None
    quantity_received: int
    quantity_available: int
    quantity_reserved: int = 0
    quantity_damaged: int = 0
    manufacture_date: Optional[date] = None
    expiry_date: date
    received_date: date
    quality_status: QualityStatus = QualityStatus.PENDING
    quality_checked_at: Optional[datetime] = None
    quality_notes: Optional[str] = None


class InventoryLotCreate(InventoryLotBase):
    pass


class InventoryLotResponse(InventoryLotBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Nested relationships
    product: Optional[ProductResponse] = None
    warehouse: Optional[WarehouseResponse] = None
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True


class InventoryLotList(BaseModel):
    items: List[InventoryLotResponse]
    total: int


class ExpiringLotsResponse(BaseModel):
    items: List[InventoryLotResponse]
    expiring_in_days: int


class InventoryAdjustmentRequest(BaseModel):
    lot_id: str
    quantity_change: int
    reason: str


class InventoryAdjustmentResponse(BaseModel):
    message: str
    new_quantity: int
