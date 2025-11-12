"""
Categories API endpoints
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, get_manager_or_admin
from app.models.product import Category
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryList,
    CategoryResponse,
    CategoryUpdate,
)

router = APIRouter()


@router.get("/", response_model=CategoryList)
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get all categories"""
    query = db.query(Category).filter(Category.is_active)
    total = query.count()
    categories = query.offset(skip).limit(limit).all()
    return {"items": categories, "total": total}


@router.post("/", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Create new category"""
    # Check if code exists
    existing = db.query(Category).filter(Category.code == category_data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists")

    # Validate parent_id if provided
    if category_data.parent_id:
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")

    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get category by ID"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Update category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Only update fields that were provided
    update_data = category_data.model_dump(exclude_unset=True)

    # Validate parent_id if provided
    if "parent_id" in update_data and update_data["parent_id"]:
        # Prevent circular reference
        if str(update_data["parent_id"]) == str(category_id):
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")

        parent = db.query(Category).filter(Category.id == update_data["parent_id"]).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")

    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Delete (deactivate) category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category has children
    children = db.query(Category).filter(Category.parent_id == category_id).count()
    if children > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with subcategories. Please delete subcategories first or move them to another parent.",
        )

    # Soft delete
    category.is_active = False
    db.commit()

    return {"message": "Category deleted successfully"}
