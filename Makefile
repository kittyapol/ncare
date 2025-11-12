.PHONY: help setup dev test clean deploy

help:
	@echo "Pharmacy ERP System - Available commands:"
	@echo "  make setup    - Initial project setup"
	@echo "  make dev      - Start development environment"
	@echo "  make test     - Run all tests"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make deploy   - Deploy to production"

setup:
	@echo "Setting up project..."
	pnpm install
	cd services/api && python -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cp services/api/.env.example services/api/.env
	cp apps/web/.env.example apps/web/.env
	@echo "Setup complete! Run 'make dev' to start."

dev:
	@echo "Starting development environment..."
	docker-compose up -d postgres redis
	@echo "Databases started. Run backend and frontend separately:"
	@echo "  Terminal 1: cd services/api && uvicorn app.main:app --reload"
	@echo "  Terminal 2: cd apps/web && pnpm dev"

test:
	@echo "Running tests..."
	cd services/api && pytest tests/ -v
	cd apps/web && pnpm test

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +
	find . -type d -name dist -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

deploy:
	@echo "Deploying to production..."
	cd infrastructure/terraform && terraform apply
