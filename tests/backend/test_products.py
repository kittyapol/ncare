"""
Product Management Tests
"""
import pytest


class TestProductCRUD:
    """Test product CRUD operations"""

    def test_create_product(self, client, auth_headers_admin, sample_category):
        """Test creating a product"""
        response = client.post(
            "/api/v1/inventory/products/",
            headers=auth_headers_admin,
            json={
                "sku": "PROD001",
                "barcode": "9876543210123",
                "name_th": "ยาใหม่",
                "name_en": "New Medicine",
                "category_id": str(sample_category.id),
                "cost_price": 75.50,
                "selling_price": 150.00,
                "is_vat_applicable": True,
                "vat_rate": 7.0,
                "minimum_stock": 20,
                "reorder_point": 50
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["sku"] == "PROD001"
        assert data["name_th"] == "ยาใหม่"
        assert float(data["selling_price"]) == 150.00

    def test_create_product_duplicate_sku(self, client, auth_headers_admin, sample_product):
        """Test creating product with duplicate SKU"""
        response = client.post(
            "/api/v1/inventory/products/",
            headers=auth_headers_admin,
            json={
                "sku": sample_product.sku,  # Duplicate SKU
                "name_th": "ยาอื่น",
                "cost_price": 10.0,
                "selling_price": 20.0
            }
        )
        assert response.status_code == 400

    def test_get_product_list(self, client, auth_headers_admin, sample_product):
        """Test getting product list"""
        response = client.get(
            "/api/v1/inventory/products/",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_get_product_by_id(self, client, auth_headers_admin, sample_product):
        """Test getting product by ID"""
        response = client.get(
            f"/api/v1/inventory/products/{sample_product.id}",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sku"] == sample_product.sku

    def test_update_product(self, client, auth_headers_admin, sample_product):
        """Test updating product"""
        response = client.put(
            f"/api/v1/inventory/products/{sample_product.id}",
            headers=auth_headers_admin,
            json={
                "selling_price": 120.00
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert float(data["selling_price"]) == 120.00

    def test_search_products(self, client, auth_headers_admin, sample_product):
        """Test product search"""
        response = client.get(
            "/api/v1/inventory/products/search",
            headers=auth_headers_admin,
            params={"q": "ทดสอบ"}
        )
        assert response.status_code == 200
        products = response.json()
        assert len(products) > 0


class TestVATCalculations:
    """Test VAT calculations on products"""

    def test_vat_applicable_product(self, client, auth_headers_admin, sample_category):
        """Test VAT-applicable product"""
        response = client.post(
            "/api/v1/inventory/products/",
            headers=auth_headers_admin,
            json={
                "sku": "VAT001",
                "name_th": "สินค้า VAT",
                "cost_price": 100.00,
                "selling_price": 200.00,
                "is_vat_applicable": True,
                "vat_rate": 7.0,
                "category_id": str(sample_category.id)
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_vat_applicable"] is True
        assert float(data["vat_rate"]) == 7.0

    def test_non_vat_product(self, client, auth_headers_admin, sample_category):
        """Test non-VAT product"""
        response = client.post(
            "/api/v1/inventory/products/",
            headers=auth_headers_admin,
            json={
                "sku": "NONVAT001",
                "name_th": "สินค้า Non-VAT",
                "cost_price": 100.00,
                "selling_price": 200.00,
                "is_vat_applicable": False,
                "vat_rate": 0.0,
                "category_id": str(sample_category.id)
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_vat_applicable"] is False
        assert float(data["vat_rate"]) == 0.0
