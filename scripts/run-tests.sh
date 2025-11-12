#!/bin/bash

# Pharmacy ERP System - Test Runner Script

set -e

echo "=================================="
echo "Running Tests"
echo "=================================="
echo ""

# Backend tests
echo "Running backend tests..."
cd services/api
source venv/bin/activate
pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html
echo "✓ Backend tests completed"
echo "Coverage report: services/api/htmlcov/index.html"
cd ../..

echo ""

# Frontend tests (if configured)
# echo "Running frontend tests..."
# cd apps/web
# pnpm test
# cd ../..

echo ""
echo "=================================="
echo "✅ All tests passed!"
echo "=================================="
