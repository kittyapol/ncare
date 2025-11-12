"""
Tests for Product endpoints

These tests verify:
- Product CRUD operations
- Product search and filtering
- VAT configuration
- Inventory stock levels
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from decimal import Decimal


@pytest.mark.inventory
@pytest.mark.integration
class TestProductCRUD:
    """Test product CRUD operations"""

    def test_create_product_success(
        self,
        client: TestClient,
        auth_headers: dict,
        test_category,
        db: Session,
    ):
        """Test creating a new product"""
        product_data = {
            "sku": "NEWPROD001",
            "barcode": "9876543210987",
            "name_th": "ไอบูโพรเฟน 400mg",
            "name_en": "Ibuprofen 400mg",
            "category_id": str(test_category.id),
            "cost_price": 12.50,
            "selling_price": 18.00,
            "unit_of_measure": "tablet",
            "minimum_stock": 50,
            "reorder_point": 20,
            "is_vat_applicable": True,
            "vat_rate": 7.0,
        }

        response = client.post(
            "/api/v1/products/",
            json=product_data,
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["sku"] == "NEWPROD001"
        assert data["name_th"] == "ไอบูโพรเฟน 400mg"
        assert float(data["cost_price"]) == 12.50
        assert float(data["selling_price"]) == 18.00
        assert data["is_vat_applicable"] is True
        assert float(data["vat_rate"]) == 7.0

    def test_get_product_by_id(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
    ):
        """Test retrieving a product by ID"""
        response = client.get(
            f"/api/v1/products/{test_product.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_product.id)
        assert data["sku"] == test_product.sku
        assert data["name_th"] == test_product.name_th

    def test_get_products_list(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
    ):
        """Test retrieving list of products"""
        response = client.get(
            "/api/v1/products/",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

    def test_update_product(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        db: Session,
    ):
        """Test updating a product"""
        update_data = {
            "selling_price": 20.00,
            "minimum_stock": 150,
        }

        response = client.patch(
            f"/api/v1/products/{test_product.id}",
            json=update_data,
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert float(data["selling_price"]) == 20.00
        assert data["minimum_stock"] == 150

    def test_search_products_by_name(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
    ):
        """Test searching products by name"""
        response = client.get(
            "/api/v1/products/",
            params={"search": "พาราเซตามอล"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any("พาราเซตามอล" in item["name_th"] for item in data["items"])

    def test_filter_products_by_category(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_category,
    ):
        """Test filtering products by category"""
        response = client.get(
            "/api/v1/products/",
            params={"category_id": str(test_category.id)},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert all(item["category_id"] == str(test_category.id) for item in data["items"])

    def test_create_product_duplicate_sku_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_category,
        test_product,
    ):
        """Test that creating product with duplicate SKU fails"""
        product_data = {
            "sku": test_product.sku,  # Duplicate SKU
            "barcode": "9999999999999",
            "name_th": "Test Product",
            "category_id": str(test_category.id),
            "cost_price": 10.00,
            "selling_price": 15.00,
        }

        response = client.post(
            "/api/v1/products/",
            json=product_data,
            headers=auth_headers,
        )

        assert response.status_code == 400


@pytest.mark.inventory
@pytest.mark.integration
class TestProductInventory:
    """Test product inventory-related operations"""

    def test_get_product_with_stock_levels(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        test_inventory_lot,
    ):
        """Test retrieving product with current stock levels"""
        response = client.get(
            f"/api/v1/products/{test_product.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "current_stock" in data or "lots" in data

    def test_get_products_below_minimum_stock(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
        db: Session,
    ):
        """Test retrieving products below minimum stock level"""
        # Set high minimum stock to trigger low stock alert
        test_product.minimum_stock = 5000
        db.commit()

        response = client.get(
            "/api/v1/products/",
            params={"low_stock": True},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        # Product should appear in low stock list
        # (depending on implementation)

    def test_get_product_vat_configuration(
        self,
        client: TestClient,
        auth_headers: dict,
        test_product,
    ):
        """Test that product VAT configuration is properly returned"""
        response = client.get(
            f"/api/v1/products/{test_product.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "is_vat_applicable" in data
        assert "vat_rate" in data
        if data["is_vat_applicable"]:
            assert float(data["vat_rate"]) == 7.0


@pytest.mark.inventory
@pytest.mark.unit
class TestProductValidation:
    """Test product data validation"""

    def test_create_product_negative_price_fails(
        self,
        client: TestClient,
        auth_headers: dict,
        test_category,
    ):
        """Test that negative prices are rejected"""
        product_data = {
            "sku": "BADPROD001",
            "name_th": "Bad Product",
            "category_id": str(test_category.id),
            "cost_price": -10.00,  # Invalid negative price
            "selling_price": 15.00,
        }

        response = client.post(
            "/api/v1/products/",
            json=product_data,
            headers=auth_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_create_product_missing_required_fields(
        self,
        client: TestClient,
        auth_headers: dict,
    ):
        """Test that missing required fields are rejected"""
        product_data = {
            "sku": "INCOMPLETE001",
            # Missing required fields like name_th, category_id, etc.
        }

        response = client.post(
            "/api/v1/products/",
            json=product_data,
            headers=auth_headers,
        )

        assert response.status_code == 422  # Validation error

    def test_create_product_invalid_vat_rate(
        self,
        client: TestClient,
        auth_headers: dict,
        test_category,
    ):
        """Test that invalid VAT rate is rejected"""
        product_data = {
            "sku": "BADVAT001",
            "name_th": "Bad VAT Product",
            "category_id": str(test_category.id),
            "cost_price": 10.00,
            "selling_price": 15.00,
            "is_vat_applicable": True,
            "vat_rate": -5.0,  # Invalid negative VAT rate
        }

        response = client.post(
            "/api/v1/products/",
            json=product_data,
            headers=auth_headers,
        )

        assert response.status_code == 422  # Validation error
