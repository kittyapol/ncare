from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.product import Product
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductList

router = APIRouter()


@router.get("/", response_model=ProductList)
def get_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    drug_type: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get all products with filters"""
    query = db.query(Product)

    # Apply filters
    if search:
        query = query.filter(
            or_(
                Product.name_th.ilike(f"%{search}%"),
                Product.name_en.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
                Product.barcode.ilike(f"%{search}%"),
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if drug_type:
        query = query.filter(Product.drug_type == drug_type)

    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    # Get total count
    total = query.count()

    # Apply pagination
    products = query.offset(skip).limit(limit).all()

    return {"items": products, "total": total, "skip": skip, "limit": limit}


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create new product"""
    # Check if SKU exists
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Check if barcode exists
    if product_in.barcode:
        existing = db.query(Product).filter(Product.barcode == product_in.barcode).first()
        if existing:
            raise HTTPException(status_code=400, detail="Barcode already exists")

    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get product by ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Soft delete product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = False
    db.commit()

    return {"message": "Product deleted successfully"}


@router.get("/search", response_model=List[ProductResponse])
def search_products(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Quick search products"""
    products = (
        db.query(Product)
        .filter(
            Product.is_active == True,
            or_(
                Product.name_th.ilike(f"%{q}%"),
                Product.name_en.ilike(f"%{q}%"),
                Product.sku.ilike(f"%{q}%"),
                Product.barcode.ilike(f"%{q}%"),
            ),
        )
        .limit(limit)
        .all()
    )

    return products
