# NCare Pharmacy ERP - Backend Testing Documentation

This directory contains comprehensive tests for the NCare Pharmacy ERP API backend.

## 🧪 Test Structure

```
tests/
├── conftest.py           # Pytest configuration and shared fixtures
├── test_main.py          # Basic API health checks
├── test_sales.py         # Sales order endpoint tests
├── test_products.py      # Product management tests
├── test_inventory.py     # Inventory lot tracking tests
└── README.md            # This file
```

## 🚀 Running Tests

### Run all tests:
```bash
cd services/api
pytest
```

### Run with coverage:
```bash
pytest --cov=app --cov-report=html --cov-report=term-missing
```

### Run specific test file:
```bash
pytest tests/test_sales.py -v
```

### Run specific test class:
```bash
pytest tests/test_sales.py::TestSalesOrderCreation -v
```

### Run specific test:
```bash
pytest tests/test_sales.py::TestSalesOrderCreation::test_create_sales_order_success -v
```

### Run tests by marker:
```bash
# Run only sales-related tests
pytest -m sales

# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit

# Run tests excluding slow tests
pytest -m "not slow"
```

## 📊 Test Markers

Tests are categorized using pytest markers:

- `@pytest.mark.unit` - Fast unit tests
- `@pytest.mark.integration` - Integration tests requiring database
- `@pytest.mark.slow` - Slow-running tests
- `@pytest.mark.auth` - Authentication tests
- `@pytest.mark.sales` - Sales endpoint tests
- `@pytest.mark.inventory` - Inventory endpoint tests
- `@pytest.mark.reports` - Report endpoint tests

## 🔧 Test Fixtures

### Database Fixtures
- `db_engine` - Fresh database engine for each test
- `db` - Database session with automatic rollback
- `client` - Test client with database override

### Authentication Fixtures
- `test_user` - Test user with admin role
- `auth_headers` - Authentication headers for API requests

### Data Fixtures
- `test_category` - Sample product category
- `test_product` - Sample product with VAT configuration
- `test_warehouse` - Sample warehouse
- `test_supplier` - Sample supplier
- `test_customer` - Sample customer
- `test_inventory_lot` - Sample inventory lot with stock
- `multiple_inventory_lots` - Multiple lots for FIFO/FEFO testing

## 📝 Test Coverage

### Current Coverage Areas

#### ✅ Sales Orders (`test_sales.py`)
- Order creation with VAT calculation
- Inventory lot selection and reservation
- Race condition prevention (SELECT FOR UPDATE)
- Order completion and payment processing
- Inventory deduction logic
- Insufficient inventory handling
- Discount calculations

#### ✅ Products (`test_products.py`)
- Product CRUD operations
- Product search and filtering
- VAT configuration
- Stock level tracking
- Duplicate SKU prevention
- Negative price validation

#### ✅ Inventory Lots (`test_inventory.py`)
- Lot creation and tracking
- Expiry date management
- Quantity tracking (available, reserved, damaged)
- Cost tracking for COGS
- Expiring/expired lot queries
- Quantity balance validation

### Coverage Goals
- **Minimum Coverage**: 70%
- **Target Coverage**: 80%+
- **Critical Paths**: 95%+

## 🐛 Debugging Tests

### Run tests with more verbose output:
```bash
pytest -vv --tb=long
```

### Run tests with print statements visible:
```bash
pytest -s
```

### Drop into debugger on failure:
```bash
pytest --pdb
```

### Run tests and show slowest tests:
```bash
pytest --durations=10
```

## 🔄 Continuous Integration

Tests are automatically run on every push/PR via GitHub Actions:

- **Code Quality**: Black, Ruff, MyPy
- **Tests**: Full pytest suite with coverage
- **Migration Validation**: Alembic upgrade/downgrade checks
- **Security Scanning**: Safety, Bandit

See `.github/workflows/backend-ci.yml` for full CI/CD pipeline.

## 📈 Writing New Tests

### Test Structure
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

@pytest.mark.integration
@pytest.mark.sales
class TestNewFeature:
    """Test description"""

    def test_feature_success(
        self,
        client: TestClient,
        auth_headers: dict,
        db: Session,
    ):
        """Test successful case"""
        response = client.post(
            "/api/v1/endpoint/",
            json={"data": "value"},
            headers=auth_headers,
        )

        assert response.status_code == 201
        assert response.json()["field"] == "expected"

    def test_feature_failure(
        self,
        client: TestClient,
        auth_headers: dict,
    ):
        """Test failure case"""
        response = client.post(
            "/api/v1/endpoint/",
            json={"invalid": "data"},
            headers=auth_headers,
        )

        assert response.status_code == 400
```

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Use descriptive names**: `test_create_order_with_insufficient_inventory`
4. **Test edge cases**: Empty data, negative values, boundaries
5. **Use fixtures**: Reuse common test data
6. **Mark tests appropriately**: Use `@pytest.mark.*` decorators
7. **Clean up**: Tests should be isolated and repeatable

## 🔒 Security Testing

Security tests should cover:
- SQL injection attempts
- Authentication/authorization bypass
- Input validation
- Rate limiting
- CORS configuration
- Sensitive data exposure

## 📚 Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy Testing](https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Check coverage doesn't decrease
4. Run code quality checks (black, ruff, mypy)
5. Update this README if needed
