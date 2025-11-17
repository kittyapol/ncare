"""
Receipt Service for Thai Tax Invoice Generation
ระบบสร้างใบเสร็จรับเงิน/ใบกำกับภาษีแบบไทย
"""

from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import Any, Dict, List

from reportlab.graphics.barcode import code128
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


class ReceiptService:
    """Service for generating Thai Tax Invoice receipts using ReportLab"""

    # Store/Pharmacy Information (should come from settings/database in production)
    STORE_INFO = {
        "name_th": "ร้านขายยา nCare",
        "name_en": "nCare Pharmacy",
        "address": "123 ถนนพระราม 4 แขวงคลองเตย เขตคลองเตย",
        "city": "กรุงเทพมหานคร 10110",
        "phone": "02-123-4567",
        "tax_id": "0-1234-56789-01-2",
        "license": "ใบอนุญาตร้านขายยา เลขที่ 1234/2567",
    }

    @staticmethod
    def format_thai_number(value: float | Decimal | None) -> str:
        """Format number with Thai formatting (comma separators)"""
        if value is None:
            return "0.00"
        return f"{float(value):,.2f}"

    @staticmethod
    def format_thai_datetime(dt: datetime | str | None) -> str:
        """Format datetime in Thai format"""
        if dt is None:
            return ""
        if isinstance(dt, str):
            # Try to parse if string
            try:
                dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
            except Exception:
                return dt
        # Convert to Thai Buddhist year (+543 years)
        thai_year = dt.year + 543
        return dt.strftime(f"%d/%m/{thai_year} %H:%M:%S")

    @staticmethod
    def get_payment_method_thai(method: str) -> str:
        """Get Thai payment method name"""
        methods = {
            "cash": "เงินสด",
            "credit_card": "บัตรเครดิต",
            "debit_card": "บัตรเดบิต",
            "bank_transfer": "โอนเงิน",
            "promptpay": "พร้อมเพย์",
            "credit": "เครดิต",
        }
        return methods.get(method, method)

    @staticmethod
    def generate_receipt_pdf(order_data: Dict[str, Any]) -> BytesIO:
        """
        Generate Thai Tax Invoice Receipt PDF

        Args:
            order_data: Dictionary containing:
                - order_number: Receipt number
                - order_date: Order datetime
                - customer: Customer info (optional)
                - items: List of order items
                - subtotal: Subtotal before discount
                - discount_amount: Discount
                - tax_amount: VAT amount
                - total_amount: Grand total
                - paid_amount: Amount paid
                - change_amount: Change
                - payment_method: Payment method
                - cashier: Cashier info

        Returns:
            BytesIO: PDF file buffer
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=0.5 * inch,
            bottomMargin=0.5 * inch,
            leftMargin=0.75 * inch,
            rightMargin=0.75 * inch,
        )

        story = []
        styles = getSampleStyleSheet()

        # Title Style
        title_style = ParagraphStyle(
            "ReceiptTitle",
            parent=styles["Heading1"],
            fontSize=16,
            textColor=colors.HexColor("#1e40af"),
            spaceAfter=4,
            alignment=1,  # Center
            fontName="Helvetica-Bold",
        )

        subtitle_style = ParagraphStyle(
            "ReceiptSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            spaceAfter=2,
            alignment=1,  # Center
        )

        # Header: Store Information
        story.append(Paragraph(ReceiptService.STORE_INFO["name_th"], title_style))
        story.append(Paragraph(ReceiptService.STORE_INFO["name_en"], subtitle_style))
        story.append(Paragraph(ReceiptService.STORE_INFO["address"], subtitle_style))
        story.append(Paragraph(ReceiptService.STORE_INFO["city"], subtitle_style))
        story.append(
            Paragraph(f"โทร: {ReceiptService.STORE_INFO['phone']}", subtitle_style)
        )
        story.append(
            Paragraph(
                f"เลขประจำตัวผู้เสียภาษี: {ReceiptService.STORE_INFO['tax_id']}",
                subtitle_style,
            )
        )
        story.append(
            Paragraph(ReceiptService.STORE_INFO["license"], subtitle_style)
        )
        story.append(Spacer(1, 0.2 * inch))

        # Divider
        divider_table = Table([[""] * 50], colWidths=[0.13 * inch] * 50)
        divider_table.setStyle(
            TableStyle(
                [
                    ("LINEABOVE", (0, 0), (-1, 0), 1, colors.grey),
                ]
            )
        )
        story.append(divider_table)
        story.append(Spacer(1, 0.1 * inch))

        # Receipt Type & Number
        receipt_header_style = ParagraphStyle(
            "ReceiptHeader",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=colors.HexColor("#1e40af"),
            alignment=1,
            fontName="Helvetica-Bold",
        )
        story.append(
            Paragraph("ใบเสร็จรับเงิน / ใบกำกับภาษี", receipt_header_style)
        )
        story.append(
            Paragraph("TAX INVOICE / RECEIPT", receipt_header_style)
        )
        story.append(Spacer(1, 0.15 * inch))

        # Receipt Info Table
        receipt_info = [
            ["เลขที่ (No.):", order_data.get("order_number", "")],
            [
                "วันที่ (Date):",
                ReceiptService.format_thai_datetime(order_data.get("order_date")),
            ],
        ]

        # Add customer info if exists
        customer = order_data.get("customer")
        if customer:
            receipt_info.append(["ลูกค้า (Customer):", customer.get("name", "")])
            if customer.get("address"):
                receipt_info.append(["ที่อยู่ (Address):", customer.get("address", "")])

        receipt_info_table = Table(receipt_info, colWidths=[1.5 * inch, 4.5 * inch])
        receipt_info_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(receipt_info_table)
        story.append(Spacer(1, 0.2 * inch))

        # Items Table Header
        items_data = [
            [
                "ลำดับ\n(No.)",
                "รายการ\n(Description)",
                "จำนวน\n(Qty)",
                "ราคา/หน่วย\n(Price)",
                "ส่วนลด\n(Disc.)",
                "จำนวนเงิน\n(Amount)",
            ]
        ]

        # Items Data
        items = order_data.get("items", [])
        for idx, item in enumerate(items, 1):
            product_name = item.get("product", {}).get("name_th", "")
            if not product_name:
                product_name = f"Product ID: {item.get('product_id', '')}"

            items_data.append(
                [
                    str(idx),
                    product_name,
                    str(item.get("quantity", 0)),
                    ReceiptService.format_thai_number(item.get("unit_price", 0)),
                    ReceiptService.format_thai_number(item.get("discount_amount", 0)),
                    ReceiptService.format_thai_number(item.get("line_total", 0)),
                ]
            )

        items_table = Table(
            items_data,
            colWidths=[
                0.5 * inch,  # No.
                2.8 * inch,  # Description
                0.6 * inch,  # Qty
                1.0 * inch,  # Price
                0.8 * inch,  # Discount
                1.0 * inch,  # Amount
            ],
        )

        items_table.setStyle(
            TableStyle(
                [
                    # Header row
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                    ("TOPPADDING", (0, 0), (-1, 0), 8),
                    # Data rows
                    ("ALIGN", (0, 1), (0, -1), "CENTER"),  # No. center
                    ("ALIGN", (1, 1), (1, -1), "LEFT"),  # Description left
                    ("ALIGN", (2, 1), (2, -1), "CENTER"),  # Qty center
                    ("ALIGN", (3, 1), (-1, -1), "RIGHT"),  # Numbers right
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    # Grid
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )

        story.append(items_table)
        story.append(Spacer(1, 0.2 * inch))

        # Summary Table
        subtotal = order_data.get("subtotal", 0)
        discount = order_data.get("discount_amount", 0)
        price_before_vat = float(subtotal) - float(discount)
        vat_amount = order_data.get("tax_amount", 0)
        total = order_data.get("total_amount", 0)
        paid = order_data.get("paid_amount", 0)
        change = order_data.get("change_amount", 0)

        summary_data = [
            ["รวมเป็นเงิน (Subtotal):", f"฿{ReceiptService.format_thai_number(subtotal)}"],
            ["ส่วนลด (Discount):", f"฿{ReceiptService.format_thai_number(discount)}"],
            [
                "ราคาก่อน VAT (Price before VAT):",
                f"฿{ReceiptService.format_thai_number(price_before_vat)}",
            ],
            ["VAT 7%:", f"฿{ReceiptService.format_thai_number(vat_amount)}"],
            ["", ""],  # Spacer
            ["รวมทั้งสิ้น (Grand Total):", f"฿{ReceiptService.format_thai_number(total)}"],
            ["เงินที่รับ (Paid):", f"฿{ReceiptService.format_thai_number(paid)}"],
            ["เงินทอน (Change):", f"฿{ReceiptService.format_thai_number(change)}"],
        ]

        summary_table = Table(summary_data, colWidths=[4.5 * inch, 2.0 * inch])
        summary_table.setStyle(
            TableStyle(
                [
                    # Regular rows
                    ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    # Grand Total row (index 5)
                    ("FONTNAME", (0, 5), (-1, 5), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 5), (-1, 5), 12),
                    ("TEXTCOLOR", (0, 5), (-1, 5), colors.HexColor("#1e40af")),
                    ("LINEABOVE", (0, 5), (-1, 5), 1.5, colors.HexColor("#1e40af")),
                    ("TOPPADDING", (0, 5), (-1, 5), 8),
                    ("BOTTOMPADDING", (0, 5), (-1, 5), 8),
                ]
            )
        )

        story.append(summary_table)
        story.append(Spacer(1, 0.2 * inch))

        # Payment Method & Cashier
        payment_method = order_data.get("payment_method", "cash")
        cashier_name = order_data.get("cashier", {}).get("full_name", "")

        payment_info = [
            [
                "วิธีชำระเงิน (Payment):",
                ReceiptService.get_payment_method_thai(payment_method),
            ],
            ["ผู้รับเงิน (Cashier):", cashier_name],
        ]

        payment_table = Table(payment_info, colWidths=[2.0 * inch, 4.5 * inch])
        payment_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (0, -1), "RIGHT"),
                    ("ALIGN", (1, 0), (1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )

        story.append(payment_table)
        story.append(Spacer(1, 0.3 * inch))

        # Barcode
        order_number = order_data.get("order_number", "")
        if order_number:
            try:
                barcode = code128.Code128(
                    order_number,
                    barWidth=1.2,
                    barHeight=0.5 * inch,
                    humanReadable=True,
                )
                # Center the barcode
                barcode_table = Table([[barcode]], colWidths=[6.5 * inch])
                barcode_table.setStyle(
                    TableStyle(
                        [
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ]
                    )
                )
                story.append(barcode_table)
                story.append(Spacer(1, 0.2 * inch))
            except Exception as e:
                # If barcode generation fails, just skip it
                print(f"Barcode generation failed: {e}")

        # Footer
        footer_style = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontSize=9,
            alignment=1,  # Center
            textColor=colors.grey,
        )
        story.append(Paragraph("ขอบคุณที่ใช้บริการ", footer_style))
        story.append(Paragraph("Thank you for your business", footer_style))
        story.append(Spacer(1, 0.1 * inch))
        story.append(
            Paragraph("*** เอกสารนี้ออกจากระบบคอมพิวเตอร์ ***", footer_style)
        )

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
