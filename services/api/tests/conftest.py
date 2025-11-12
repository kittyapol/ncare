"""
Pytest configuration and fixtures for NCare Pharmacy ERP API tests

This file contains shared fixtures for:
- Test database setup/teardown
- Test client configuration
- Authentication helpers
- Sample data factories
"""
import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.warehouse import Warehouse
from app.models.supplier import Supplier
from app.models.customer import Customer
from app.models.inventory import InventoryLot
from app.core.security import get_password_hash
from datetime import date, datetime, timedelta
from decimal import Decimal
import uuid


# Test database URL - using SQLite in-memory for fast tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create a fresh database engine for each test"""
    engine = create_engine(
        SQLALCHEMY_TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def db(db_engine) -> Generator[Session, None, None]:
    """Create a fresh database session for each test"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with overridden database dependency"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db: Session) -> User:
    """Create a test user"""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        password_hash=get_password_hash("testpassword123"),
        full_name="Test User",
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_user: User) -> dict:
    """Get authentication headers for test user"""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword123",
        },
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_category(db: Session) -> Category:
    """Create a test category"""
    category = Category(
        id=uuid.uuid4(),
        code="CAT001",
        name_th="ยาแก้ปวด",
        name_en="Pain Relief",
        is_active=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_product(db: Session, test_category: Category) -> Product:
    """Create a test product"""
    product = Product(
        id=uuid.uuid4(),
        sku="PROD001",
        barcode="1234567890123",
        name_th="พาราเซตามอล 500mg",
        name_en="Paracetamol 500mg",
        category_id=test_category.id,
        cost_price=Decimal("10.00"),
        selling_price=Decimal("15.00"),
        unit_of_measure="tablet",
        minimum_stock=100,
        reorder_point=50,
        is_active=True,
        is_vat_applicable=True,
        vat_rate=Decimal("7.00"),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def test_warehouse(db: Session) -> Warehouse:
    """Create a test warehouse"""
    warehouse = Warehouse(
        id=uuid.uuid4(),
        code="WH001",
        name="Main Warehouse",
        type="main",
        is_active=True,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@pytest.fixture
def test_supplier(db: Session) -> Supplier:
    """Create a test supplier"""
    supplier = Supplier(
        id=uuid.uuid4(),
        code="SUP001",
        name_th="บริษัท ยา จำกัด",
        name_en="Pharmacy Company Ltd",
        tax_id="1234567890123",
        contact_person="John Doe",
        email="supplier@example.com",
        phone="0812345678",
        is_active=True,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@pytest.fixture
def test_customer(db: Session) -> Customer:
    """Create a test customer"""
    customer = Customer(
        id=uuid.uuid4(),
        code="CUST001",
        name="Test Customer",
        phone="0812345678",
        email="customer@example.com",
        loyalty_points=0,
        is_active=True,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@pytest.fixture
def test_inventory_lot(
    db: Session,
    test_product: Product,
    test_warehouse: Warehouse,
    test_supplier: Supplier
) -> InventoryLot:
    """Create a test inventory lot with available stock"""
    lot = InventoryLot(
        id=uuid.uuid4(),
        product_id=test_product.id,
        warehouse_id=test_warehouse.id,
        supplier_id=test_supplier.id,
        lot_number="LOT001",
        batch_number="BATCH001",
        quantity_received=1000,
        quantity_available=1000,
        quantity_reserved=0,
        quantity_damaged=0,
        manufacture_date=date.today() - timedelta(days=30),
        expiry_date=date.today() + timedelta(days=365),
        received_date=date.today() - timedelta(days=30),
        quality_status="passed",
        unit_cost=Decimal("10.00"),
    )
    db.add(lot)
    db.commit()
    db.refresh(lot)
    return lot


@pytest.fixture
def multiple_inventory_lots(
    db: Session,
    test_product: Product,
    test_warehouse: Warehouse,
    test_supplier: Supplier
) -> list[InventoryLot]:
    """Create multiple inventory lots for testing FIFO/FEFO logic"""
    lots = []

    # Lot 1: Older expiry date, should be selected first for FEFO
    lot1 = InventoryLot(
        id=uuid.uuid4(),
        product_id=test_product.id,
        warehouse_id=test_warehouse.id,
        supplier_id=test_supplier.id,
        lot_number="LOT001",
        batch_number="BATCH001",
        quantity_received=100,
        quantity_available=100,
        quantity_reserved=0,
        quantity_damaged=0,
        expiry_date=date.today() + timedelta(days=180),
        received_date=date.today() - timedelta(days=60),
        quality_status="passed",
        unit_cost=Decimal("10.00"),
    )

    # Lot 2: Newer expiry date
    lot2 = InventoryLot(
        id=uuid.uuid4(),
        product_id=test_product.id,
        warehouse_id=test_warehouse.id,
        supplier_id=test_supplier.id,
        lot_number="LOT002",
        batch_number="BATCH002",
        quantity_received=100,
        quantity_available=100,
        quantity_reserved=0,
        quantity_damaged=0,
        expiry_date=date.today() + timedelta(days=365),
        received_date=date.today() - timedelta(days=30),
        quality_status="passed",
        unit_cost=Decimal("10.00"),
    )

    db.add(lot1)
    db.add(lot2)
    db.commit()
    db.refresh(lot1)
    db.refresh(lot2)

    return [lot1, lot2]


# Markers for test categorization
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line("markers", "auth: Authentication related tests")
    config.addinivalue_line("markers", "sales: Sales endpoint tests")
    config.addinivalue_line("markers", "inventory: Inventory endpoint tests")
    config.addinivalue_line("markers", "reports: Report endpoint tests")
