"""
Integration Tests - End-to-End Workflows
"""
import pytest
from datetime import date, timedelta


class TestProcurementToSalesWorkflow:
    """Test complete workflow from procurement to sales"""

    def test_complete_pharmacy_workflow(
        self,
        client,
        auth_headers_admin,
        auth_headers_cashier,
        sample_product,
        sample_warehouse,
        sample_supplier,
        db_session
    ):
        """
        Complete workflow:
        1. Create purchase order
        2. Receive goods
        3. Create inventory lot
        4. Sell product
        5. Check inventory levels
        """
        # Step 1: Create Purchase Order
        po_response = client.post(
            "/api/v1/purchase/orders/",
            headers=auth_headers_admin,
            json={
                "supplier_id": str(sample_supplier.id),
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 100,
                        "unit_price": 50.00
                    }
                ]
            }
        )
        assert po_response.status_code in [200, 201]
        po_id = po_response.json()["id"]

        # Step 2: Receive Goods
        receive_response = client.post(
            f"/api/v1/purchase/orders/{po_id}/receive",
            headers=auth_headers_admin,
            json={
                "warehouse_id": str(sample_warehouse.id),
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 100,
                        "lot_number": "BATCH001",
                        "expiry_date": str((date.today() + timedelta(days=730)).isoformat())
                    }
                ]
            }
        )
        assert receive_response.status_code == 200

        # Step 3: Check Inventory Created
        inventory_response = client.get(
            "/api/v1/inventory/lots/",
            headers=auth_headers_admin,
            params={"product_id": str(sample_product.id)}
        )
        assert inventory_response.status_code == 200
        lots = inventory_response.json()["items"]
        assert len(lots) > 0
        assert lots[0]["quantity_available"] == 100

        # Step 4: Make Sale
        sale_response = client.post(
            "/api/v1/sales/orders/",
            headers=auth_headers_cashier,
            json={
                "items": [
                    {
                        "product_id": str(sample_product.id),
                        "quantity": 5,
                        "unit_price": float(sample_product.selling_price)
                    }
                ]
            }
        )
        assert sale_response.status_code in [200, 201]
        sale_id = sale_response.json()["id"]

        # Complete payment
        client.post(
            f"/api/v1/sales/orders/{sale_id}/complete",
            headers=auth_headers_cashier,
            json={
                "payment_method": "cash",
                "paid_amount": 1000.00
            }
        )

        # Step 5: Verify Inventory Updated
        updated_inventory = client.get(
            "/api/v1/inventory/lots/",
            headers=auth_headers_admin,
            params={"product_id": str(sample_product.id)}
        )
        updated_lots = updated_inventory.json()["items"]
        assert updated_lots[0]["quantity_available"] == 95  # 100 - 5


class TestExpiryAlertWorkflow:
    """Test expiry alert system"""

    def test_expiry_alerts(self, client, auth_headers_admin, sample_product, sample_warehouse, db_session):
        """Test that expiring items are properly flagged"""
        from app.models.inventory import InventoryLot, QualityStatus

        # Create lot expiring soon
        expiring_lot = InventoryLot(
            product_id=sample_product.id,
            warehouse_id=sample_warehouse.id,
            lot_number="EXPIRING001",
            quantity_received=50,
            quantity_available=50,
            expiry_date=date.today() + timedelta(days=25),  # Expires in 25 days
            received_date=date.today(),
            quality_status=QualityStatus.PASSED
        )
        db_session.add(expiring_lot)
        db_session.commit()

        # Get expiring items (within 30 days)
        response = client.get(
            "/api/v1/inventory/lots/expiring",
            headers=auth_headers_admin,
            params={"days": 30}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0


class TestReportingWorkflow:
    """Test reporting and analytics"""

    def test_dashboard_summary(self, client, auth_headers_admin):
        """Test dashboard summary endpoint"""
        response = client.get(
            "/api/v1/reports/dashboard-summary",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        data = response.json()
        assert "today_sales" in data
        assert "total_products" in data
        assert "low_stock_items" in data
        assert "expiring_items" in data

    def test_sales_report(self, client, auth_headers_admin):
        """Test sales report generation"""
        from datetime import datetime

        start_date = datetime.now().replace(day=1).isoformat()
        end_date = datetime.now().isoformat()

        response = client.get(
            "/api/v1/reports/sales-report",
            headers=auth_headers_admin,
            params={
                "start_date": start_date,
                "end_date": end_date
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_sales" in data
        assert "total_orders" in data
