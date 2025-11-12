"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product, Category
from app.models.warehouse import Warehouse, WarehouseType
from app.models.supplier import Supplier

# Test database URL (in-memory SQLite for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_engine():
    """Create test database engine"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create test database session"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    """Create admin user"""
    user = User(
        email="admin@test.com",
        password_hash=get_password_hash("admin123"),
        full_name="Admin Test",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def manager_user(db_session):
    """Create manager user"""
    user = User(
        email="manager@test.com",
        password_hash=get_password_hash("manager123"),
        full_name="Manager Test",
        role=UserRole.MANAGER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def cashier_user(db_session):
    """Create cashier user"""
    user = User(
        email="cashier@test.com",
        password_hash=get_password_hash("cashier123"),
        full_name="Cashier Test",
        role=UserRole.CASHIER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_admin(client, admin_user):
    """Get auth headers for admin user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "admin123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_manager(client, manager_user):
    """Get auth headers for manager user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "manager@test.com", "password": "manager123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_cashier(client, cashier_user):
    """Get auth headers for cashier user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "cashier@test.com", "password": "cashier123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_category(db_session):
    """Create sample category"""
    category = Category(
        code="CAT001",
        name_th="ยาแก้ปวด",
        name_en="Pain Relief"
    )
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def sample_product(db_session, sample_category):
    """Create sample product"""
    product = Product(
        sku="TEST001",
        barcode="1234567890123",
        name_th="ยาทดสอบ",
        name_en="Test Medicine",
        category_id=sample_category.id,
        cost_price=50.00,
        selling_price=100.00,
        is_vat_applicable=True,
        vat_rate=7.00,
        minimum_stock=10,
        reorder_point=20
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


@pytest.fixture
def sample_warehouse(db_session):
    """Create sample warehouse"""
    warehouse = Warehouse(
        code="WH001",
        name="Main Warehouse",
        type=WarehouseType.MAIN
    )
    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)
    return warehouse


@pytest.fixture
def sample_supplier(db_session):
    """Create sample supplier"""
    supplier = Supplier(
        code="SUP001",
        name_th="ผู้จำหน่ายทดสอบ",
        name_en="Test Supplier",
        tax_id="0123456789012"
    )
    db_session.add(supplier)
    db_session.commit()
    db_session.refresh(supplier)
    return supplier
