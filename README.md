# Pharmacy ERP System

> Comprehensive Pharmaceutical Warehouse Management System

A modern, full-stack ERP system specifically designed for pharmaceutical businesses, featuring inventory management, point-of-sale, purchase orders, manufacturing (OEM), and comprehensive reporting.

## Features

### Core Modules

1. **Inventory Management** - Complete product catalog, lot tracking, expiry alerts
2. **Sales & POS** - Modern point-of-sale interface, prescription management, receipt generation
3. **Purchase Management** - Purchase orders, supplier management, receiving workflows
4. **Manufacturing (OEM)** - Production orders, Bill of Materials, quality control
5. **Accounting** - Financial tracking, invoicing, reports
6. **CRM** - Customer management, loyalty programs
7. **Barcode System** - Scanner integration, barcode generation
8. **Reports & Analytics** - Business intelligence, dashboards, custom reports
9. **User Management** - Role-based access control, audit logs
10. **Mobile Support** - Responsive web design, mobile barcode scanning

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **State Management**: Zustand + React Query
- **UI**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Barcode**: Quagga2

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Queue**: Celery
- **Auth**: JWT + Supabase Auth
- **Testing**: Pytest + HTTPx

### Infrastructure
- **Development**: Docker Compose
- **Production**: AWS ECS Fargate, RDS Aurora, ElastiCache, S3, CloudFront
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + Sentry

## Project Structure

```
pharmacy-erp-system/
├── apps/
│   └── web/                    # React frontend
├── services/
│   └── api/                    # FastAPI backend
├── packages/
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared TypeScript types
├── infrastructure/
│   ├── terraform/              # AWS infrastructure
│   └── docker/                 # Docker configurations
├── .github/
│   └── workflows/              # CI/CD pipelines
├── docker-compose.yml          # Local development
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- pnpm 8+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/pharmacy-erp-system.git
cd pharmacy-erp-system
```

2. **Install dependencies**
```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd services/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Setup environment variables**
```bash
# Backend
cp services/api/.env.example services/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

4. **Start development environment**
```bash
# Start databases
docker-compose up -d postgres redis

# Run database migrations
cd services/api
alembic upgrade head

# Start backend (terminal 1)
uvicorn app.main:app --reload

# Start frontend (terminal 2)
cd apps/web
pnpm dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

## Database Schema

Key tables:
- `users` - User accounts and authentication
- `products` - Product catalog
- `inventory_lots` - Batch/lot tracking with expiry dates
- `sales_orders` - Sales transactions
- `purchase_orders` - Purchase orders
- `manufacturing_orders` - Production orders
- `customers` - Customer database
- `suppliers` - Supplier management
- `audit_logs` - Audit trail

See [Database Schema Documentation](./docs/database-schema.md) for complete details.

## API Documentation

Interactive API documentation is available at:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc

### Key Endpoints

```
POST   /api/v1/auth/login              # User login
GET    /api/v1/auth/me                 # Get current user
GET    /api/v1/inventory/products      # List products
POST   /api/v1/inventory/products      # Create product
GET    /api/v1/inventory/lots/expiring # Get expiring lots
POST   /api/v1/sales/orders            # Create sales order
GET    /api/v1/reports/dashboard-summary # Dashboard stats
```

## Development

### Running Tests

```bash
# Backend tests
cd services/api
pytest tests/ -v --cov=app

# Frontend tests
cd apps/web
pnpm test
```

### Code Quality

```bash
# Backend
black .                 # Format code
ruff check .           # Lint code
mypy .                 # Type checking

# Frontend
pnpm lint              # ESLint
pnpm type-check        # TypeScript check
```

### Database Migrations

```bash
cd services/api

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

### Staging

Automatically deployed on push to `develop` branch via GitHub Actions.

### Production

Automatically deployed on push to `main` branch or version tags.

### Manual Deployment

```bash
# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Build and push images
docker build -t pharmacy-api:latest services/api
docker build -t pharmacy-web:latest apps/web

# Deploy to ECS (handled by CI/CD)
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pharmacy_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Business Rules

### Inventory
- FIFO (First In, First Out) lot selection
- Automatic expiry alerts 30 days before expiry
- Low stock alerts at reorder point
- Quality status tracking (passed/failed/quarantine)

### Sales
- Prescription required for controlled substances
- Pharmacist approval for certain medications
- 7% VAT calculation
- Receipt generation with lot traceability

### Purchase
- Auto-reorder suggestions
- Quality check on receiving
- Automatic lot creation from received goods

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Audit trail for all critical operations
- Input validation and sanitization
- Rate limiting
- SQL injection prevention
- XSS protection

## Monitoring

- Application metrics via CloudWatch
- Error tracking via Sentry
- Database performance monitoring
- API response time tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - All rights reserved

## Support

For support, email support@pharmacy-erp.com or open an issue on GitHub.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

**Built with ❤️ for the pharmaceutical industry**
