"""
Backend API tests for CRM Order Hub - New Features
Tests: Orders with order_items, Storage images, Product image assignment
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://crm-order-hub.preview.emergentagent.com')

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@mrpitani.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "admin@mrpitani.com"
        assert data["role"] == "admin"
        assert "full_name" in data
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401


class TestDashboard:
    """Dashboard stats endpoint tests"""
    
    def test_dashboard_stats(self):
        """Test dashboard stats returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields exist
        required_fields = [
            "total_orders", "total_earnings", "pending_orders", 
            "approved_orders", "completed_orders", "rejected_orders",
            "total_bulk_orders", "pending_bulk_orders", 
            "total_products", "total_brands"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Verify data types
        assert isinstance(data["total_orders"], int)
        assert isinstance(data["total_products"], int)
        assert data["total_products"] == 176  # Expected 176 products


class TestOrdersWithItems:
    """Orders endpoint tests - verifying order_items are included"""
    
    def test_orders_list_includes_order_items(self):
        """Test that orders endpoint returns order_items for expandable rows"""
        response = requests.get(f"{BASE_URL}/api/orders?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        
        # Check if any order has order_items
        if len(data) > 0:
            order = data[0]
            assert "order_items" in order, "Orders should include order_items for expandable rows"
            assert isinstance(order["order_items"], list)
            
            # Verify order structure
            assert "id" in order
            assert "status" in order
            assert "total" in order
            assert "delivery_name" in order
            
            # If order has items, verify item structure
            if len(order["order_items"]) > 0:
                item = order["order_items"][0]
                required_item_fields = [
                    "id", "product_id", "product_name", "brand_name",
                    "pack_size", "quantity", "unit_price", "total_price"
                ]
                for field in required_item_fields:
                    assert field in item, f"Order item missing field: {field}"
    
    def test_orders_filter_by_status(self):
        """Test orders can be filtered by status"""
        response = requests.get(f"{BASE_URL}/api/orders?status=approved")
        assert response.status_code == 200
        data = response.json()
        
        # All returned orders should have approved status
        for order in data:
            assert order["status"] == "approved"
    
    def test_orders_pagination(self):
        """Test orders pagination works"""
        response = requests.get(f"{BASE_URL}/api/orders?page=1&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5


class TestStorageImages:
    """Storage images endpoint tests - Supabase bucket integration"""
    
    def test_storage_images_list(self):
        """Test storage images endpoint returns images from Supabase bucket"""
        response = requests.get(f"{BASE_URL}/api/storage/images")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 34, f"Expected 34 images, got {len(data)}"
    
    def test_storage_images_structure(self):
        """Test each image has required fields"""
        response = requests.get(f"{BASE_URL}/api/storage/images")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            image = data[0]
            required_fields = ["path", "name", "size", "content_type", "url"]
            for field in required_fields:
                assert field in image, f"Image missing field: {field}"
            
            # Verify URL is valid Supabase URL
            assert "supabase.co" in image["url"]
    
    def test_storage_images_product_matching(self):
        """Test images are matched to products via image_path"""
        response = requests.get(f"{BASE_URL}/api/storage/images")
        assert response.status_code == 200
        data = response.json()
        
        # Count assigned vs unassigned
        assigned = [img for img in data if img.get("product_id")]
        unassigned = [img for img in data if not img.get("product_id")]
        
        assert len(assigned) == 20, f"Expected 20 assigned images, got {len(assigned)}"
        assert len(unassigned) == 14, f"Expected 14 unassigned images, got {len(unassigned)}"
        
        # Verify assigned images have product_name
        for img in assigned:
            assert img.get("product_name"), "Assigned image should have product_name"


class TestProductsSimple:
    """Products simple endpoint tests - for dropdowns"""
    
    def test_products_simple_list(self):
        """Test products-simple returns lightweight product list"""
        response = requests.get(f"{BASE_URL}/api/products-simple")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 176, f"Expected 176 products, got {len(data)}"
    
    def test_products_simple_structure(self):
        """Test products-simple returns only id and name"""
        response = requests.get(f"{BASE_URL}/api/products-simple")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            product = data[0]
            assert "id" in product
            assert "name" in product
            # Should be lightweight - only id and name
            assert len(product.keys()) == 2, "products-simple should only return id and name"


class TestProductImageAssignment:
    """Product image assignment endpoint tests"""
    
    def test_assign_image_to_product_invalid_product(self):
        """Test assigning image to non-existent product returns 404"""
        response = requests.patch(
            f"{BASE_URL}/api/products/INVALID_PRODUCT_ID/assign-image",
            params={"image_path": "test.jpg"}
        )
        assert response.status_code == 404
    
    def test_assign_image_endpoint_exists(self):
        """Test assign-image endpoint is accessible"""
        # Get a valid product ID first
        products_response = requests.get(f"{BASE_URL}/api/products-simple")
        products = products_response.json()
        
        if len(products) > 0:
            product_id = products[0]["id"]
            # Test with a valid product - should work
            response = requests.patch(
                f"{BASE_URL}/api/products/{product_id}/assign-image",
                params={"image_path": "test-path.jpg"}
            )
            # Should return 200 (success) not 404 or 500
            assert response.status_code == 200


class TestOtherGridEndpoints:
    """Tests for other grid tabs - Bulk Orders, Products, Brands, etc."""
    
    def test_bulk_orders_list(self):
        """Test bulk orders endpoint"""
        response = requests.get(f"{BASE_URL}/api/bulk-orders")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_products_list(self):
        """Test products endpoint with pagination and sorting"""
        response = requests.get(f"{BASE_URL}/api/products?page=1&limit=10&sort_by=name&sort_order=asc")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10
    
    def test_brands_list(self):
        """Test brands endpoint"""
        response = requests.get(f"{BASE_URL}/api/brands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            brand = data[0]
            assert "id" in brand
            assert "name" in brand
            assert "products_count" in brand
    
    def test_order_items_list(self):
        """Test order items endpoint"""
        response = requests.get(f"{BASE_URL}/api/order-items")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_product_brand_variants_list(self):
        """Test product brand variants endpoint"""
        response = requests.get(f"{BASE_URL}/api/product-brand-variants")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_users_list(self):
        """Test users endpoint"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
