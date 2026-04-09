from sqlalchemy import Column, String, Numeric, Integer, Text, Boolean, TIMESTAMP, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

Base = declarative_base()

class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(Text, nullable=False, default='pending', index=True)
    payment_method = Column(Text, nullable=False, default='cod')
    payment_status = Column(Text, nullable=False, default='pending')
    delivery_address = Column(Text)
    delivery_phone = Column(Text)
    delivery_name = Column(Text)
    subtotal = Column(Numeric, nullable=False, default=0)
    discount_percent = Column(Numeric, nullable=False, default=0)
    total = Column(Numeric, nullable=False, default=0)
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    order_items = relationship('OrderItem', back_populates='order', lazy='selectin')

class BulkOrder(Base):
    __tablename__ = 'bulk_orders'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True))
    company_name = Column(Text)
    contact_name = Column(Text, nullable=False)
    contact_phone = Column(Text, nullable=False)
    contact_email = Column(Text)
    items = Column(JSONB, nullable=False, default=list)
    total_weight_kg = Column(Numeric, nullable=False, default=0)
    discount_percent = Column(Numeric, nullable=False, default=0)
    subtotal = Column(Numeric, nullable=False, default=0)
    total = Column(Numeric, nullable=False, default=0)
    status = Column(Text, nullable=False, default='pending', index=True)
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    category = Column(Text, nullable=False, default='general', index=True)
    type = Column(Text, default='veg', index=True)
    storage = Column(Text, default='frozen')
    prep = Column(Text, default='raw')
    order = Column(Text, nullable=False, default='both')
    pack_sizes = Column(ARRAY(Text), default=list)
    bulk_available = Column(Boolean, nullable=False, default=False)
    price = Column(Numeric, nullable=False, default=0)
    brand_id = Column(Text, ForeignKey('brands.id'), index=True)
    image_path = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    
    brand = relationship('Brand', back_populates='products', lazy='selectin')

class Brand(Base):
    __tablename__ = 'brands'
    
    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    slug = Column(Text, nullable=False, unique=True)
    products_list = Column('products', ARRAY(Text), default=list)
    
    products = relationship('Product', back_populates='brand')

class ProductBrandVariant(Base):
    __tablename__ = 'product_brand_variants'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(Text, ForeignKey('products.id', ondelete='CASCADE'), nullable=False, index=True)
    brand_id = Column(Text, ForeignKey('brands.id', ondelete='CASCADE'), nullable=False, index=True)
    price = Column(Numeric, nullable=False, default=0)

class OrderItem(Base):
    __tablename__ = 'order_items'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey('orders.id', ondelete='CASCADE'), nullable=False)
    product_id = Column(Text, nullable=False)
    product_name = Column(Text, nullable=False)
    brand_name = Column(Text)
    pack_size = Column(Text)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric, nullable=False, default=0)
    total_price = Column(Numeric, nullable=False, default=0)
    
    order = relationship('Order', back_populates='order_items')