from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_db
from app.models.inventory import InventoryLot
from app.models.product import Product
from app.models.purchase import PurchaseOrder, PurchaseOrderStatus
from app.models.sales import OrderStatus, SalesOrder, SalesOrderItem
from app.models.user import User
from app.services.export_service import ExcelExportService, PDFExportService

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
    total_products = db.query(Product).filter(Product.is_active).count()

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
        db.query(func.sum(InventoryLot.quantity_available * Product.cost_price))
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


# ============================================
# VAT Reports (ภาษีซื้อ/ภาษีขาย)
# ============================================


@router.get("/vat-purchases")
def get_vat_purchases_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    รายงานภาษีซื้อ (Input VAT / VAT Purchases)
    สำหรับคำนวณภาษีซื้อที่สามารถนำไปหักภาษีขายได้
    """
    # Get all received purchase orders in date range
    purchases = (
        db.query(PurchaseOrder)
        .filter(
            and_(
                PurchaseOrder.actual_delivery_date >= start_date,
                PurchaseOrder.actual_delivery_date <= end_date,
                PurchaseOrder.status.in_(
                    [PurchaseOrderStatus.PARTIALLY_RECEIVED, PurchaseOrderStatus.RECEIVED]
                ),
            )
        )
        .all()
    )

    # Calculate VAT breakdown
    total_vat_7 = 0.0  # VAT 7%
    total_vat_0 = 0.0  # VAT 0% (zero-rated)
    total_exempt = 0.0  # ไม่มี VAT (exempt)
    total_before_vat = 0.0
    total_vat_amount = 0.0
    total_including_vat = 0.0

    purchase_details = []

    for po in purchases:
        for item in po.items:
            # คำนวณ VAT ตาม item
            vat_rate = float(item.vat_rate) if hasattr(item, "vat_rate") else 7.0
            is_vat_included = getattr(item, "is_vat_included", True)

            # ถ้ารวม VAT แล้ว คำนวณแยกออก
            if is_vat_included and vat_rate > 0:
                price_before = float(item.unit_price) / (1 + vat_rate / 100)
                vat_amount = float(item.unit_price) - price_before
            elif not is_vat_included and vat_rate > 0:
                price_before = float(item.unit_price)
                vat_amount = price_before * (vat_rate / 100)
            else:
                price_before = float(item.unit_price)
                vat_amount = 0.0

            line_before_vat = price_before * item.quantity_received
            line_vat = vat_amount * item.quantity_received
            line_total = line_before_vat + line_vat

            # จัดหมวดตาม VAT rate
            if vat_rate == 7.0:
                total_vat_7 += line_vat
            elif vat_rate == 0.0:
                total_vat_0 += line_before_vat
            else:
                total_exempt += line_before_vat

            total_before_vat += line_before_vat
            total_vat_amount += line_vat
            total_including_vat += line_total

            purchase_details.append(
                {
                    "po_number": po.po_number,
                    "date": po.actual_delivery_date,
                    "supplier_id": str(po.supplier_id),
                    "product_id": str(item.product_id),
                    "quantity": item.quantity_received,
                    "unit_price": float(item.unit_price),
                    "vat_rate": vat_rate,
                    "price_before_vat": price_before,
                    "vat_amount": vat_amount,
                    "line_before_vat": line_before_vat,
                    "line_vat": line_vat,
                    "line_total": line_total,
                }
            )

    return {
        "report_type": "vat_purchases",
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_before_vat": round(total_before_vat, 2),
            "total_vat_amount": round(total_vat_amount, 2),
            "total_including_vat": round(total_including_vat, 2),
            "vat_breakdown": {
                "vat_7_percent": round(total_vat_7, 2),
                "vat_0_percent": round(total_vat_0, 2),
                "vat_exempt": round(total_exempt, 2),
            },
        },
        "details": purchase_details,
        "total_transactions": len(purchase_details),
    }


@router.get("/vat-sales")
def get_vat_sales_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    รายงานภาษีขาย (Output VAT / VAT Sales)
    สำหรับคำนวณภาษีขายที่ต้องนำส่งกรมสรรพากร
    """
    # Get all completed sales orders in date range
    sales = (
        db.query(SalesOrder)
        .filter(
            and_(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status == OrderStatus.COMPLETED,
            )
        )
        .all()
    )

    # Calculate VAT breakdown
    total_vat_7 = 0.0  # VAT 7%
    total_vat_0 = 0.0  # VAT 0%
    total_exempt = 0.0  # ไม่มี VAT
    total_before_vat = 0.0
    total_vat_amount = 0.0
    total_including_vat = 0.0

    sales_details = []

    for order in sales:
        for item in order.items:
            # ใช้ข้อมูล VAT จาก SalesOrderItem ที่คำนวณไว้แล้ว
            price_before = float(item.price_before_vat)
            vat_amount = float(item.vat_amount)
            price_including = float(item.price_including_vat)

            # รวม totals
            total_before_vat += price_before
            total_vat_amount += vat_amount
            total_including_vat += price_including

            # จัดหมวดตาม VAT
            if vat_amount > 0:
                total_vat_7 += vat_amount
            elif price_before > 0:
                total_vat_0 += price_before

            sales_details.append(
                {
                    "order_number": order.order_number,
                    "order_date": order.order_date,
                    "customer_id": str(order.customer_id) if order.customer_id else None,
                    "product_id": str(item.product_id),
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "price_before_vat": price_before,
                    "vat_amount": vat_amount,
                    "price_including_vat": price_including,
                }
            )

    return {
        "report_type": "vat_sales",
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_before_vat": round(total_before_vat, 2),
            "total_vat_amount": round(total_vat_amount, 2),
            "total_including_vat": round(total_including_vat, 2),
            "vat_breakdown": {
                "vat_7_percent": round(total_vat_7, 2),
                "vat_0_percent": round(total_vat_0, 2),
                "vat_exempt": round(total_exempt, 2),
            },
        },
        "details": sales_details,
        "total_transactions": len(sales_details),
    }


