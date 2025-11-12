"""
Authentication and Authorization Tests
"""
import pytest
from fastapi.testclient import TestClient


class TestAuthentication:
    """Test authentication endpoints"""

    def test_login_success(self, client, admin_user):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin@test.com",
                "password": "admin123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, admin_user):
        """Test login with wrong password"""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin@test.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent@test.com",
                "password": "password"
            }
        )
        assert response.status_code == 401

    def test_get_current_user(self, client, auth_headers_admin):
        """Test get current user endpoint"""
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers_admin
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@test.com"
        assert data["role"] == "admin"

    def test_access_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


class TestAuthorization:
    """Test role-based access control"""

    def test_admin_can_access_users_endpoint(self, client, auth_headers_admin):
        """Test admin can access user management"""
        response = client.get(
            "/api/v1/users/",
            headers=auth_headers_admin
        )
        assert response.status_code == 200

    def test_cashier_cannot_access_users_endpoint(self, client, auth_headers_cashier):
        """Test cashier cannot access user management"""
        response = client.get(
            "/api/v1/users/",
            headers=auth_headers_cashier
        )
        assert response.status_code == 403

    def test_manager_can_create_product(self, client, auth_headers_manager):
        """Test manager can create products"""
        response = client.post(
            "/api/v1/inventory/products/",
            headers=auth_headers_manager,
            json={
                "sku": "NEW001",
                "name_th": "สินค้าใหม่",
                "cost_price": 10.0,
                "selling_price": 20.0
            }
        )
        assert response.status_code in [200, 201]


class TestTokenRefresh:
    """Test token refresh functionality"""

    def test_refresh_token_success(self, client, admin_user):
        """Test token refresh"""
        # First login
        response = client.post(
            "/api/v1/auth/login",
            data={
                "username": "admin@test.com",
                "password": "admin123"
            }
        )
        refresh_token = response.json()["refresh_token"]

        # Refresh token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_with_invalid_token(self, client):
        """Test refresh with invalid token"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"}
        )
        assert response.status_code == 401
