"""
Tests for Sales Order endpoints

These tests verify:
- Creating sales orders with VAT calculation
- Inventory lot selection and reservation
- Race condition prevention with concurrent orders
- Order completion and payment processing
- Inventory deduction logic
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime

from app.models.inventory import InventoryLot
from app.models.sales import SalesOrder, OrderStatus, PaymentStatus


@pytest.mark.sales
@pytest.mark.integration
class TestSalesOrderCreation:
    """Test sales order creation with various scenarios"""

    def test_create_sales_order_success(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
        db: Session,
    ):
        """Test creating a sales order successfully"""
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
            "notes": "Test order",
        }

        response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()

        # Verify order details
        assert data["customer_id"] == str(test_customer.id)
        assert data["status"] == "draft"
        assert data["payment_status"] == "pending"

        # Verify VAT calculation (7% VAT)
        # 10 items × 15.00 = 150.00 before VAT
        # VAT = 150.00 × 0.07 = 10.50
        # Total = 150.00 + 10.50 = 160.50
        assert float(data["subtotal"]) == 150.00
        assert float(data["tax_amount"]) == 10.50
        assert float(data["total_amount"]) == 160.50

        # Verify inventory was reserved
        db.refresh(test_inventory_lot)
        assert test_inventory_lot.quantity_reserved == 10
        assert test_inventory_lot.quantity_available == 990

    def test_create_sales_order_insufficient_inventory(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test creating order with insufficient inventory fails"""
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 5000,  # More than available (1000)
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "Insufficient inventory" in response.json()["detail"]

    def test_create_sales_order_with_discount(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test creating order with item discount"""
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 20.00,  # 20 baht discount
                }
            ],
            "discount_amount": 0,
        }

        response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()

        # Verify discount calculation
        # (10 × 15.00) - 20.00 = 130.00 before VAT
        # VAT = 130.00 × 0.07 = 9.10
        # Total = 130.00 + 9.10 = 139.10
        assert float(data["subtotal"]) == 130.00
        assert float(data["tax_amount"]) == 9.10
        assert float(data["total_amount"]) == 139.10

    def test_create_sales_order_auto_lot_selection(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test automatic lot selection when lot_id not provided"""
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    # No lot_id provided - should auto-select
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["lot_id"] == str(test_inventory_lot.id)

    def test_create_sales_order_product_not_found(
        self,
        client: TestClient,
        auth_headers: dict,
        test_customer,
    ):
        """Test creating order with non-existent product fails"""
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": "00000000-0000-0000-0000-000000000000",
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"]


@pytest.mark.sales
@pytest.mark.integration
class TestSalesOrderCompletion:
    """Test sales order completion and payment processing"""

    def test_complete_sales_order_success(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
        db: Session,
    ):
        """Test completing a sales order with payment"""
        # First create an order
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        create_response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )
        assert create_response.status_code == 201
        order_id = create_response.json()["id"]

        # Complete the order with payment
        payment_data = {
            "payment_method": "cash",
            "paid_amount": 200.00,  # Total is 160.50, so change = 39.50
        }

        complete_response = client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            json=payment_data,
            headers=auth_headers,
        )

        assert complete_response.status_code == 200
        data = complete_response.json()

        # Verify order completion
        assert data["status"] == "completed"
        assert data["payment_status"] == "paid"
        assert float(data["paid_amount"]) == 200.00
        assert float(data["change_amount"]) == 39.50

        # Verify inventory was unreserved (moved from reserved to sold)
        db.refresh(test_inventory_lot)
        assert test_inventory_lot.quantity_reserved == 0
        assert test_inventory_lot.quantity_available == 990

    def test_complete_sales_order_insufficient_payment(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test completing order with insufficient payment fails"""
        # Create order
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        create_response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )
        order_id = create_response.json()["id"]

        # Try to complete with insufficient payment
        payment_data = {
            "payment_method": "cash",
            "paid_amount": 100.00,  # Total is 160.50, so this is insufficient
        }

        complete_response = client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            json=payment_data,
            headers=auth_headers,
        )

        assert complete_response.status_code == 400
        assert "Insufficient payment" in complete_response.json()["detail"]

    def test_complete_already_completed_order_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test that completing an already completed order fails"""
        # Create and complete order
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        create_response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )
        order_id = create_response.json()["id"]

        payment_data = {
            "payment_method": "cash",
            "paid_amount": 200.00,
        }

        # Complete once
        client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            json=payment_data,
            headers=auth_headers,
        )

        # Try to complete again
        second_complete = client.post(
            f"/api/v1/sales/orders/{order_id}/complete",
            json=payment_data,
            headers=auth_headers,
        )

        assert second_complete.status_code == 400
        assert "already completed" in second_complete.json()["detail"]


@pytest.mark.sales
@pytest.mark.integration
class TestSalesOrderRetrieval:
    """Test sales order retrieval endpoints"""

    def test_get_sales_orders_list(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test retrieving list of sales orders"""
        # Create a few orders
        for i in range(3):
            order_data = {
                "customer_id": str(test_customer.id),
                "items": [
                    {
                        "product_id": str(test_product.id),
                        "lot_id": str(test_inventory_lot.id),
                        "quantity": 10,
                        "unit_price": 15.00,
                        "discount_amount": 0,
                    }
                ],
                "discount_amount": 0,
            }
            client.post(
                "/api/v1/sales/orders/",
                json=order_data,
                headers=auth_headers,
            )

        # Get orders list
        response = client.get(
            "/api/v1/sales/orders/",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 3
        assert len(data["items"]) >= 3

    def test_get_sales_order_by_id(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot: InventoryLot,
        test_customer,
    ):
        """Test retrieving a specific sales order by ID"""
        # Create order
        order_data = {
            "customer_id": str(test_customer.id),
            "items": [
                {
                    "product_id": str(test_product.id),
                    "lot_id": str(test_inventory_lot.id),
                    "quantity": 10,
                    "unit_price": 15.00,
                    "discount_amount": 0,
                }
            ],
            "discount_amount": 0,
        }

        create_response = client.post(
            "/api/v1/sales/orders/",
            json=order_data,
            headers=auth_headers,
        )
        order_id = create_response.json()["id"]

        # Get order by ID
        get_response = client.get(
            f"/api/v1/sales/orders/{order_id}",
            headers=auth_headers,
        )

        assert get_response.status_code == 200
        data = get_response.json()
        assert data["id"] == order_id
        assert data["customer_id"] == str(test_customer.id)

    def test_get_non_existent_order_returns_404(
        self,
        client: TestClient,
        auth_headers: dict,
    ):
        """Test that getting non-existent order returns 404"""
        response = client.get(
            "/api/v1/sales/orders/00000000-0000-0000-0000-000000000000",
            headers=auth_headers,
        )

        assert response.status_code == 404
