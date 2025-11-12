# Development Guide

This guide provides detailed information for developers working on NCare Pharmacy ERP.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Database](#database)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)

## Prerequisites

### Required

- **Node.js** 18+ and **pnpm** 8+
- **Python** 3.11+
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** and **Docker Compose**

### Recommended

- **VS Code** with extensions:
  - Python
  - Pylance
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

## Project Structure

\`\`\`
ncare/
├── apps/
│   └── web/                    # Frontend Application
│       ├── public/             # Static assets
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   │   ├── forms/      # Form components
│       │   │   ├── modals/     # Modal components
│       │   │   └── receipt/    # Receipt components
│       │   ├── pages/          # Page components
│       │   │   ├── auth/       # Authentication pages
│       │   │   ├── customers/  # Customer management
│       │   │   ├── inventory/  # Inventory pages
│       │   │   ├── purchase/   # Purchase orders
│       │   │   ├── sales/      # Sales & POS
│       │   │   ├── suppliers/  # Supplier management
│       │   │   └── users/      # User management
│       │   ├── services/       # API clients
│       │   ├── types/          # TypeScript types
│       │   └── utils/          # Utility functions
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
│
├── services/
│   └── api/                    # Backend API
│       ├── app/
│       │   ├── api/
│       │   │   └── v1/
│       │   │       └── endpoints/  # API routes
│       │   ├── core/           # Core utilities
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   └── database.py
│       │   ├── models/         # Database models
│       │   ├── schemas/        # Pydantic schemas
│       │   └── main.py         # FastAPI app
│       ├── alembic/            # Database migrations
│       ├── tests/              # Backend tests
│       └── requirements.txt
│
├── infrastructure/
│   └── docker/                 # Docker configs
│
├── tests/
│   ├── backend/                # Backend tests
│   └── e2e/                    # E2E tests
│
├── .github/
│   └── workflows/              # CI/CD
│
├── docker-compose.yml
├── turbo.json
└── package.json
\`\`\`

## Development Setup

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/kittyapol/ncare.git
cd ncare
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install pnpm if not installed
npm install -g pnpm

# Install all dependencies
pnpm install
\`\`\`

### 3. Environment Variables

#### Backend (.env)

Create \`services/api/.env\`:

\`\`\`env
# Database
DATABASE_URL=postgresql://pharmacy_user:pharmacy_pass_dev_only@localhost:5432/pharmacy_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Environment
ENVIRONMENT=development
DEBUG=true

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
\`\`\`

#### Frontend (.env)

Create \`apps/web/.env\`:

\`\`\`env
VITE_API_URL=http://localhost:8000
\`\`\`

### 4. Start Services

#### Option A: Docker Compose (Recommended)

\`\`\`bash
docker-compose up -d
\`\`\`

#### Option B: Manual

**Terminal 1 - Database:**
\`\`\`bash
# Start PostgreSQL
docker run -d \
  -e POSTGRES_DB=pharmacy_db \
  -e POSTGRES_USER=pharmacy_user \
  -e POSTGRES_PASSWORD=pharmacy_pass_dev_only \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine
\`\`\`

**Terminal 2 - Backend:**
\`\`\`bash
cd services/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
\`\`\`

**Terminal 3 - Frontend:**
\`\`\`bash
cd apps/web
pnpm dev
\`\`\`

## Database

### Migrations

\`\`\`bash
cd services/api

# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
\`\`\`

### Database Access

\`\`\`bash
# Using psql
psql postgresql://pharmacy_user:pharmacy_pass_dev_only@localhost:5432/pharmacy_db

# Or using Docker
docker exec -it pharmacy_postgres psql -U pharmacy_user -d pharmacy_db
\`\`\`

### Seed Data

\`\`\`bash
cd services/api
python -m app.scripts.seed_data
\`\`\`

## API Development

### Adding New Endpoint

1. **Create/Update Model** (\`app/models/\`)
2. **Create Schema** (\`app/schemas/\`)
3. **Create Endpoint** (\`app/api/v1/endpoints/\`)
4. **Register Router** (\`app/api/v1/api.py\`)
5. **Write Tests** (\`tests/backend/\`)

### Example: Add Product Endpoint

**1. Model (\`app/models/product.py\`):**
\`\`\`python
from sqlalchemy import Column, String, Numeric
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    sku = Column(String(50), unique=True, nullable=False)
    name_th = Column(String(255), nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=False)
\`\`\`

**2. Schema (\`app/schemas/product.py\`):**
\`\`\`python
from pydantic import BaseModel

class ProductCreate(BaseModel):
    sku: str
    name_th: str
    cost_price: float

class ProductResponse(ProductCreate):
    id: str
\`\`\`

**3. Endpoint (\`app/api/v1/endpoints/products.py\`):**
\`\`\`python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    # Implementation
    pass
\`\`\`

## Frontend Development

### Adding New Page

1. **Create Page Component** (\`src/pages/\`)
2. **Add Route** (\`src/App.tsx\`)
3. **Create Form Component** (\`src/components/forms/\`)
4. **Add API Service** (\`src/services/api.ts\`)
5. **Define Types** (\`src/types/index.ts\`)

### State Management

Using **TanStack Query** for server state:

\`\`\`typescript
// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const response = await api.get('/products/')
    return response.data
  }
})

// Mutation
const createMutation = useMutation({
  mutationFn: async (data) => {
    const response = await api.post('/products/', data)
    return response.data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }
})
\`\`\`

## Testing

### Backend Tests

\`\`\`bash
cd services/api

# Run all tests
pytest

# Run specific test file
pytest tests/backend/test_auth.py

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/backend/test_auth.py::test_login -v
\`\`\`

### Frontend Tests

\`\`\`bash
cd apps/web

# Run tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage

# UI mode
pnpm test --ui
\`\`\`

## Debugging

### Backend Debugging

**VS Code launch.json:**
\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "app.main:app",
        "--reload"
      ],
      "cwd": "${workspaceFolder}/services/api"
    }
  ]
}
\`\`\`

### Frontend Debugging

Use React DevTools browser extension

## Common Tasks

### Reset Database

\`\`\`bash
docker-compose down -v
docker-compose up -d
cd services/api && alembic upgrade head
\`\`\`

### Update Dependencies

\`\`\`bash
# Frontend
cd apps/web && pnpm update

# Backend
cd services/api && pip install --upgrade -r requirements.txt
\`\`\`

### Generate Types from OpenAPI

\`\`\`bash
# Start backend first
cd apps/web
pnpm generate-types
\`\`\`

### Database Backup

\`\`\`bash
docker exec pharmacy_postgres pg_dump -U pharmacy_user pharmacy_db > backup.sql
\`\`\`

### Database Restore

\`\`\`bash
docker exec -i pharmacy_postgres psql -U pharmacy_user pharmacy_db < backup.sql
\`\`\`

## Performance Tips

1. Use database indexes properly
2. Implement caching with Redis
3. Optimize queries with proper joins
4. Use React.memo for expensive components
5. Implement virtual scrolling for large lists
6. Use code splitting for routes

## Security Best Practices

1. Never commit secrets to git
2. Use environment variables
3. Validate all inputs
4. Sanitize user data
5. Use parameterized queries
6. Implement rate limiting
7. Keep dependencies updated

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

Happy Coding! 🚀
