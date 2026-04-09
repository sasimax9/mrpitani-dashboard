# mrpitani CRM System - PRD

## Original Problem Statement
Build a CRM system that fetches orders from an existing Supabase setup, accepts them, creates reports, provides order counts, total earnings, updates product prices, and manages them.

## Core Requirements
- Connect to existing Supabase tables (orders, bulk_orders, brands, products, product_brand_variants, order_items)
- Approve/reject pending orders and mark as confirmed/completed
- Basic stats, date range filters, product-wise breakdown, export options
- Modern minimal dashboard with light green and white theme, "mrpitani" branding
- Add products, brands, order items, and product brand variants tabs
- Currency in Rupees
- Supabase admin and supervisor user profile creation with login/logout
- Supabase Storage integration for uploading and fetching product images
- Advanced grids with search, sort, filters, column chooser, and fast pagination

## Tech Stack
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Backend**: FastAPI + SQLAlchemy asyncpg
- **Database**: Supabase PostgreSQL (external)
- **Storage**: Supabase Storage bucket (product-images)
- **Auth**: Custom JWT over crm_users table

## What's Been Implemented

### Authentication
- Custom JWT auth with bcrypt password hashing
- Login/signup endpoints for admin and supervisor roles
- Test credentials: admin@mrpitani.com / admin123

### Dashboard
- Stats cards (total orders, earnings, pending, approved, completed, rejected)
- Orders & Earnings chart (7-day)

### All Grid Tables (7 total) - COMPLETE
All tables now have: Column Chooser, Search, Sort, Pagination, Skeleton Loading
1. **OrdersTable** - Status filter, date range, export CSV, **expandable rows showing order items**
2. **BulkOrdersTable** - Status filter, search, date range, pagination
3. **ProductsTable** - Category filter, search, Add Product, Edit Price
4. **BrandsManagement** - Search, Add Brand, Delete Brand
5. **OrderItemsTable** - Search, sort by product/brand/quantity/price
6. **ProductBrandVariants** - Search, Add Variant, Delete
7. **UsersManagement** - Search, Role filter, activate/deactivate users

### Orders ↔ Order Items Linking
- Clicking an order row expands to show related order items sub-table
- Shows: Product, Brand, Pack Size, Qty, Unit Price, Total
- Linked via orders.id = order_items.order_id

### Product Images (Supabase Storage)
- Reads 34+ images directly from Supabase storage bucket (root, items/, products/ folders)
- Matches images to products via image_path column (20 assigned, 14 unassigned)
- Filter by: All/Assigned/Unassigned
- Search by image name or product name
- Upload image for specific product (sets product's image_path)
- Assign existing bucket image to any product
- Green badges = assigned (with product ID), Orange = unassigned

### UI/UX
- mrpitani branding with sidebar navigation
- Light green/white theme
- All filter dropdowns have opaque white backgrounds (fixed transparency)

## Key API Endpoints
- POST /api/auth/login, /api/auth/signup
- GET /api/dashboard/stats, /api/dashboard/chart-data
- GET /api/orders (with pagination, sort, filter), PATCH /api/orders/{id}/status
- GET /api/bulk-orders, PATCH /api/bulk-orders/{id}/status
- GET /api/products, POST /api/products, PATCH /api/products/{id}/price
- GET /api/brands, POST /api/brands, DELETE /api/brands/{id}
- GET /api/order-items (paginated, searchable)
- GET /api/product-brand-variants, POST/DELETE variants
- GET /api/users (paginated, searchable, filterable by role), PATCH /api/users/{id}
- GET /api/storage/images (reads from Supabase bucket)
- POST /api/products/{id}/image (upload for product)
- PATCH /api/products/{id}/assign-image (assign existing image)
- GET /api/products-simple (lightweight dropdown list)
- GET /api/orders/export (CSV export)

## Remaining Backlog
- P1: Verify role-based access (admin vs supervisor UI restrictions)
- P2: Polish UI responsiveness for mobile
- P2: Data Export (CSV/Excel) for all grids (orders export already done)
- P3: server.py modularization
