from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.models.sales import SalesOrder, SalesOrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.inventory import InventoryLot
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.sales import (
    SalesOrderCreate,
    SalesOrderResponse,
    SalesOrderComplete,
    SalesOrderList,
)

router = APIRouter()


@router.get("/orders/", response_model=SalesOrderList)
def get_sales_orders(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all sales orders"""
    query = db.query(SalesOrder)

    if status_filter:
        query = query.filter(SalesOrder.status == status_filter)

    total = query.count()
    orders = query.offset(skip).limit(limit).all()

    return {"items": orders, "total": total, "skip": skip, "limit": limit}


@router.get("/orders/{order_id}", response_model=SalesOrderResponse)
def get_sales_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get sales order by ID"""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    return order


@router.post("/orders/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_sales_order(
    order_data: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create new sales order with VAT calculation"""
    # Generate order number
    order_number = f"SO-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Create order
    order = SalesOrder(
        order_number=order_number,
        customer_id=order_data.customer_id,
        prescription_number=order_data.prescription_number,
        cashier_id=str(current_user.id),
        discount_amount=float(order_data.discount_amount),
        subtotal=0,
        tax_amount=0,
        total_amount=0,
        status=OrderStatus.DRAFT,
        payment_status=PaymentStatus.PENDING,
        paid_amount=0,
        change_amount=0,
        notes=order_data.notes,
    )

    # Calculate totals with VAT
    subtotal = Decimal("0")
    total_vat = Decimal("0")
    items = []

    for item_data in order_data.items:
        # Get product
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item_data.product_id} not found",
            )

        # Use provided price or get from product
        unit_price = item_data.unit_price if item_data.unit_price else product.selling_price

        # Calculate line total before discount
        line_total_before_discount = Decimal(str(unit_price)) * item_data.quantity
        discount = Decimal(str(item_data.discount_amount))
        line_total = line_total_before_discount - discount

        # Calculate VAT for this item
        # Note: In this system, unit prices are BEFORE VAT, and we ADD VAT on top
        if product.is_vat_applicable:
            vat_rate = product.vat_rate / Decimal("100")
            price_before_vat = line_total
            vat_amount = line_total * vat_rate
            price_including_vat = line_total + vat_amount
        else:
            price_before_vat = line_total
            vat_amount = Decimal("0")
            price_including_vat = line_total

        subtotal += price_before_vat
        total_vat += vat_amount

        # Validate inventory if lot_id provided
        lot = None
        if item_data.lot_id:
            lot = db.query(InventoryLot).filter(InventoryLot.id == item_data.lot_id).first()
            if not lot:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Lot {item_data.lot_id} not found",
                )
        else:
            # Find available lot
            lot = (
                db.query(InventoryLot)
                .filter(InventoryLot.product_id == item_data.product_id)
                .filter(InventoryLot.quantity_available >= item_data.quantity)
                .first()
            )

        if not lot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product {product.name_th}",
            )

        if lot.quantity_available < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product {product.name_th}. Available: {lot.quantity_available}",
            )

        item = SalesOrderItem(
            product_id=item_data.product_id,
            lot_id=str(lot.id),
            quantity=item_data.quantity,
            unit_price=float(unit_price),
            discount_amount=float(discount),
            line_total=float(price_including_vat),  # Store final price with VAT
            vat_amount=float(vat_amount),
            price_before_vat=float(price_before_vat),
            price_including_vat=float(price_including_vat),
        )
        items.append(item)

        # Reserve inventory
        lot.quantity_reserved += item_data.quantity
        lot.quantity_available -= item_data.quantity

    # Set order totals
    order.subtotal = float(subtotal)
    order.tax_amount = float(total_vat)
    order.total_amount = float(subtotal + total_vat - Decimal(str(order.discount_amount)))

    db.add(order)
    db.flush()

    # Add items
    for item in items:
        item.sales_order_id = str(order.id)
        db.add(item)

    db.commit()
    db.refresh(order)

    return order


@router.post("/orders/{order_id}/complete", response_model=SalesOrderResponse)
def complete_sales_order(
    order_id: str,
    payment_data: SalesOrderComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Complete sales order and process payment"""
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Order already completed"
        )

    # Validate payment amount
    if payment_data.paid_amount < Decimal(str(order.total_amount)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient payment. Total: {order.total_amount}, Paid: {payment_data.paid_amount}",
        )

    # Update order
    order.payment_method = payment_data.payment_method
    order.paid_amount = float(payment_data.paid_amount)
    order.change_amount = float(payment_data.paid_amount) - float(order.total_amount)
    order.payment_status = PaymentStatus.PAID
    order.status = OrderStatus.COMPLETED
    order.completed_at = datetime.now()

    if payment_data.pharmacist_id:
        order.pharmacist_id = payment_data.pharmacist_id

    # Deduct inventory (move from reserved to sold)
    for item in order.items:
        lot = db.query(InventoryLot).filter(InventoryLot.id == item.lot_id).first()
        if lot:
            lot.quantity_reserved -= item.quantity
            # quantity_available was already deducted when order was created

    db.commit()
    db.refresh(order)

    return order
