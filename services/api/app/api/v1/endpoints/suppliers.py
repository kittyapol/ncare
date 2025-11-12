"""
Suppliers API endpoints
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db, get_manager_or_admin
from app.models.supplier import Supplier
from app.models.user import User

router = APIRouter()


@router.get("/")
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get all suppliers"""
    query = db.query(Supplier)

    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)

    total = query.count()
    suppliers = query.offset(skip).limit(limit).all()

    return {"items": suppliers, "total": total}


@router.post("/")
def create_supplier(
    supplier_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Create new supplier"""
    # Check if code exists
    existing = db.query(Supplier).filter(Supplier.code == supplier_data.get("code")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier code already exists")

    supplier = Supplier(**supplier_data)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    return supplier


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get supplier by ID"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: str,
    supplier_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_admin),
) -> Any:
    """Update supplier"""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in supplier_data.items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)

    return supplier
