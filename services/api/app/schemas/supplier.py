"""
Supplier schemas for request/response validation
"""

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class SupplierBase(BaseModel):
    """Base supplier schema with common fields"""

    code: str = Field(..., min_length=1, max_length=50, description="Unique supplier code")
    name_th: str = Field(..., min_length=1, max_length=255, description="Thai company name")
    name_en: Optional[str] = Field(None, max_length=255, description="English company name")
    tax_id: Optional[str] = Field(None, max_length=20, description="Tax ID (13 digits)")

    # Contact
    contact_person: Optional[str] = Field(None, max_length=255, description="Contact person name")
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    fax: Optional[str] = Field(None, max_length=20, description="Fax number")
    mobile: Optional[str] = Field(None, max_length=20, description="Mobile number")

    # Address
    address: Optional[str] = Field(None, description="Full address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    province: Optional[str] = Field(None, max_length=100, description="Province")
    postal_code: Optional[str] = Field(None, max_length=10, description="Postal code")
    country: str = Field(default="Thailand", max_length=100, description="Country")

    # Business terms
    payment_terms: Optional[str] = Field(None, max_length=100, description="Payment terms (e.g., Net 30)")
    credit_limit: Optional[str] = Field(None, max_length=100, description="Credit limit")
    discount_terms: Optional[str] = Field(None, max_length=100, description="Discount terms")

    # Rating
    rating: Optional[str] = Field(None, max_length=10, description="Supplier rating (A/B/C)")

    # Notes
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: str) -> str:
        """Validate that code contains only alphanumeric characters and hyphens"""
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Code must contain only alphanumeric characters, hyphens, or underscores")
        return v.upper()

    @field_validator("tax_id")
    @classmethod
    def tax_id_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate Thai tax ID (13 digits)"""
        if v is not None:
            # Remove any spaces or hyphens
            clean_tax_id = v.replace(" ", "").replace("-", "")
            if not clean_tax_id.isdigit():
                raise ValueError("Tax ID must contain only digits")
            if len(clean_tax_id) != 13:
                raise ValueError("Tax ID must be exactly 13 digits")
            return clean_tax_id
        return v

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate supplier rating"""
        if v is not None:
            valid_ratings = ["A", "B", "C"]
            v_upper = v.upper()
            if v_upper not in valid_ratings:
                raise ValueError(f"Rating must be one of: {', '.join(valid_ratings)}")
            return v_upper
        return v


class SupplierCreate(SupplierBase):
    """Schema for creating a new supplier"""

    pass


class SupplierUpdate(BaseModel):
    """Schema for updating a supplier (all fields optional)"""

    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name_th: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None, max_length=20)

    # Contact
    contact_person: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    fax: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)

    # Address
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)
    country: Optional[str] = Field(None, max_length=100)

    # Business terms
    payment_terms: Optional[str] = Field(None, max_length=100)
    credit_limit: Optional[str] = Field(None, max_length=100)
    discount_terms: Optional[str] = Field(None, max_length=100)

    # Rating
    rating: Optional[str] = Field(None, max_length=10)

    # Notes
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: Optional[str]) -> Optional[str]:
        """Validate that code contains only alphanumeric characters and hyphens"""
        if v is not None and not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError("Code must contain only alphanumeric characters, hyphens, or underscores")
        return v.upper() if v else v

    @field_validator("tax_id")
    @classmethod
    def tax_id_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate Thai tax ID (13 digits)"""
        if v is not None:
            # Remove any spaces or hyphens
            clean_tax_id = v.replace(" ", "").replace("-", "")
            if not clean_tax_id.isdigit():
                raise ValueError("Tax ID must contain only digits")
            if len(clean_tax_id) != 13:
                raise ValueError("Tax ID must be exactly 13 digits")
            return clean_tax_id
        return v

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate supplier rating"""
        if v is not None:
            valid_ratings = ["A", "B", "C"]
            v_upper = v.upper()
            if v_upper not in valid_ratings:
                raise ValueError(f"Rating must be one of: {', '.join(valid_ratings)}")
            return v_upper
        return v


class SupplierResponse(SupplierBase):
    """Schema for supplier response"""

    id: UUID
    is_active: bool = True
    created_at: date
    updated_at: Optional[date] = None

    model_config = {"from_attributes": True}


class SupplierList(BaseModel):
    """Schema for paginated supplier list"""

    items: list[SupplierResponse]
    total: int
