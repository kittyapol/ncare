from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    products,
    inventory,
    sales,
    purchase,
    reports,
    categories,
    suppliers,
    customers,
    users,
)

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/inventory/products", tags=["Products"])
api_router.include_router(categories.router, prefix="/inventory/categories", tags=["Categories"])
api_router.include_router(inventory.router, prefix="/inventory/lots", tags=["Inventory Lots"])
api_router.include_router(sales.router, prefix="/sales", tags=["Sales"])
api_router.include_router(purchase.router, prefix="/purchase", tags=["Purchase"])
api_router.include_router(suppliers.router, prefix="/purchase/suppliers", tags=["Suppliers"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
