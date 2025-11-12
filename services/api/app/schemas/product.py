from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal


class ProductBase(BaseModel):
    sku: str
    barcode: Optional[str] = None
    name_th: str
    name_en: Optional[str] = None
    generic_name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    active_ingredient: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    drug_type: Optional[str] = "otc"
    fda_number: Optional[str] = None
    manufacturer: Optional[str] = None
    cost_price: Decimal = Field(default=Decimal("0.00"))
    selling_price: Decimal = Field(default=Decimal("0.00"))
    # VAT (Value Added Tax) fields for Thailand tax compliance
    is_vat_applicable: bool = True
    vat_rate: Decimal = Field(default=Decimal("7.00"))
    vat_category: str = "standard"
    unit_of_measure: str = "unit"
    minimum_stock: int = 0
    reorder_point: int = 0
    is_prescription_required: bool = False
    is_controlled_substance: bool = False
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name_th: Optional[str] = None
    name_en: Optional[str] = None
    generic_name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    active_ingredient: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    drug_type: Optional[str] = None
    fda_number: Optional[str] = None
    manufacturer: Optional[str] = None
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    is_vat_applicable: Optional[bool] = None
    vat_rate: Optional[Decimal] = None
    vat_category: Optional[str] = None
    minimum_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    is_prescription_required: Optional[bool] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductList(BaseModel):
    items: List[ProductResponse]
    total: int
    skip: int
    limit: int
