#!/bin/bash

# Pharmacy ERP System - Setup Script
# This script sets up the development environment

set -e

echo "=================================="
echo "Pharmacy ERP System - Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi
echo "✓ Python found: $(python3 --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✓ Docker found: $(docker --version)"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo "✓ Docker Compose found: $(docker-compose --version)"

echo ""
echo "Installing dependencies..."

# Install pnpm if not exists
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
pnpm install

# Setup backend
echo ""
echo "🐍 Setting up backend..."
cd services/api

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

cd ../..

# Copy environment files
echo ""
echo "📝 Setting up environment variables..."

if [ ! -f "services/api/.env" ]; then
    echo "Creating backend .env file..."
    cp services/api/.env.example services/api/.env
    echo "✓ Created services/api/.env (please update with your settings)"
else
    echo "✓ services/api/.env already exists"
fi

if [ ! -f "apps/web/.env" ]; then
    echo "Creating frontend .env file..."
    cp apps/web/.env.example apps/web/.env
    echo "✓ Created apps/web/.env"
else
    echo "✓ apps/web/.env already exists"
fi

# Start Docker services
echo ""
echo "🐳 Starting Docker services (PostgreSQL and Redis)..."
docker-compose up -d postgres redis

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 5

# Run migrations
echo ""
echo "📊 Running database migrations..."
cd services/api
source venv/bin/activate
alembic upgrade head
cd ../..

# Seed database
echo ""
echo "🌱 Seeding database with sample data..."
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd services/api
    source venv/bin/activate
    python -m scripts.seed_data
    cd ../..
fi

echo ""
echo "=================================="
echo "✅ Setup completed successfully!"
echo "=================================="
echo ""
echo "To start the development servers:"
echo ""
echo "Backend:"
echo "  cd services/api"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload"
echo ""
echo "Frontend:"
echo "  cd apps/web"
echo "  pnpm dev"
echo ""
echo "Or use the provided start script:"
echo "  ./scripts/start-dev.sh"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/api/v1/docs"
echo ""
echo "Default login credentials:"
echo "  Email: admin@pharmacy.com"
echo "  Password: admin123"
echo "=================================="
