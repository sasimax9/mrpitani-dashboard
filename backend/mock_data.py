from datetime import datetime, timedelta, timezone
import random
import uuid

# Mock Data
class MockDatabase:
    def __init__(self):
        self.orders = self._generate_orders()
        self.bulk_orders = self._generate_bulk_orders()
        self.products = self._generate_products()
    
    def _generate_products(self):
        products = [
            {
                'id': 'prod-001',
                'name': 'Fresh Tomatoes',
                'category': 'vegetables',
                'type': 'veg',
                'storage': 'fresh',
                'prep': 'raw',
                'order': 'both',
                'pack_sizes': ['1kg', '5kg', '10kg'],
                'bulk_available': True,
                'price': 12.50,
                'brand_id': 'brand-001',
                'brand_name': 'Fresh Farms',
                'image_path': None,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'id': 'prod-002',
                'name': 'Organic Bananas',
                'category': 'fruits',
                'type': 'veg',
                'storage': 'fresh',
                'prep': 'raw',
                'order': 'both',
                'pack_sizes': ['1kg', '3kg'],
                'bulk_available': True,
                'price': 8.99,
                'brand_id': 'brand-001',
                'brand_name': 'Fresh Farms',
                'image_path': None,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'id': 'prod-003',
                'name': 'Premium Milk',
                'category': 'dairy',
                'type': 'veg',
                'storage': 'frozen',
                'prep': 'raw',
                'order': 'both',
                'pack_sizes': ['1L', '2L', '5L'],
                'bulk_available': True,
                'price': 5.50,
                'brand_id': 'brand-002',
                'brand_name': 'Dairy Best',
                'image_path': None,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'id': 'prod-004',
                'name': 'Fresh Carrots',
                'category': 'vegetables',
                'type': 'veg',
                'storage': 'fresh',
                'prep': 'raw',
                'order': 'both',
                'pack_sizes': ['1kg', '5kg'],
                'bulk_available': True,
                'price': 10.00,
                'brand_id': 'brand-001',
                'brand_name': 'Fresh Farms',
                'image_path': None,
                'created_at': datetime.now(timezone.utc)
            },
            {
                'id': 'prod-005',
                'name': 'Organic Apples',
                'category': 'fruits',
                'type': 'veg',
                'storage': 'fresh',
                'prep': 'raw',
                'order': 'both',
                'pack_sizes': ['1kg', '3kg', '5kg'],
                'bulk_available': True,
                'price': 15.99,
                'brand_id': 'brand-001',
                'brand_name': 'Fresh Farms',
                'image_path': None,
                'created_at': datetime.now(timezone.utc)
            }
        ]
        return products
    
    def _generate_orders(self):
        statuses = ['pending', 'approved', 'completed', 'rejected']
        customers = [
            {'name': 'John Smith', 'phone': '+1-555-0101', 'address': '123 Main St, New York'},
            {'name': 'Emma Wilson', 'phone': '+1-555-0102', 'address': '456 Oak Ave, Los Angeles'},
            {'name': 'Michael Brown', 'phone': '+1-555-0103', 'address': '789 Pine Rd, Chicago'},
            {'name': 'Sarah Davis', 'phone': '+1-555-0104', 'address': '321 Elm St, Houston'},
            {'name': 'David Johnson', 'phone': '+1-555-0105', 'address': '654 Maple Dr, Phoenix'},
        ]
        
        orders = []
        for i in range(15):
            customer = random.choice(customers)
            status = random.choice(statuses)
            subtotal = random.uniform(50, 500)
            discount = random.choice([0, 5, 10, 15])
            total = subtotal * (1 - discount/100)
            
            created_date = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
            
            order = {
                'id': str(uuid.uuid4()),
                'user_id': str(uuid.uuid4()),
                'status': status,
                'payment_method': random.choice(['cod', 'card', 'bank_transfer']),
                'payment_status': 'completed' if status == 'completed' else 'pending',
                'delivery_address': customer['address'],
                'delivery_phone': customer['phone'],
                'delivery_name': customer['name'],
                'subtotal': subtotal,
                'discount_percent': discount,
                'total': total,
                'notes': f'Order #{i+1}',
                'created_at': created_date,
                'updated_at': created_date,
                'order_items': [
                    {
                        'id': str(uuid.uuid4()),
                        'product_id': 'prod-001',
                        'product_name': 'Fresh Tomatoes',
                        'brand_name': 'Fresh Farms',
                        'pack_size': '5kg',
                        'quantity': random.randint(1, 5),
                        'unit_price': 12.50,
                        'total_price': 12.50 * random.randint(1, 5)
                    }
                ]
            }
            orders.append(order)
        
        return orders
    
    def _generate_bulk_orders(self):
        companies = [
            {'name': 'Restaurant Group A', 'contact': 'Alice Chen', 'phone': '+1-555-0201', 'email': 'alice@restaurant-a.com'},
            {'name': 'Hotel Chain B', 'contact': 'Bob Martinez', 'phone': '+1-555-0202', 'email': 'bob@hotel-b.com'},
            {'name': 'Catering Services C', 'contact': 'Carol White', 'phone': '+1-555-0203', 'email': 'carol@catering-c.com'},
        ]
        
        bulk_orders = []
        for i in range(8):
            company = random.choice(companies)
            status = random.choice(['pending', 'approved', 'completed'])
            subtotal = random.uniform(500, 5000)
            discount = random.choice([10, 15, 20])
            total = subtotal * (1 - discount/100)
            
            created_date = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 20))
            
            bulk_order = {
                'id': str(uuid.uuid4()),
                'user_id': str(uuid.uuid4()),
                'company_name': company['name'],
                'contact_name': company['contact'],
                'contact_phone': company['phone'],
                'contact_email': company['email'],
                'items': [{'product': 'Tomatoes', 'quantity': 100}, {'product': 'Bananas', 'quantity': 50}],
                'total_weight_kg': random.uniform(100, 1000),
                'discount_percent': discount,
                'subtotal': subtotal,
                'total': total,
                'status': status,
                'notes': f'Bulk order #{i+1}',
                'created_at': created_date,
                'updated_at': created_date
            }
            bulk_orders.append(bulk_order)
        
        return bulk_orders

# Global mock database instance
mock_db = MockDatabase()