from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from database import get_db, engine
from models import Order, BulkOrder, Product, Brand, OrderItem
import io
import csv
from decimal import Decimal

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    email: str

class DashboardStats(BaseModel):
    total_orders: int
    total_earnings: float
    pending_orders: int
    approved_orders: int
    completed_orders: int
    rejected_orders: int
    total_bulk_orders: int
    pending_bulk_orders: int

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

class UpdateStatusRequest(BaseModel):
    status: str

class UpdatePriceRequest(BaseModel):
    price: float

class ChartData(BaseModel):
    date: str
    orders: int
    earnings: float

# Auth endpoint
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@crm.com')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    if request.email == admin_email and request.password == admin_password:
        return LoginResponse(token="admin-token-123", email=request.email)
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Dashboard stats
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Count orders by status
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
    
    # Total earnings from completed orders
    earnings_result = await db.execute(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.status == 'completed')
    )
    total_earnings = float(earnings_result.scalar() or 0)
    
    # Bulk orders stats
    total_bulk_result = await db.execute(select(func.count(BulkOrder.id)))
    total_bulk_orders = total_bulk_result.scalar() or 0
    
    pending_bulk_result = await db.execute(select(func.count(BulkOrder.id)).where(BulkOrder.status == 'pending'))
    pending_bulk_orders = pending_bulk_result.scalar() or 0
    
    return DashboardStats(
        total_orders=total_orders,
        total_earnings=total_earnings,
        pending_orders=pending_orders,
        approved_orders=approved_orders,
        completed_orders=completed_orders,
        rejected_orders=rejected_orders,
        total_bulk_orders=total_bulk_orders,
        pending_bulk_orders=pending_bulk_orders
    )

# Get orders with filters
@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(
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

# Update order status
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

# Get bulk orders
@api_router.get("/bulk-orders", response_model=List[BulkOrderResponse])
async def get_bulk_orders(
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
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
    
    if conditions:
        query = query.where(and_(*conditions))
    
    query = query.order_by(BulkOrder.created_at.desc())
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

# Update bulk order status
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

# Get products
@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
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
    
    query = query.order_by(Product.name)
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

# Update product price
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

# Chart data for dashboard
@api_router.get("/dashboard/chart-data", response_model=List[ChartData])
async def get_chart_data(
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    from datetime import timedelta
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

# Export orders to CSV
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
    
    # Create CSV
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
