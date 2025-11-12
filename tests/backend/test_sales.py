"""
Sales and POS Tests
"""
import pytest
from decimal import Decimal


class TestSalesOrder:
    """Test sales order creation and processing"""

    def test_create_sales_order_vat_items(self, client, auth_headers_admin, sample_product):
        """Test creating sales order with VAT items"""
        response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_admin,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 2,
                        "unit_price": 100.00
                    }
                ]
            }
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert "order_number" in data
        # Expect: 200 * 1.07 = 214 (with 7% VAT)
        expected_total = 200 * 1.07
        assert abs(float(data["total_amount"]) - expected_total) < 0.01

    def test_create_sales_order_mixed_vat(self, client, auth_headers_admin, sample_product, sample_category, db_session):
        """Test sales order with mixed VAT/Non-VAT items"""
        # Create non-VAT product
        from app.models.product import Product
        non_vat_product = Product(
            sku="NONVAT001",
            name_th="ยา Non-VAT",
            category_id=sample_category.id,
            cost_price=50.00,
            selling_price=100.00,
            is_vat_applicable=False,
            vat_rate=0.0
        )
        db_session.add(non_vat_product)
        db_session.commit()
        db_session.refresh(non_vat_product)

        response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_admin,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),  # VAT item
                        "quantity": 1,
                        "unit_price": 100.00
                    },
                    {
                        "product_id": str(non_vat_product.id),  # Non-VAT item
                        "quantity": 1,
                        "unit_price": 100.00
                    }
                ]
            }
        )
        assert response.status_code in [200, 201]
        data = response.json()
        # VAT item: 100 * 1.07 = 107
        # Non-VAT item: 100
        # Total: 207
        expected_total = 107 + 100
        assert abs(float(data["total_amount"]) - expected_total) < 0.01

    def test_complete_sales_order(self, client, auth_headers_admin, sample_product):
        """Test completing sales order with payment"""
        # Create order
        create_response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_admin,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 1,
                        "unit_price": 100.00
                    }
                ]
            }
        )
        order_id = create_response.json()["id"]

        # Complete order
        complete_response = client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            headers=auth_headers_admin,
            json={
                "payment_method": "cash",
                "paid_amount": 200.00
            }
        )
        assert complete_response.status_code == 200
        data = complete_response.json()
        assert "change" in data


class TestPOSWorkflow:
    """Test complete POS workflow"""

    def test_full_pos_transaction(self, client, auth_headers_cashier, sample_product):
        """Test full POS transaction from search to payment"""
        # 1. Search product
        search_response = client.get(
            "/api/v1/inventory/products/search",
            headers=auth_headers_cashier,
            params={"q": sample_product.sku}
        )
        assert search_response.status_code == 200
        products = search_response.json()
        assert len(products) > 0

        # 2. Create sale
        create_response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_cashier,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 2,
                        "unit_price": float(sample_product.selling_price)
                    }
                ]
            }
        )
        assert create_response.status_code in [200, 201]
        order = create_response.json()

        # 3. Complete payment
        complete_response = client.post(
            f"/api/v1/sales/orders/{order['id']}/complete",
            headers=auth_headers_cashier,
            json={
                "payment_method": "cash",
                "paid_amount": 300.00
            }
        )
        assert complete_response.status_code == 200


class TestInventoryDeduction:
    """Test inventory deduction on sales"""

    def test_inventory_updated_on_sale(self, client, auth_headers_admin, sample_product, sample_warehouse, db_session):
        """Test that inventory is deducted when sale is made"""
        # Create inventory lot
        from app.models.inventory import InventoryLot, QualityStatus
        from datetime import date, timedelta

        lot = InventoryLot(
            product_id=sample_product.id,
            warehouse_id=sample_warehouse.id,
            lot_number="LOT001",
            quantity_received=100,
            quantity_available=100,
            expiry_date=date.today() + timedelta(days=365),
            received_date=date.today(),
            quality_status=QualityStatus.PASSED
        )
        db_session.add(lot)
        db_session.commit()

        # Create and complete sale
        create_response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_admin,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 10,
                        "unit_price": 100.00
                    }
                ]
            }
        )
        order_id = create_response.json()["id"]

        client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            headers=auth_headers_admin,
            json={
                "payment_method": "cash",
                "paid_amount": 1500.00
            }
        )

        # Check inventory
        db_session.refresh(lot)
        assert lot.quantity_available == 90  # 100 - 10