# ============================================
# COGS Report (ต้นทุนขาย)
# ============================================


@router.get("/cogs-report")
def get_cogs_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    รายงานต้นทุนขาย (Cost of Goods Sold)
    คำนวณจาก: จำนวนที่ขาย × unit_cost ของ lot
    """
    # Get completed sales in date range with lot information
    sales_items = (
        db.query(
            SalesOrderItem,
            SalesOrder.order_number,
            SalesOrder.order_date,
            InventoryLot.unit_cost,
            Product.name_th,
            Product.sku,
        )
        .join(SalesOrder, SalesOrderItem.sales_order_id == SalesOrder.id)
        .join(InventoryLot, SalesOrderItem.lot_id == InventoryLot.id)
        .join(Product, SalesOrderItem.product_id == Product.id)
        .filter(
            and_(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status == OrderStatus.COMPLETED,
            )
        )
        .all()
    )

    total_cogs = 0.0
    total_revenue = 0.0
    total_quantity = 0

    cogs_details = []

    for item, order_number, order_date, unit_cost, product_name, sku in sales_items:
        # คำนวณ COGS จาก unit_cost × quantity
        item_cogs = float(unit_cost) * item.quantity
        item_revenue = float(item.price_including_vat)
        item_profit = item_revenue - item_cogs

        total_cogs += item_cogs
        total_revenue += item_revenue
        total_quantity += item.quantity

        cogs_details.append(
            {
                "order_number": order_number,
                "order_date": order_date,
                "product_name": product_name,
                "sku": sku,
                "quantity": item.quantity,
                "unit_cost": float(unit_cost),
                "total_cost": round(item_cogs, 2),
                "revenue": round(item_revenue, 2),
                "profit": round(item_profit, 2),
                "profit_margin_percent": round(
                    (item_profit / item_revenue * 100) if item_revenue > 0 else 0, 2
                ),
            }
        )

    gross_profit = total_revenue - total_cogs
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    return {
        "report_type": "cogs",
        "start_date": start_date,
        "end_date": end_date,
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin_percent": round(gross_margin, 2),
            "total_quantity_sold": total_quantity,
            "average_cost_per_unit": (
                round(total_cogs / total_quantity, 2) if total_quantity > 0 else 0
            ),
        },
        "details": cogs_details,
        "total_transactions": len(cogs_details),
    }


# ============================================
# Profit & Loss Report (กำไร-ขาดทุน)
# ============================================


@router.get("/profit-loss")
def get_profit_loss_report(
    start_date: date = Query(..., description="Start date for report"),
    end_date: date = Query(..., description="End date for report"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    รายงานกำไร-ขาดทุน (Profit & Loss Statement)
    แสดง: รายได้ - ต้นทุนขาย = กำไรขั้นต้น
    """
    # 1. Calculate Revenue (รายได้จากการขาย)
    sales = (
        db.query(func.sum(SalesOrder.total_amount))
        .filter(
            and_(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status == OrderStatus.COMPLETED,
            )
        )
        .scalar()
        or 0
    )
    total_revenue = float(sales)

    # 2. Calculate COGS (ต้นทุนขาย)
    cogs_items = (
        db.query(SalesOrderItem.quantity, InventoryLot.unit_cost)
        .join(SalesOrder, SalesOrderItem.sales_order_id == SalesOrder.id)
        .join(InventoryLot, SalesOrderItem.lot_id == InventoryLot.id)
        .filter(
            and_(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status == OrderStatus.COMPLETED,
            )
        )
        .all()
    )

    total_cogs = sum(float(qty * unit_cost) for qty, unit_cost in cogs_items)

    # 3. Calculate Gross Profit (กำไรขั้นต้น)
    gross_profit = total_revenue - total_cogs
    gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    # 4. Get VAT breakdown
    vat_sales = (
        db.query(func.sum(SalesOrder.tax_amount))
        .filter(
            and_(
                SalesOrder.order_date >= start_date,
                SalesOrder.order_date <= end_date,
                SalesOrder.status == OrderStatus.COMPLETED,
            )
        )
        .scalar()
        or 0
    )
    output_vat = float(vat_sales)

    # ภาษีซื้อ (input VAT) - คำนวณจาก PO ที่รับของในช่วงเวลานี้
    # Note: อาจต้องคำนวณซับซ้อนกว่านี้ตามหลักบัญชี
    input_vat_estimate = total_cogs * 0.07  # ประมาณการ 7% ของต้นทุน

    return {
        "report_type": "profit_loss",
        "start_date": start_date,
        "end_date": end_date,
        "income_statement": {
            "revenue": {
                "total_sales": round(total_revenue, 2),
                "output_vat": round(output_vat, 2),
            },
            "cost_of_goods_sold": {
                "total_cogs": round(total_cogs, 2),
                "input_vat_estimate": round(input_vat_estimate, 2),
            },
            "gross_profit": {
                "amount": round(gross_profit, 2),
                "margin_percent": round(gross_margin, 2),
            },
            "net_vat": {
                "output_vat": round(output_vat, 2),
                "input_vat_estimate": round(input_vat_estimate, 2),
                "net_vat_payable": round(output_vat - input_vat_estimate, 2),
            },
        },
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "total_cogs": round(total_cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin_percent": round(gross_margin, 2),
        },
    }


