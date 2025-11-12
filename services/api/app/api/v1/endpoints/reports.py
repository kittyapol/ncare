from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.sales import SalesOrder, OrderStatus
from app.models.inventory import InventoryLot
from app.models.product import Product
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/dashboard-summary")
def get_dashboard_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    """Get dashboard summary statistics"""
    # Today's sales
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_sales = (
        db.query(func.sum(SalesOrder.total_amount))
        .filter(
            SalesOrder.order_date >= today_start,
            SalesOrder.status == OrderStatus.COMPLETED,
        )
        .scalar()
        or 0
    )

    # Total products
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # Low stock items
    low_stock = (
        db.query(Product)
        .join(InventoryLot)
        .filter(InventoryLot.quantity_available <= Product.minimum_stock)
        .count()
    )

    # Expiring soon (30 days)
    expiring_threshold = datetime.now().date() + timedelta(days=30)
    expiring_items = (
        db.query(InventoryLot)
        .filter(
            InventoryLot.expiry_date <= expiring_threshold,
            InventoryLot.quantity_available > 0,
        )
        .count()
    )

    return {
        "today_sales": float(today_sales),
        "total_products": total_products,
        "low_stock_items": low_stock,
        "expiring_items": expiring_items,
    }


@router.get("/sales-report")
def get_sales_report(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get sales report for date range"""
    sales = (
        db.query(SalesOrder)
        .filter(
            SalesOrder.order_date >= start_date,
            SalesOrder.order_date <= end_date,
            SalesOrder.status == OrderStatus.COMPLETED,
        )
        .all()
    )

    total_sales = sum(float(order.total_amount) for order in sales)
    total_orders = len(sales)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_sales": total_sales,
        "total_orders": total_orders,
        "average_order_value": total_sales / total_orders if total_orders > 0 else 0,
        "orders": sales,
    }


@router.get("/inventory-report")
def get_inventory_report(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    """Get inventory summary report"""
    # Total inventory value
    inventory_value = (
        db.query(
            func.sum(InventoryLot.quantity_available * Product.cost_price)
        )
        .join(Product)
        .scalar()
        or 0
    )

    # Products by category
    # This would need more complex query with categories

    return {
        "total_inventory_value": float(inventory_value),
        "total_lots": db.query(InventoryLot).count(),
    }


@router.get("/expiry-report")
def get_expiry_report(
    days: int = Query(default=90, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get expiry report"""
    expiry_threshold = datetime.now().date() + timedelta(days=days)

    expiring_lots = (
        db.query(InventoryLot)
        .join(Product)
        .filter(
            InventoryLot.expiry_date <= expiry_threshold,
            InventoryLot.quantity_available > 0,
        )
        .all()
    )

    return {"expiring_within_days": days, "items": expiring_lots}
