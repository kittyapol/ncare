# 💊 NCare Pharmacy ERP System

[![CI Pipeline](https://github.com/kittyapol/ncare/actions/workflows/ci.yml/badge.svg)](https://github.com/kittyapol/ncare/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

> **ระบบบริหารจัดการร้านขายยาแบบครบวงจร (Comprehensive Pharmaceutical ERP System)**
> 
> Professional pharmacy management system with Thai tax compliance, inventory tracking, and customer loyalty program.

## 🌟 Features

### ✅ Core Modules (100% Complete)

- **🛒 POS System** - Point of Sale with real-time inventory updates
- **📋 Receipt Printing** - Thai VAT 7% compliant receipts
- **📦 Inventory Management** - Product tracking with lot numbers and expiry dates (FEFO)
- **👥 Customer Management** - CRM with loyalty program (Bronze, Silver, Gold, Platinum)
- **🏢 Supplier Management** - Vendor management with ratings
- **📝 Purchase Orders** - Complete procurement workflow with goods receiving
- **📊 Dashboard Analytics** - Real-time business intelligence
- **👤 User Management** - Role-based access control (Admin, Manager, Pharmacist, Staff, Cashier)

### 🔒 Security Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Admin-only user management

### 🌐 Thai Localization

- ✅ Full Thai language support
- ✅ Thai Baht (THB) currency formatting
- ✅ VAT 7% tax compliance
- ✅ Thai address format
- ✅ Thai date/time formatting

## 🏗️ Architecture

\`\`\`
ncare/
├── apps/
│   └── web/                 # React + TypeScript Frontend
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── pages/       # Page components
│       │   ├── services/    # API clients
│       │   └── types/       # TypeScript definitions
│       └── dist/            # Production build
│
├── services/
│   └── api/                 # FastAPI Backend
│       ├── app/
│       │   ├── api/         # API endpoints
│       │   ├── models/      # SQLAlchemy models
│       │   ├── schemas/     # Pydantic schemas
│       │   └── core/        # Core functionality
│       └── tests/           # Backend tests
│
├── infrastructure/
│   └── docker/              # Docker configurations
│
└── .github/
    └── workflows/           # CI/CD pipelines
\`\`\`

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** and **pnpm 8+**
- **Python 3.11+**
- **PostgreSQL 15+**
- **Redis 7+**

### Option 1: Docker Compose (Recommended)

\`\`\`bash
# Clone the repository
git clone https://github.com/kittyapol/ncare.git
cd ncare

# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
\`\`\`

### Option 2: Local Development

#### Backend Setup

\`\`\`bash
cd services/api

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
\`\`\`

#### Frontend Setup

\`\`\`bash
cd apps/web

# Install pnpm globally (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Frontend will be available at http://localhost:5173
\`\`\`

## 🧪 Testing

### Run All Tests

\`\`\`bash
# Using turbo (monorepo)
pnpm test

# Or run individually
cd apps/web && pnpm test
cd services/api && pytest
\`\`\`

### Backend Tests

\`\`\`bash
cd services/api

# Run all tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/backend/test_auth.py -v
\`\`\`

### Frontend Tests

\`\`\`bash
cd apps/web

# Run tests
pnpm test

# With coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
\`\`\`

## 🔨 Build

### Production Build

\`\`\`bash
# Frontend
cd apps/web
pnpm build

# Backend (Docker)
cd services/api
docker build -t pharmacy-api:latest .
\`\`\`

## 📊 CI/CD

### GitHub Actions Workflows

- **CI Pipeline** - Runs on every push and PR
  - 🔍 Linting (Backend & Frontend)
  - 🧪 Tests with coverage
  - 🏗️ Build verification
  - 🐳 Docker build testing
  - ✅ Integration tests

- **CD Staging** - Auto-deploy to staging on \`develop\` branch
- **CD Production** - Manual deploy to production from \`main\` branch

### CI Status

All commits to \`main\`, \`develop\`, and \`claude/**\` branches trigger the CI pipeline.

[![CI Pipeline](https://github.com/kittyapol/ncare/actions/workflows/ci.yml/badge.svg)](https://github.com/kittyapol/ncare/actions/workflows/ci.yml)

## 📚 API Documentation

### Interactive API Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

\`\`\`
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/refresh            # Refresh token
GET    /api/v1/products/               # List products
POST   /api/v1/sales/orders/           # Create sales order
GET    /api/v1/reports/dashboard-summary  # Dashboard stats
GET    /api/v1/customers/              # List customers
GET    /api/v1/users/                  # List users (Admin only)
\`\`\`

## 🗄️ Database Schema

### Core Tables

- \`users\` - User accounts and authentication
- \`products\` - Product catalog
- \`categories\` - Product categories
- \`inventory_lots\` - Lot tracking with expiry dates
- \`sales_orders\` - Sales transactions
- \`sales_order_items\` - Order line items
- \`purchase_orders\` - Purchase orders
- \`suppliers\` - Vendor information
- \`customers\` - Customer CRM data

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'feat: add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- \`feat:\` - New feature
- \`fix:\` - Bug fix
- \`docs:\` - Documentation changes
- \`style:\` - Code style changes (formatting)
- \`refactor:\` - Code refactoring
- \`test:\` - Adding or updating tests
- \`chore:\` - Maintenance tasks

## 📝 License

This project is licensed under the MIT License.

## 🗺️ Roadmap

### Completed ✅
- [x] POS System
- [x] Receipt Printing
- [x] Inventory Management
- [x] Customer Management
- [x] Supplier Management
- [x] Purchase Orders
- [x] Dashboard Analytics
- [x] User Management
- [x] CI/CD Pipeline

### Planned 🔄
- [ ] Advanced Reports Module
- [ ] Mobile App (React Native)
- [ ] WhatsApp Notifications
- [ ] Barcode Scanner Integration
- [ ] E-Prescription System
- [ ] Multi-branch Support

---

**Made with ❤️ for Thai Pharmacies**
