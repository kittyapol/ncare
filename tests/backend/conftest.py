"""
Pytest configuration and fixtures for backend tests
"""
import pytest
import uuid
from datetime import date, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, TypeDecorator, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Patch UUID and JSONB columns for SQLite compatibility BEFORE importing models
import sqlalchemy.dialects.postgresql as pg
import json
from sqlalchemy import Text

# Store original types before patching
_original_pg_UUID = pg.UUID
_original_pg_JSONB = pg.JSONB

class SQLiteCompatibleUUID(TypeDecorator):
    """Platform-independent UUID type that works with both PostgreSQL and SQLite."""
    impl = String(36)
    cache_ok = True

    def __init__(self, as_uuid=True):
        self.as_uuid = as_uuid
        super().__init__()

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(_original_pg_UUID(as_uuid=self.as_uuid))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            return str(value) if value else None

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        # Always return string for consistent behavior with Pydantic schemas
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value) if value else None

class SQLiteCompatibleJSONB(TypeDecorator):
    """Platform-independent JSONB type that works with both PostgreSQL and SQLite."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(_original_pg_JSONB())
        else:
            return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return value
        else:
            return json.loads(value) if value else None

# Replace types in postgresql dialect
pg.UUID = SQLiteCompatibleUUID
pg.JSONB = SQLiteCompatibleJSONB

# Create test database engine BEFORE importing app
# This ensures app uses the test database
import os

# Use in-memory SQLite with shared cache for test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:?cache=shared"

# Create a single connection that will be reused
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Use StaticPool to maintain single connection
)

# Override database settings before importing app
os.environ["DATABASE_URL"] = SQLALCHEMY_DATABASE_URL

# Import database module and override its engine
from app.core import database
database.engine = test_engine
database.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Now import app modules AFTER patching and overriding database
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product, Category
from app.models.inventory import Warehouse, WarehouseType, InventoryLot
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.sales import SalesOrder, SalesOrderItem
from app.models.purchase import PurchaseOrder, PurchaseOrderItem
from app.models.manufacturing import ManufacturingOrder, BillOfMaterials
from app.models.audit import AuditLog


@pytest.fixture(scope="function")
def db_engine():
    """Create test database engine and tables"""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    # Clean up: Close all sessions and drop all tables
    # This ensures each test starts with a clean slate
    Base.metadata.drop_all(bind=test_engine)


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
def auth_headers_admin(admin_user, client):
    """Get auth headers for admin user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "admin123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_manager(manager_user, client):
    """Get auth headers for manager user"""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "manager@test.com", "password": "manager123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_cashier(cashier_user, client):
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
def sample_inventory_lot(db_session, sample_product, sample_warehouse):
    """Create sample inventory lot with available quantity"""
    lot = InventoryLot(
        lot_number="LOT001",
        batch_number="BATCH001",
        product_id=sample_product.id,
        warehouse_id=sample_warehouse.id,
        quantity_received=100,
        quantity_available=100,
        quantity_reserved=0,
        quantity_damaged=0,
        received_date=date.today(),
        expiry_date=date.today() + timedelta(days=365),
        manufacture_date=date.today() - timedelta(days=30),
    )
    db_session.add(lot)
    db_session.commit()
    db_session.refresh(lot)
    return lot


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
