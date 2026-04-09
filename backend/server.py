from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse, Response, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from database import get_db, engine
from models import Order, BulkOrder, Product, Brand, OrderItem, User, ProductBrandVariant
import io
import csv
from decimal import Decimal
import bcrypt
import jwt
from datetime import timezone
import uuid as uuid_lib
from supabase_storage import upload_image as supabase_upload, delete_image as supabase_delete

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {'user_id': user_id, 'email': email, 'role': role}
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str
    role: str
    full_name: Optional[str]

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = 'supervisor'

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class DashboardStats(BaseModel):
    total_orders: int
    total_earnings: float
    pending_orders: int
    approved_orders: int
    completed_orders: int
    rejected_orders: int
    total_bulk_orders: int
    pending_bulk_orders: int
    total_products: int
    total_brands: int

class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    brand_name: Optional[str]
    pack_size: Optional[str]
    quantity: int
    unit_price: float
    total_price: float

class OrderResponse(BaseModel):
    id: str
    user_id: str
    status: str
    payment_method: str
    payment_status: str
    delivery_address: Optional[str]
    delivery_phone: Optional[str]
    delivery_name: Optional[str]
    subtotal: float
    discount_percent: float
    total: float
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    order_items: List[OrderItemResponse]

class BulkOrderResponse(BaseModel):
    id: str
    user_id: Optional[str]
    company_name: Optional[str]
    contact_name: str
    contact_phone: str
    contact_email: Optional[str]
    items: list
    total_weight_kg: float
    discount_percent: float
    subtotal: float
    total: float
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    type: Optional[str]
    storage: Optional[str]
    prep: Optional[str]
    order: str
    pack_sizes: List[str]
    bulk_available: bool
    price: float
    brand_id: Optional[str]
    brand_name: Optional[str]
    image_path: Optional[str]
    created_at: datetime

class CreateProductRequest(BaseModel):
    id: str
    name: str
    category: str
    type: Optional[str] = 'veg'
    storage: Optional[str] = 'frozen'
    prep: Optional[str] = 'raw'
    order: str = 'both'
    pack_sizes: List[str] = []
    bulk_available: bool = False
    price: float
    brand_id: Optional[str] = None

class BrandResponse(BaseModel):
    id: str
    name: str
    slug: str
    products_count: int

class CreateBrandRequest(BaseModel):
    id: str
    name: str
    slug: str

class ProductBrandVariantResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    brand_id: str
    brand_name: str
    price: float

class CreateVariantRequest(BaseModel):
    product_id: str
    brand_id: str
    price: float

class UpdateStatusRequest(BaseModel):
    status: str

class UpdatePriceRequest(BaseModel):
    price: float

class ChartData(BaseModel):
    date: str
    orders: int
    earnings: float

class ImageResponse(BaseModel):
    id: str
    storage_path: str
    original_filename: str
    content_type: str
    size: int
    url: str
    created_at: datetime

# Auth endpoints
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")
    
    token = create_token(str(user.id), user.email, user.role)
    return LoginResponse(token=token, email=user.email, role=user.role, full_name=user.full_name)

@api_router.post("/auth/signup", response_model=UserResponse)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role=request.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    
    conditions = []
    if search:
        conditions.append(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%")
            )
        )
    if role:
        conditions.append(User.role == role)
    
    if conditions:
        query = query.where(and_(*conditions))
    
    sort_column = getattr(User, sort_by, User.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return [
        UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at
        )
        for user in users
    ]

@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, request: UpdateUserRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.full_name is not None:
        user.full_name = request.full_name
    if request.role is not None:
        user.role = request.role
    if request.is_active is not None:
        user.is_active = request.is_active
    
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"message": "User updated successfully"}

