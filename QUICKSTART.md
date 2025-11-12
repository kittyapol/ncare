# 🚀 Quick Start Guide

Get your Pharmacy ERP System up and running in minutes!

## Prerequisites

Ensure you have the following installed:
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Python 3.11+** ([Download](https://www.python.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

## Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup.sh
```

This will:
- Install all dependencies
- Setup environment variables
- Start Docker services (PostgreSQL, Redis)
- Run database migrations
- Seed sample data

## Option 2: Manual Setup

### 1. Install Dependencies

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd services/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Setup Environment Variables

```bash
# Backend
cp services/api/.env.example services/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

Edit `.env` files with your configuration if needed.

### 3. Start Docker Services

```bash
docker-compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
cd services/api
source venv/bin/activate
alembic upgrade head
```

### 5. Seed Sample Data (Optional)

```bash
python -m scripts.seed_data
```

## Running the Application

### Option A: Using Start Script

```bash
./scripts/start-dev.sh
```

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd services/api
source venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
pnpm dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Interactive API Docs**: http://localhost:8000/api/v1/redoc

## Default Login Credentials

```
Admin:
Email: admin@pharmacy.com
Password: admin123

Manager:
Email: manager@pharmacy.com
Password: manager123

Pharmacist:
Email: pharmacist@pharmacy.com
Password: pharmacist123

Cashier:
Email: cashier@pharmacy.com
Password: cashier123
```

## Common Commands

```bash
# Run tests
./scripts/run-tests.sh

# Clean build artifacts
make clean

# View Docker logs
docker-compose logs -f

# Stop Docker services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
cd services/api && alembic upgrade head
python -m scripts.seed_data
```

## Troubleshooting

### Database Connection Error
```bash
# Restart Docker services
docker-compose restart postgres redis

# Check if containers are running
docker-compose ps
```

### Port Already in Use
```bash
# Find and kill process using port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Find and kill process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Module Not Found Error
```bash
# Reinstall dependencies
cd services/api
pip install -r requirements.txt

cd ../../apps/web
pnpm install
```

### Migration Error
```bash
# Reset migrations
cd services/api
rm alembic/versions/*.py  # Keep only your migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## Next Steps

1. **Explore the Dashboard** - View real-time stats and metrics
2. **Try POS System** - Create your first sale
3. **Add Products** - Manage your inventory
4. **Scan Barcodes** - Test the barcode scanner
5. **Generate Reports** - View analytics

## Need Help?

- **Documentation**: See [README.md](./README.md)
- **API Docs**: http://localhost:8000/api/v1/docs
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy coding! 🎉**
