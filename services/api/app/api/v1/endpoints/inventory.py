from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.inventory import InventoryLot
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.inventory import (
    InventoryLotList,
    InventoryLotResponse,
    ExpiringLotsResponse,
    InventoryAdjustmentResponse,
)

router = APIRouter()


@router.get("/", response_model=InventoryLotList)
def get_inventory_lots(
    skip: int = 0,
    limit: int = 100,
    product_id: str = None,
    warehouse_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all inventory lots"""
    query = db.query(InventoryLot)

    if product_id:
        query = query.filter(InventoryLot.product_id == product_id)

    if warehouse_id:
        query = query.filter(InventoryLot.warehouse_id == warehouse_id)

    total = query.count()
    lots = query.offset(skip).limit(limit).all()

    return InventoryLotList(
        items=[InventoryLotResponse.model_validate(lot) for lot in lots], total=total
    )


@router.get("/expiring", response_model=ExpiringLotsResponse)
def get_expiring_lots(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get lots expiring within specified days"""
    expiry_threshold = datetime.now().date() + timedelta(days=days)

    lots = (
        db.query(InventoryLot)
        .filter(
            InventoryLot.expiry_date <= expiry_threshold,
            InventoryLot.quantity_available > 0,
        )
        .all()
    )

    return ExpiringLotsResponse(
        items=[InventoryLotResponse.model_validate(lot) for lot in lots],
        expiring_in_days=days,
    )


@router.post("/adjust", response_model=InventoryAdjustmentResponse)
def adjust_inventory(
    lot_id: str,
    quantity_change: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Adjust inventory quantity"""
    lot = db.query(InventoryLot).filter(InventoryLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Inventory lot not found")

    new_quantity = lot.quantity_available + quantity_change
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient inventory")

    lot.quantity_available = new_quantity
    db.commit()

    return InventoryAdjustmentResponse(
        message="Inventory adjusted", new_quantity=new_quantity
    )