# Dashboard stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0
    
    pending_result = await db.execute(select(func.count(Order.id)).where(Order.status == 'pending'))
    pending_orders = pending_result.scalar() or 0
    
    approved_result = await db.execute(select(func.count(Order.id)).where(Order.status == 'approved'))
    approved_orders = approved_result.scalar() or 0
    
    completed_result = await db.execute(select(func.count(Order.id)).where(Order.status == 'completed'))
    completed_orders = completed_result.scalar() or 0
    
    rejected_result = await db.execute(select(func.count(Order.id)).where(Order.status == 'rejected'))
    rejected_orders = rejected_result.scalar() or 0
    
    earnings_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.status == 'completed')
    )
    total_earnings = float(earnings_result.scalar() or 0)
    
    total_bulk_result = await db.execute(select(func.count(BulkOrder.id)))
    total_bulk_orders = total_bulk_result.scalar() or 0
    
    pending_bulk_result = await db.execute(select(func.count(BulkOrder.id)).where(BulkOrder.status == 'pending'))
    pending_bulk_orders = pending_bulk_result.scalar() or 0
    
    total_products_result = await db.execute(select(func.count(Product.id)))
    total_products = total_products_result.scalar() or 0
    
    total_brands_result = await db.execute(select(func.count(Brand.id)))
    total_brands = total_brands_result.scalar() or 0
    
    return DashboardStats(
        total_orders=total_orders,
        total_earnings=total_earnings,
        pending_orders=pending_orders,
        approved_orders=approved_orders,
        completed_orders=completed_orders,
        rejected_orders=rejected_orders,
        total_bulk_orders=total_bulk_orders,
        pending_bulk_orders=pending_bulk_orders,
        total_products=total_products,
        total_brands=total_brands
    )

