from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.sales import SalesOrder, SalesOrderItem, OrderStatus, PaymentStatus
from app.models.inventory import InventoryLot
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/orders/")
def get_sales_orders(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all sales orders"""
    query = db.query(SalesOrder)

    if status:
        query = query.filter(SalesOrder.status == status)

    total = query.count()
    orders = query.offset(skip).limit(limit).all()

    return {"items": orders, "total": total}


@router.post("/orders/")
def create_sales_order(
    order_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create new sales order"""
    # Generate order number
    order_number = f"SO-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Create order
    order = SalesOrder(
        order_number=order_number,
        customer_id=order_data.get("customer_id"),
        cashier_id=current_user.id,
        subtotal=0,
        tax_amount=0,
        total_amount=0,
        status=OrderStatus.DRAFT,
        payment_status=PaymentStatus.PENDING,
    )

    # Calculate totals
    subtotal = 0
    items = []

    for item_data in order_data.get("items", []):
        # Validate inventory
        lot = (
            db.query(InventoryLot)
            .filter(InventoryLot.product_id == item_data["product_id"])
            .filter(InventoryLot.quantity_available >= item_data["quantity"])
            .first()
        )

        if not lot:
            raise HTTPException(status_code=400, detail="Insufficient inventory")

        line_total = item_data["quantity"] * item_data["unit_price"]
        subtotal += line_total

        item = SalesOrderItem(
            product_id=item_data["product_id"],
            lot_id=lot.id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=line_total,
        )
        items.append(item)

        # Reserve inventory
        lot.quantity_reserved += item_data["quantity"]
        lot.quantity_available -= item_data["quantity"]

    # Calculate tax and total
    order.subtotal = subtotal
    order.tax_amount = subtotal * (order_data.get("tax_rate", 7) / 100)
    order.total_amount = order.subtotal + order.tax_amount

    db.add(order)
    db.flush()

    # Add items
    for item in items:
        item.sales_order_id = order.id
        db.add(item)

    db.commit()
    db.refresh(order)

    return order


@router.post("/orders/{order_id}/complete")
def complete_sales_order(
    order_id: str,
    payment_method: str,
    paid_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Complete sales order"""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order already completed")

    order.payment_method = payment_method
    order.paid_amount = paid_amount
    order.change_amount = paid_amount - float(order.total_amount)
    order.payment_status = PaymentStatus.PAID
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.now()

    db.commit()

    return {"message": "Order completed", "change": order.change_amount}