# ============================================
# PDF/Excel Export Endpoints
# ============================================


@router.get("/profit-loss/export-pdf")
def export_profit_loss_pdf(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export Profit & Loss Statement as PDF"""
    # Get report data
    report_data = get_profit_loss_report(start_date, end_date, db, current_user)

    # Generate PDF
    pdf_buffer = PDFExportService.generate_profit_loss_pdf(report_data)

    # Return as downloadable file
    filename = f"profit_loss_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/profit-loss/export-excel")
def export_profit_loss_excel(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export Profit & Loss Statement as Excel"""
    # Get report data
    report_data = get_profit_loss_report(start_date, end_date, db, current_user)

    # Generate Excel
    excel_buffer = ExcelExportService.generate_profit_loss_excel(report_data)

    # Return as downloadable file
    filename = f"profit_loss_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/vat-sales/export-pdf")
def export_vat_sales_pdf(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export VAT Sales Report as PDF"""
    # Get report data
    report_data = get_vat_sales_report(start_date, end_date, db, current_user)

    # Generate PDF
    pdf_buffer = PDFExportService.generate_vat_sales_pdf(report_data)

    # Return as downloadable file
    filename = f"vat_sales_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/vat-sales/export-excel")
def export_vat_sales_excel(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export VAT Sales Report as Excel"""
    # Get report data
    report_data = get_vat_sales_report(start_date, end_date, db, current_user)

    # Generate Excel
    excel_buffer = ExcelExportService.generate_vat_sales_excel(report_data)

    # Return as downloadable file
    filename = f"vat_sales_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/vat-purchases/export-pdf")
def export_vat_purchases_pdf(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export VAT Purchases Report as PDF"""
    # Get report data
    report_data = get_vat_purchases_report(start_date, end_date, db, current_user)

    # Generate PDF
    pdf_buffer = PDFExportService.generate_vat_purchases_pdf(report_data)

    # Return as downloadable file
    filename = f"vat_purchases_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/vat-purchases/export-excel")
def export_vat_purchases_excel(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export VAT Purchases Report as Excel"""
    # Get report data
    report_data = get_vat_purchases_report(start_date, end_date, db, current_user)

    # Generate Excel
    excel_buffer = ExcelExportService.generate_vat_purchases_excel(report_data)

    # Return as downloadable file
    filename = f"vat_purchases_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/cogs/export-pdf")
def export_cogs_pdf(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export COGS Report as PDF"""
    # Get report data
    report_data = get_cogs_report(start_date, end_date, db, current_user)

    # Generate PDF
    pdf_buffer = PDFExportService.generate_cogs_pdf(report_data)

    # Return as downloadable file
    filename = f"cogs_{start_date}_{end_date}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/cogs/export-excel")
def export_cogs_excel(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    """Export COGS Report as Excel"""
    # Get report data
    report_data = get_cogs_report(start_date, end_date, db, current_user)

    # Generate Excel
    excel_buffer = ExcelExportService.generate_cogs_excel(report_data)

    # Return as downloadable file
    filename = f"cogs_{start_date}_{end_date}.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
