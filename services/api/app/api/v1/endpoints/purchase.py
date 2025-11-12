from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date

from app.core.database import get_db
from app.models.purchase import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.inventory import InventoryLot, QualityStatus
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/orders/")
def get_purchase_orders(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all purchase orders"""
    query = db.query(PurchaseOrder)

    if status:
        query = query.filter(PurchaseOrder.status == status)

    total = query.count()
    orders = query.offset(skip).limit(limit).all()

    return {"items": orders, "total": total}


@router.post("/orders/")
def create_purchase_order(
    order_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create new purchase order"""
    # Generate PO number
    po_number = f"PO-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Create order
    order = PurchaseOrder(
        po_number=po_number,
        supplier_id=order_data["supplier_id"],
        order_date=date.today(),
        expected_delivery_date=order_data.get("expected_delivery_date"),
        created_by=current_user.id,
        status=PurchaseOrderStatus.DRAFT,
        subtotal=0,
        total_amount=0,
    )

    # Calculate totals
    subtotal = 0
    items = []

    for item_data in order_data.get("items", []):
        line_total = item_data["quantity"] * item_data["unit_price"]
        subtotal += line_total

        item = PurchaseOrderItem(
            product_id=item_data["product_id"],
            quantity_ordered=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=line_total,
        )
        items.append(item)

    order.subtotal = subtotal
    order.total_amount = subtotal

    db.add(order)
    db.flush()

    # Add items
    for item in items:
        item.purchase_order_id = order.id
        db.add(item)

    db.commit()
    db.refresh(order)

    return order


@router.post("/orders/{order_id}/receive")
def receive_purchase_order(
    order_id: str,
    receiving_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Receive purchase order and create inventory lots"""
    order = db.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    # Create inventory lots for received items
    for item_data in receiving_data.get("items", []):
        lot = InventoryLot(
            product_id=item_data["product_id"],
            warehouse_id=receiving_data["warehouse_id"],
            supplier_id=order.supplier_id,
            lot_number=item_data["lot_number"],
            quantity_received=item_data["quantity"],
            quantity_available=item_data["quantity"],
            manufacture_date=item_data.get("manufacture_date"),
            expiry_date=item_data["expiry_date"],
            received_date=date.today(),
            quality_status=QualityStatus.PENDING,
        )
        db.add(lot)

        # Update PO item received quantity
        po_item = (
            db.query(PurchaseOrderItem)
            .filter(
                PurchaseOrderItem.purchase_order_id == order_id,
                PurchaseOrderItem.product_id == item_data["product_id"],
            )
            .first()
        )
        if po_item:
            po_item.quantity_received += item_data["quantity"]

    # Update order status
    order.status = PurchaseOrderStatus.RECEIVED
    order.actual_delivery_date = date.today()

    db.commit()

    return {"message": "Purchase order received successfully"}
