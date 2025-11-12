"""
Customers API endpoints
"""
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_active_user
from app.models.customer import Customer
from app.models.user import User

router = APIRouter()


@router.get("/")
def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get all customers"""
    query = db.query(Customer).filter(Customer.is_active == True)

    if search:
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.code.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    customers = query.offset(skip).limit(limit).all()

    return {"items": customers, "total": total}


@router.post("/")
def create_customer(
    customer_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Create new customer"""
    # Check if code exists
    existing = db.query(Customer).filter(Customer.code == customer_data.get("code")).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer code already exists")

    customer = Customer(**customer_data)
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


@router.get("/search")
def search_customers(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Quick search customers"""
    customers = (
        db.query(Customer)
        .filter(
            Customer.is_active == True,
            or_(
                Customer.name.ilike(f"%{q}%"),
                Customer.code.ilike(f"%{q}%"),
                Customer.phone.ilike(f"%{q}%"),
            ),
        )
        .limit(limit)
        .all()
    )

    return customers


@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get customer by ID"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}")
def update_customer(
    customer_id: str,
    customer_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update customer"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in customer_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return customer


@router.post("/{customer_id}/loyalty-points")
def update_loyalty_points(
    customer_id: str,
    points_change: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Update customer loyalty points"""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.loyalty_points += points_change
    if customer.loyalty_points < 0:
        customer.loyalty_points = 0

    db.commit()

    return {"message": "Loyalty points updated", "new_balance": customer.loyalty_points}
