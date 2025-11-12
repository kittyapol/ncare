"""
Categories API endpoints
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_manager_or_admin
from app.models.product import Category
from app.models.user import User

router = APIRouter()


@router.get("/")
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get all categories"""
    categories = db.query(Category).filter(Category.is_active == True).offset(skip).limit(limit).all()
    return {"items": categories, "total": len(categories)}


@router.post("/")
def create_category(
    category_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Create new category"""
    # Check if code exists
    existing = db.query(Category).filter(Category.code == category_data.get("code")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists")

    category = Category(**category_data)
    db.add(category)
    db.commit()
    db.refresh(category)

    return category


@router.get("/{category_id}")
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
