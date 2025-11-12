from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.api import api_router

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Comprehensive Pharmaceutical Warehouse Management System",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Pharmacy ERP System API",
        "version": "1.0.0",
        "status": "running",
        "docs": f"{settings.API_V1_PREFIX}/docs",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring
    Returns basic health status without dependencies
    """
    return {"status": "healthy", "service": "api"}


@app.get("/health/ready")
async def readiness_check():
    """
    Readiness check endpoint - checks if service can handle requests
    Checks database connectivity and other dependencies
    """
    from app.core.database import SessionLocal
    from sqlalchemy import text

    health_status = {
        "status": "ready",
        "service": "api",
        "checks": {}
    }

    # Check database connection
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["status"] = "not_ready"
        health_status["checks"]["database"] = f"error: {str(e)}"
        return JSONResponse(
            status_code=503,
            content=health_status
        )

    return health_status


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
