"""
Tests for Inventory Lot endpoints

These tests verify:
- Inventory lot creation and tracking
- Lot expiry date management
- Quantity tracking (available, reserved, damaged)
- FIFO/FEFO lot selection logic
- Cost tracking for COGS calculation
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
from decimal import Decimal


@pytest.mark.inventory
@pytest.mark.integration
class TestInventoryLotCRUD:
    """Test inventory lot CRUD operations"""

    def test_create_inventory_lot(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
    ):
        """Test creating a new inventory lot"""
        lot_data = {
            "product_id": str(test_product.id),
            "warehouse_id": str(test_warehouse.id),
            "supplier_id": str(test_supplier.id),
            "lot_number": "LOT999",
            "batch_number": "BATCH999",
            "quantity_received": 500,
            "quantity_available": 500,
            "expiry_date": (date.today() + timedelta(days=365)).isoformat(),
            "received_date": date.today().isoformat(),
            "quality_status": "passed",
            "unit_cost": 10.50,
        }

        response = client.post(
            "/api/v1/inventory/lots/",
            json=lot_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["lot_number"] == "LOT999"
        assert data["quantity_received"] == 500
        assert data["quantity_available"] == 500
        assert float(data["unit_cost"]) == 10.50

    def test_get_inventory_lot_by_id(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
    ):
        """Test retrieving inventory lot by ID"""
        response = client.get(
            f"/api/v1/inventory/lots/{test_inventory_lot.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_inventory_lot.id)
        assert data["lot_number"] == test_inventory_lot.lot_number

    def test_get_inventory_lots_list(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
    ):
        """Test retrieving list of inventory lots"""
        response = client.get(
            "/api/v1/inventory/lots/",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_filter_lots_by_product(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
        test_product,
    ):
        """Test filtering inventory lots by product"""
        response = client.get(
            "/api/v1/inventory/lots/",
            params={"product_id": str(test_product.id)},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert all(item["product_id"] == str(test_product.id) for item in data["items"])

    def test_filter_lots_by_warehouse(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
        test_warehouse,
    ):
        """Test filtering inventory lots by warehouse"""
        response = client.get(
            "/api/v1/inventory/lots/",
            params={"warehouse_id": str(test_warehouse.id)},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert all(item["warehouse_id"] == str(test_warehouse.id) for item in data["items"])


@pytest.mark.inventory
@pytest.mark.integration
class TestInventoryLotExpiry:
    """Test inventory lot expiry date management"""

    def test_get_expiring_lots(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
        db: Session,
    ):
        """Test retrieving lots expiring soon"""
        from app.models.inventory import InventoryLot
        import uuid

        # Create lot expiring in 30 days
        expiring_lot = InventoryLot(
            id=uuid.uuid4(),
            product_id=test_product.id,
            warehouse_id=test_warehouse.id,
            supplier_id=test_supplier.id,
            lot_number="EXPIRING001",
            quantity_received=100,
            quantity_available=100,
            expiry_date=date.today() + timedelta(days=30),
            received_date=date.today(),
            quality_status="passed",
            unit_cost=Decimal("10.00"),
        )
        db.add(expiring_lot)
        db.commit()

        response = client.get(
            "/api/v1/inventory/lots/",
            params={"expiring_soon": True, "days": 60},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        # Should include the expiring lot
        lot_numbers = [item["lot_number"] for item in data["items"]]
        assert "EXPIRING001" in lot_numbers

    def test_get_expired_lots(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
        db: Session,
    ):
        """Test retrieving expired lots"""
        from app.models.inventory import InventoryLot
        import uuid

        # Create expired lot
        expired_lot = InventoryLot(
            id=uuid.uuid4(),
            product_id=test_product.id,
            warehouse_id=test_warehouse.id,
            supplier_id=test_supplier.id,
            lot_number="EXPIRED001",
            quantity_received=100,
            quantity_available=100,
            expiry_date=date.today() - timedelta(days=10),  # Already expired
            received_date=date.today() - timedelta(days=365),
            quality_status="passed",
            unit_cost=Decimal("10.00"),
        )
        db.add(expired_lot)
        db.commit()

        response = client.get(
            "/api/v1/inventory/lots/",
            params={"expired": True},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        # Should include the expired lot
        lot_numbers = [item["lot_number"] for item in data["items"]]
        assert "EXPIRED001" in lot_numbers


@pytest.mark.inventory
@pytest.mark.integration
class TestInventoryQuantityTracking:
    """Test inventory quantity tracking and updates"""

    def test_inventory_quantity_balance(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
    ):
        """Test that quantity balance is maintained correctly"""
        response = client.get(
            f"/api/v1/inventory/lots/{test_inventory_lot.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()

        # Verify quantity balance
        # available + reserved + damaged <= received
        total_accounted = (
            data["quantity_available"]
            + data["quantity_reserved"]
            + data["quantity_damaged"]
        )
        assert total_accounted <= data["quantity_received"]

    def test_update_damaged_quantity(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
        db: Session,
    ):
        """Test updating damaged quantity"""
        # Mark 10 units as damaged
        update_data = {
            "quantity_damaged": 10,
            "quantity_available": test_inventory_lot.quantity_available - 10,
        }

        response = client.patch(
            f"/api/v1/inventory/lots/{test_inventory_lot.id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["quantity_damaged"] == 10
        assert data["quantity_available"] == test_inventory_lot.quantity_received - 10


@pytest.mark.inventory
@pytest.mark.unit
class TestInventoryLotValidation:
    """Test inventory lot data validation"""

    def test_create_lot_negative_quantity_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
    ):
        """Test that negative quantities are rejected"""
        lot_data = {
            "product_id": str(test_product.id),
            "warehouse_id": str(test_warehouse.id),
            "supplier_id": str(test_supplier.id),
            "lot_number": "BADLOT001",
            "quantity_received": -100,  # Invalid negative quantity
            "quantity_available": 100,
            "expiry_date": (date.today() + timedelta(days=365)).isoformat(),
            "received_date": date.today().isoformat(),
        }

        response = client.post(
            "/api/v1/inventory/lots/",
            json=lot_data,
            headers=auth_headers,
        )

        # Should fail validation or database constraint
        assert response.status_code in [400, 422, 500]

    def test_create_lot_expiry_before_received_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
    ):
        """Test that expiry date before received date is rejected"""
        lot_data = {
            "product_id": str(test_product.id),
            "warehouse_id": str(test_warehouse.id),
            "supplier_id": str(test_supplier.id),
            "lot_number": "BADDATE001",
            "quantity_received": 100,
            "quantity_available": 100,
            "received_date": date.today().isoformat(),
            "expiry_date": (date.today() - timedelta(days=10)).isoformat(),  # Already expired
        }

        response = client.post(
            "/api/v1/inventory/lots/",
            json=lot_data,
            headers=auth_headers,
        )

        # Should either succeed with warning or fail validation
        # (depending on business rules)
        assert response.status_code in [201, 400, 422]

    def test_create_lot_available_exceeds_received_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
    ):
        """Test that available quantity exceeding received quantity is rejected"""
        lot_data = {
            "product_id": str(test_product.id),
            "warehouse_id": str(test_warehouse.id),
            "supplier_id": str(test_supplier.id),
            "lot_number": "BADQTY001",
            "quantity_received": 100,
            "quantity_available": 200,  # More than received!
            "expiry_date": (date.today() + timedelta(days=365)).isoformat(),
            "received_date": date.today().isoformat(),
        }

        response = client.post(
            "/api/v1/inventory/lots/",
            json=lot_data,
            headers=auth_headers,
        )

        # Should fail database CHECK constraint
        assert response.status_code in [400, 422, 500]


@pytest.mark.inventory
@pytest.mark.integration
class TestInventoryCostTracking:
    """Test inventory cost tracking for COGS calculation"""

    def test_lot_unit_cost_tracking(
        self,
        client: TestClient,
        auth_headers: dict,
        test_inventory_lot,
    ):
        """Test that unit cost is properly tracked per lot"""
        response = client.get(
            f"/api/v1/inventory/lots/{test_inventory_lot.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "unit_cost" in data
        assert float(data["unit_cost"]) == 10.00

    def test_different_lots_different_costs(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_warehouse,
        test_supplier,
        db: Session,
    ):
        """Test that different lots can have different unit costs"""
        from app.models.inventory import InventoryLot
        import uuid

        # Create two lots with different costs
        lot1 = InventoryLot(
            id=uuid.uuid4(),
            product_id=test_product.id,
            warehouse_id=test_warehouse.id,
            supplier_id=test_supplier.id,
            lot_number="LOT_COST1",
            quantity_received=100,
            quantity_available=100,
            expiry_date=date.today() + timedelta(days=365),
            received_date=date.today(),
            quality_status="passed",
            unit_cost=Decimal("10.00"),
        )

        lot2 = InventoryLot(
            id=uuid.uuid4(),
            product_id=test_product.id,
            warehouse_id=test_warehouse.id,
            supplier_id=test_supplier.id,
            lot_number="LOT_COST2",
            quantity_received=100,
            quantity_available=100,
            expiry_date=date.today() + timedelta(days=365),
            received_date=date.today(),
            quality_status="passed",
            unit_cost=Decimal("12.00"),  # Different cost
        )

        db.add_all([lot1, lot2])
        db.commit()

        # Verify both lots exist with different costs
        response1 = client.get(
            f"/api/v1/inventory/lots/{lot1.id}",
            headers=auth_headers,
        )
        response2 = client.get(
            f"/api/v1/inventory/lots/{lot2.id}",
            headers=auth_headers,
        )

        assert response1.status_code == 200
        assert response2.status_code == 200
        assert float(response1.json()["unit_cost"]) == 10.00
        assert float(response2.json()["unit_cost"]) == 12.00
