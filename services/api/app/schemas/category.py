"""
Category schemas for request/response validation
"""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CategoryBase(BaseModel):
    """Base category schema with common fields"""

    code: str = Field(..., min_length=1, max_length=50, description="Unique category code")
    name_th: str = Field(..., min_length=1, max_length=255, description="Thai category name")
    name_en: Optional[str] = Field(None, max_length=255, description="English category name")
    description: Optional[str] = Field(None, description="Category description")
    parent_id: Optional[UUID] = Field(
        None, description="Parent category ID for hierarchical structure"
    )

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: str) -> str:
        """Validate that code contains only alphanumeric characters, hyphens, and dots"""
        allowed_chars = v.replace("-", "").replace("_", "").replace(".", "")
        if not allowed_chars.isalnum():
            raise ValueError(
                "Code must contain only alphanumeric characters, hyphens, underscores, or dots"
            )
        return v.upper()


class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""

    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category (all fields optional)"""

    code: Optional[str] = Field(None, min_length=1, max_length=50)
    name_th: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    is_active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def code_must_be_alphanumeric(cls, v: Optional[str]) -> Optional[str]:
        """Validate that code contains only alphanumeric characters, hyphens, and dots"""
        if v is not None:
            allowed_chars = v.replace("-", "").replace("_", "").replace(".", "")
            if not allowed_chars.isalnum():
                raise ValueError(
                    "Code must contain only alphanumeric characters, hyphens, underscores, or dots"
                )
            return v.upper()
        return v


class CategoryResponse(CategoryBase):
    """Schema for category response"""

    id: UUID
    is_active: bool = True
    created_at: datetime

    # Optional: include children count
    # children_count: Optional[int] = None

    model_config = {"from_attributes": True}


class CategoryTree(CategoryResponse):
    """Schema for category with children (tree structure)"""

    children: list["CategoryTree"] = []

    model_config = {"from_attributes": True}


class CategoryList(BaseModel):
    """Schema for paginated category list"""

    items: list[CategoryResponse]
    total: int
