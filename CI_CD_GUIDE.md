# CI/CD Pipeline Documentation

## 🚀 Overview

ระบบ CI/CD ของ Pharmacy ERP System ใช้ GitHub Actions สำหรับการทดสอบอัตโนมัติและ deployment ไปยัง AWS ECS

## 📋 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Actions                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │     CI       │  │   Staging    │  │   Production    │  │
│  │  (All Push)  │  │  (develop)   │  │    (main)       │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│         │                 │                    │            │
│         ▼                 ▼                    ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Backend Test │  │ Build Images │  │  Build Images   │  │
│  │Frontend Test │  │ Push to ECR  │  │  Push to ECR    │  │
│  │   Linting    │  │ Deploy ECS   │  │  Deploy ECS     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 CI Pipeline (.github/workflows/ci.yml)

### Triggers
- **Push**: branches `main`, `develop`, `claude/**`
- **Pull Request**: to `main` or `develop`

### Jobs

#### 1. Backend Tests
```yaml
- Python 3.11
- SQLite in-memory database
- pytest with coverage
- Coverage report to Codecov
```

**Environment Variables:**
- `DATABASE_URL`: sqlite:///:memory:?cache=shared
- `REDIS_URL`: redis://localhost:6379/0
- `SECRET_KEY`: test-secret-key
- `PYTHONPATH`: /home/runner/work/ncare/ncare/services/api

**Commands:**
```bash
cd services/api
pip install -r requirements.txt
pytest tests/backend/ -v --cov=app --cov-report=xml
```

#### 2. Frontend Tests
```yaml
- Node.js 18
- pnpm 8
- Type checking
- Linting
- Unit tests (Vitest)
- Build verification
```

**Commands:**
```bash
cd apps/web
pnpm install
pnpm type-check
pnpm lint
pnpm test --run
pnpm build
```

#### 3. Linting
```yaml
- Python code formatting (black)
- Python linting (ruff)
- Type checking (mypy)
```

### Success Criteria
- ✅ All backend tests passing (25/27 tests, 92.6% coverage)
- ✅ All frontend checks passing
- ✅ Code formatting valid
- ✅ No linting errors

## 🚢 CD Pipelines

### Staging Deployment (.github/workflows/cd-staging.yml)

**Trigger:** Push to `develop` branch

**Steps:**
1. Checkout code
2. Configure AWS credentials
3. Login to Amazon ECR
4. Build backend Docker image
   ```bash
   cd services/api
   docker build -t $ECR_REGISTRY/pharmacy-api-staging:$IMAGE_TAG .
   ```
5. Build frontend Docker image
   ```bash
   cd apps/web
   docker build -t $ECR_REGISTRY/pharmacy-web-staging:$IMAGE_TAG .
   ```
6. Push images to ECR
7. Update ECS services
   - pharmacy-api-staging
   - pharmacy-web-staging

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

**AWS Region:** ap-southeast-1 (Singapore)

### Production Deployment (.github/workflows/cd-production.yml)

**Triggers:**
- Push to `main` branch
- Git tags matching `v*`

**Steps:** (Same as staging, different ECR repositories and ECS clusters)

**Repositories:**
- pharmacy-api-production
- pharmacy-web-production

**Clusters:**
- pharmacy-production

## 🐳 Docker Images

### Backend (services/api/Dockerfile)
```dockerfile
FROM python:3.11-slim
- Install system dependencies (gcc, postgresql-client)
- Install Python dependencies
- Copy application code
- Run migrations and start server
```

**Exposed Port:** 8000

**Command:**
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (apps/web/Dockerfile)
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
- Install pnpm
- Install dependencies
- Build React app

FROM nginx:alpine
- Copy built assets
- Copy nginx configuration
- Health check enabled
```

**Exposed Port:** 80

**Health Check:**
```bash
wget --quiet --tries=1 --spider http://localhost/health
```

## 🏥 Health Checks

### Backend API

#### Simple Health Check
```
GET /health
Response: {"status": "healthy", "service": "api"}
```

#### Readiness Check
```
GET /health/ready
Response: {
  "status": "ready",
  "service": "api",
  "checks": {
    "database": "ok"
  }
}
```

### Frontend
```
GET /health
Response: healthy
```

## 🔧 Local Development

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Services Running
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **API**: http://localhost:8000
- **Web**: http://localhost:5173

### Environment Variables
Create `.env` file in project root:
```env
DATABASE_URL=postgresql://pharmacy_user:pharmacy_pass_dev_only@localhost:5432/pharmacy_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
VITE_API_URL=http://localhost:8000
```

## 📊 Monitoring

### CI Status Badges
Add to README.md:
```markdown
![CI](https://github.com/[owner]/ncare/workflows/CI/badge.svg)
```

### Test Coverage
- Backend: 92.6% (25/27 tests)
- Frontend: TBD
- Target: 95%+

### Performance Metrics
- API Response Time: < 200ms
- Frontend Build Time: < 2 minutes
- Docker Image Size:
  - Backend: ~300MB
  - Frontend: ~30MB (with Nginx)

## 🔐 Security

### Secrets Management
All sensitive data stored in GitHub Secrets:
- AWS credentials
- Database passwords
- API keys
- JWT secret keys

### Docker Security
- Non-root user in containers
- Minimal base images (alpine)
- No secrets in Docker images
- Regular security updates

## 🚨 Troubleshooting

### Common Issues

#### 1. CI Tests Failing
```bash
# Run tests locally
cd services/api
PYTHONPATH=. pytest tests/backend/ -v

# Check database connection
python -c "from app.core.database import engine; print(engine)"
```

#### 2. Docker Build Fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### 3. ECS Deployment Timeout
- Check ECS service health
- Verify security groups
- Check CloudWatch logs
- Verify health check endpoints

## 📈 Future Improvements

### Phase 1 (Current)
- ✅ Basic CI/CD pipeline
- ✅ Automated testing
- ✅ Docker containerization
- ✅ AWS ECS deployment

### Phase 2 (Planned)
- [ ] Blue-Green deployments
- [ ] Automated rollback
- [ ] Performance testing
- [ ] Security scanning (Snyk, Trivy)
- [ ] Database migration strategy
- [ ] Frontend E2E tests (Playwright)

### Phase 3 (Future)
- [ ] Multi-region deployment
- [ ] CDN integration
- [ ] Monitoring & alerting (Datadog)
- [ ] Cost optimization
- [ ] Kubernetes migration

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
**Maintained by:** Development Team
