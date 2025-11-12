from fastapi import APIRouter
from app.api.v1.endpoints import auth, products, inventory, sales, purchase, reports

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/inventory/products", tags=["Products"])
api_router.include_router(inventory.router, prefix="/inventory/lots", tags=["Inventory Lots"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"])
api_router.include_router(purchase.router, prefix="/purchase", tags=["Purchase"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
