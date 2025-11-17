"""
Customer schemas for request/response validation
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class CustomerBase(BaseModel):
    """Base customer schema with common fields"""

    code: str = Field(..., min_length=1, max_length=50, description="Unique customer code")
    name: str = Field(..., min_length=1, max_length=255, description="Customer full name")
    national_id: Optional[str] = Field(None, max_length=20, description="National ID number")
    date_of_birth: Optional[date] = Field(None, description="Date of birth")
    gender: Optional[str] = Field(None, max_length=10, description="Gender (male/female/other)")

    # Contact
    email: Optional[EmailStr] = Field(None, description="Email address")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    mobile: Optional[str] = Field(None, max_length=20, description="Mobile number")

    # Address
    address: Optional[str] = Field(None, description="Full address")
    city: Optional[str] = Field(None, max_length=100, description="City")
    province: Optional[str] = Field(None, max_length=100, description="Province")
    postal_code: Optional[str] = Field(None, max_length=10, description="Postal code")

    # Loyalty program
    membership_tier: Optional[str] = Field(
        None, max_length=50, description="Membership tier (Bronze/Silver/Gold/Platinum)"
    )

    # Medical info
    allergies: Optional[str] = Field(None, description="Known allergies")
    chronic_conditions: Optional[str] = Field(None, description="Chronic medical conditions")

    # Notes
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: str) -> str:
        """Validate that code contains only alphanumeric characters and hyphens"""
        if not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Code must contain only alphanumeric characters, hyphens, or underscores"
            )
        return v.upper()

    @field_validator("gender")
    @classmethod
    def gender_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate gender field"""
        if v is not None:
            valid_genders = ["male", "female", "other"]
            if v.lower() not in valid_genders:
                raise ValueError(f"Gender must be one of: {', '.join(valid_genders)}")
            return v.lower()
        return v

    @field_validator("membership_tier")
    @classmethod
    def tier_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate membership tier"""
        if v is not None:
            valid_tiers = ["bronze", "silver", "gold", "platinum"]
            if v.lower() not in valid_tiers:
                raise ValueError(f"Membership tier must be one of: {', '.join(valid_tiers)}")
            return v.capitalize()
        return v


class CustomerCreate(CustomerBase):
    """Schema for creating a new customer"""

    pass


class CustomerUpdate(BaseModel):
    """Schema for updating a customer (all fields optional)"""

    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    national_id: Optional[str] = Field(None, max_length=20)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=10)

    # Contact
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)

    # Address
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=10)

    # Loyalty program
    membership_tier: Optional[str] = Field(None, max_length=50)

    # Medical info
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None

    # Notes
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: Optional[str]) -> Optional[str]:
        """Validate that code contains only alphanumeric characters and hyphens"""
        if v is not None and not v.replace("-", "").replace("_", "").isalnum():
            raise ValueError(
                "Code must contain only alphanumeric characters, hyphens, or underscores"
            )
        return v.upper() if v else v

    @field_validator("gender")
    @classmethod
    def gender_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        """Validate gender field"""
        if v is not None:
            valid_genders = ["male", "female", "other"]
            if v.lower() not in valid_genders:
                raise ValueError(f"Gender must be one of: {', '.join(valid_genders)}")
            return v.lower()
        return v


class CustomerResponse(CustomerBase):
    """Schema for customer response"""

    id: UUID
    loyalty_points: int = 0
    member_since: Optional[date] = None
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CustomerList(BaseModel):
    """Schema for paginated customer list"""

    items: list[CustomerResponse]
    total: int