# Orders endpoints
@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: AsyncSession = Depends(get_db)
):
    query = select(Order)
    
    conditions = []
    if status:
        conditions.append(Order.status == status)
    if date_from:
        conditions.append(Order.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        conditions.append(Order.created_at <= datetime.combine(date_to, datetime.max.time()))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Sorting
    sort_column = getattr(Order, sort_by, Order.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return [
        OrderResponse(
            id=str(order.id),
            user_id=str(order.user_id),
            status=order.status,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
            delivery_address=order.delivery_address,
            delivery_phone=order.delivery_phone,
            delivery_name=order.delivery_name,
            subtotal=float(order.subtotal),
            discount_percent=float(order.discount_percent),
            total=float(order.total),
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            order_items=[
                OrderItemResponse(
                    id=str(item.id),
                    product_id=item.product_id,
                    product_name=item.product_name,
                    brand_name=item.brand_name,
                    pack_size=item.pack_size,
                    quantity=item.quantity,
                    unit_price=float(item.unit_price),
                    total_price=float(item.total_price)
                )
                for item in order.order_items
            ]
        )
        for order in orders
    ]

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    request: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = request.status
    order.updated_at = datetime.now()
    await db.commit()
    
    return {"message": "Order status updated successfully", "status": request.status}

@api_router.get("/order-items", response_model=List[OrderItemResponse])
async def get_all_order_items(
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "desc",
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(OrderItem)
    
    # Search
    if search:
        query = query.where(
            or_(
                OrderItem.product_name.ilike(f"%{search}%"),
                OrderItem.brand_name.ilike(f"%{search}%")
            )
        )
    
    # Sorting
    sort_column = getattr(OrderItem, sort_by, OrderItem.id)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return [
        OrderItemResponse(
            id=str(item.id),
            product_id=item.product_id,
            product_name=item.product_name,
            brand_name=item.brand_name,
            pack_size=item.pack_size,
            quantity=item.quantity,
            unit_price=float(item.unit_price),
            total_price=float(item.total_price)
        )
        for item in items
    ]

# Bulk orders endpoints
@api_router.get("/bulk-orders", response_model=List[BulkOrderResponse])
async def get_bulk_orders(
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(BulkOrder)
    
    conditions = []
    if status:
        conditions.append(BulkOrder.status == status)
    if date_from:
        conditions.append(BulkOrder.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        conditions.append(BulkOrder.created_at <= datetime.combine(date_to, datetime.max.time()))
    if search:
        conditions.append(
            or_(
                BulkOrder.company_name.ilike(f"%{search}%"),
                BulkOrder.contact_name.ilike(f"%{search}%")
            )
        )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Sorting
    sort_column = getattr(BulkOrder, sort_by, BulkOrder.created_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    bulk_orders = result.scalars().all()
    
    return [
        BulkOrderResponse(
            id=str(order.id),
            user_id=str(order.user_id) if order.user_id else None,
            company_name=order.company_name,
            contact_name=order.contact_name,
            contact_phone=order.contact_phone,
            contact_email=order.contact_email,
            items=order.items or [],
            total_weight_kg=float(order.total_weight_kg),
            discount_percent=float(order.discount_percent),
            subtotal=float(order.subtotal),
            total=float(order.total),
            status=order.status,
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at
        )
        for order in bulk_orders
    ]

@api_router.patch("/bulk-orders/{order_id}/status")
async def update_bulk_order_status(
    order_id: str,
    request: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(BulkOrder).where(BulkOrder.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(status_code=404, detail="Bulk order not found")
    
    order.status = request.status
    order.updated_at = datetime.now()
    await db.commit()
    
    return {"message": "Bulk order status updated successfully", "status": request.status}

# Products endpoints
@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "name",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(Product)
    
    conditions = []
    if category:
        conditions.append(Product.category == category)
    if search:
        conditions.append(Product.name.ilike(f"%{search}%"))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # Sorting
    sort_column = getattr(Product, sort_by, Product.name)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return [
        ProductResponse(
            id=product.id,
            name=product.name,
            category=product.category,
            type=product.type,
            storage=product.storage,
            prep=product.prep,
            order=product.order,
            pack_sizes=product.pack_sizes or [],
            bulk_available=product.bulk_available,
            price=float(product.price),
            brand_id=product.brand_id,
            brand_name=product.brand.name if product.brand else None,
            image_path=product.image_path,
            created_at=product.created_at
        )
        for product in products
    ]

@api_router.post("/products")
async def create_product(request: CreateProductRequest, db: AsyncSession = Depends(get_db)):
    # Check if product exists
    result = await db.execute(select(Product).where(Product.id == request.id))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Product ID already exists")
    
    product = Product(
        id=request.id,
        name=request.name,
        category=request.category,
        type=request.type,
        storage=request.storage,
        prep=request.prep,
        order=request.order,
        pack_sizes=request.pack_sizes,
        bulk_available=request.bulk_available,
        price=Decimal(str(request.price)),
        brand_id=request.brand_id
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    
    return {"message": "Product created successfully", "id": product.id}

@api_router.patch("/products/{product_id}/price")
async def update_product_price(
    product_id: str,
    request: UpdatePriceRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.price = Decimal(str(request.price))
    await db.commit()
    
    return {"message": "Product price updated successfully", "price": request.price}

# Brands endpoints
@api_router.get("/brands", response_model=List[BrandResponse])
async def get_brands(
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "name",
    sort_order: Optional[str] = "asc",
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # Optimized query with product count as subquery
    product_count_subquery = (
        select(func.count(Product.id))
        .where(Product.brand_id == Brand.id)
        .scalar_subquery()
    )
    
    query = select(Brand, product_count_subquery.label('products_count'))
    
    # Search filter
    if search:
        query = query.where(Brand.name.ilike(f"%{search}%"))
    
    # Sorting
    sort_column = getattr(Brand, sort_by, Brand.name)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        BrandResponse(
            id=brand.id,
            name=brand.name,
            slug=brand.slug,
            products_count=products_count
        )
        for brand, products_count in rows
    ]

@api_router.post("/brands")
async def create_brand(request: CreateBrandRequest, db: AsyncSession = Depends(get_db)):
    # Check if brand exists
    result = await db.execute(select(Brand).where(
        or_(Brand.id == request.id, Brand.slug == request.slug)
    ))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Brand ID or slug already exists")
    
    brand = Brand(
        id=request.id,
        name=request.name,
        slug=request.slug
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    
    return {"message": "Brand created successfully", "id": brand.id}

@api_router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Brand).where(Brand.id == brand_id))
    brand = result.scalar_one_or_none()
    
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    await db.delete(brand)
    await db.commit()
    
    return {"message": "Brand deleted successfully"}

# Product Brand Variants endpoints
@api_router.get("/product-brand-variants", response_model=List[ProductBrandVariantResponse])
async def get_variants(
    page: int = 1,
    limit: int = 50,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "desc",
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(ProductBrandVariant, Product, Brand)
        .join(Product, ProductBrandVariant.product_id == Product.id)
        .join(Brand, ProductBrandVariant.brand_id == Brand.id)
    )
    
    # Search
    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Brand.name.ilike(f"%{search}%")
            )
        )
    
    # Sorting (on variant table)
    if sort_by in ['id', 'price']:
        sort_column = getattr(ProductBrandVariant, sort_by)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(ProductBrandVariant.id))
    
    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        ProductBrandVariantResponse(
            id=str(row[0].id),
            product_id=row[0].product_id,
            product_name=row[1].name,
            brand_id=row[0].brand_id,
            brand_name=row[2].name,
            price=float(row[0].price)
        )
        for row in rows
    ]

@api_router.post("/product-brand-variants")
async def create_variant(request: CreateVariantRequest, db: AsyncSession = Depends(get_db)):
    # Check if variant exists
    result = await db.execute(
        select(ProductBrandVariant).where(
            and_(
                ProductBrandVariant.product_id == request.product_id,
                ProductBrandVariant.brand_id == request.brand_id
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Variant already exists")
    
    variant = ProductBrandVariant(
        product_id=request.product_id,
        brand_id=request.brand_id,
        price=Decimal(str(request.price))
    )
    db.add(variant)
    await db.commit()
    await db.refresh(variant)
    
    return {"message": "Variant created successfully", "id": str(variant.id)}

@api_router.delete("/product-brand-variants/{variant_id}")
async def delete_variant(variant_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductBrandVariant).where(ProductBrandVariant.id == variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    await db.delete(variant)
    await db.commit()
    
    return {"message": "Variant deleted successfully"}

@api_router.patch("/product-brand-variants/{variant_id}/price")
async def update_variant_price(variant_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProductBrandVariant).where(ProductBrandVariant.id == variant_id))
    variant = result.scalar_one_or_none()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    new_price = data.get("price")
    if new_price is None:
        raise HTTPException(status_code=400, detail="Price is required")
    
    variant.price = float(new_price)
    await db.commit()
    
    return {"message": "Variant price updated successfully", "variant_id": variant_id, "price": variant.price}

# Chart data
@api_router.get("/dashboard/chart-data", response_model=List[ChartData])
async def get_chart_data(
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    result = await db.execute(
        select(
            func.date(Order.created_at).label('date'),
            func.count(Order.id).label('orders'),
            func.coalesce(func.sum(Order.total), 0).label('earnings')
        )
        .where(Order.created_at >= start_date)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    
    data = result.all()
    return [
        ChartData(
            date=row.date.strftime('%Y-%m-%d'),
            orders=row.orders,
            earnings=float(row.earnings)
        )
        for row in data
    ]

# Export orders
@api_router.get("/orders/export")
async def export_orders(
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Order)
    
    conditions = []
    if status:
        conditions.append(Order.status == status)
    if date_from:
        conditions.append(Order.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        conditions.append(Order.created_at <= datetime.combine(date_to, datetime.max.time()))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Order ID', 'Customer Name', 'Phone', 'Address', 'Status', 'Payment Method', 'Subtotal', 'Discount %', 'Total', 'Created At'])
    
    for order in orders:
        writer.writerow([
            str(order.id),
            order.delivery_name or '',
            order.delivery_phone or '',
            order.delivery_address or '',
            order.status,
            order.payment_method,
            float(order.subtotal),
            float(order.discount_percent),
            float(order.total),
            order.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )

# Image Management Endpoints - reads from Supabase Storage bucket directly
@api_router.get("/storage/images")
async def list_storage_images(db: AsyncSession = Depends(get_db)):
    """List all images from Supabase storage bucket, matched to products"""
    from supabase_storage import supabase
    
    bucket = "product-images"
    all_images = []
    
    # List root-level files
    try:
        root_files = supabase.storage.from_(bucket).list()
        for f in root_files:
            if f.get("id") and f.get("metadata") and f["metadata"].get("mimetype", "").startswith("image/"):
                path = f["name"]
                all_images.append({
                    "path": path,
                    "name": f["name"],
                    "size": f["metadata"].get("size", 0),
                    "content_type": f["metadata"].get("mimetype", ""),
                    "url": supabase.storage.from_(bucket).get_public_url(path),
                    "created_at": f.get("created_at"),
                })
    except Exception as e:
        logger.warning(f"Error listing root files: {e}")
    
    # List items/ subfolder
    try:
        items_files = supabase.storage.from_(bucket).list("items")
        for f in items_files:
            if f.get("id") and f.get("metadata") and f["metadata"].get("mimetype", "").startswith("image/"):
                path = f"items/{f['name']}"
                all_images.append({
                    "path": path,
                    "name": f["name"],
                    "size": f["metadata"].get("size", 0),
                    "content_type": f["metadata"].get("mimetype", ""),
                    "url": supabase.storage.from_(bucket).get_public_url(path),
                    "created_at": f.get("created_at"),
                })
    except Exception as e:
        logger.warning(f"Error listing items/ files: {e}")
    
    # List products/ subfolder
    try:
        prod_files = supabase.storage.from_(bucket).list("products")
        for f in prod_files:
            if f.get("id") and f.get("metadata") and f["metadata"].get("mimetype", "").startswith("image/"):
                path = f"products/{f['name']}"
                all_images.append({
                    "path": path,
                    "name": f["name"],
                    "size": f["metadata"].get("size", 0),
                    "content_type": f["metadata"].get("mimetype", ""),
                    "url": supabase.storage.from_(bucket).get_public_url(path),
                    "created_at": f.get("created_at"),
                })
    except Exception as e:
        logger.warning(f"Error listing products/ files: {e}")
    
    # Get all products with image_path to match
    result = await db.execute(
        select(Product.id, Product.name, Product.image_path)
        .where(Product.image_path.isnot(None))
    )
    products_with_images = {row[2]: {"product_id": row[0], "product_name": row[1]} for row in result.all()}
    
    # Match images to products
    for img in all_images:
        match = products_with_images.get(img["path"])
        if match:
            img["product_id"] = match["product_id"]
            img["product_name"] = match["product_name"]
        else:
            img["product_id"] = None
            img["product_name"] = None
    
    return all_images

@api_router.post("/products/{product_id}/image")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload image for a specific product to Supabase Storage"""
    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    storage_path = f"products/{product_id}.{ext}"
    
    try:
        result_upload = supabase_upload(storage_path, data, file.content_type)
        # Update product's image_path
        product.image_path = storage_path
        await db.commit()
        
        return {
            "message": "Image uploaded successfully",
            "product_id": product_id,
            "storage_path": storage_path,
            "url": result_upload["url"]
        }
    except Exception as e:
        logger.error(f"Product image upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.patch("/products/{product_id}/assign-image")
async def assign_image_to_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    image_path: str = Query(...)
):
    """Assign an existing bucket image to a product"""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.image_path = image_path
    await db.commit()
    return {"message": "Image assigned to product", "product_id": product_id, "image_path": image_path}

@api_router.get("/products-simple")
async def get_products_simple(db: AsyncSession = Depends(get_db)):
    """Lightweight product list for dropdowns (id + name only)"""
    result = await db.execute(select(Product.id, Product.name).order_by(Product.name))
    return [{"id": row[0], "name": row[1]} for row in result.all()]

@api_router.get("/products/categories")
async def get_product_categories(db: AsyncSession = Depends(get_db)):
    """Get all distinct product categories"""
    result = await db.execute(
        select(Product.category)
        .where(Product.category.isnot(None))
        .distinct()
        .order_by(Product.category)
    )
    return [row[0] for row in result.all()]

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
