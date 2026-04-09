import requests
import sys
from datetime import datetime, date
import json

class CRMAPITester:
    def __init__(self, base_url="https://crm-order-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                self.failed_tests.append({
                    'test': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:500]
                })
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.failed_tests.append({
                'test': name,
                'error': str(e)
            })
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token}")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            required_fields = ['total_orders', 'total_earnings', 'pending_orders', 
                             'approved_orders', 'completed_orders', 'rejected_orders',
                             'total_bulk_orders', 'pending_bulk_orders']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            print(f"   ✅ All required fields present")
        return success

    def test_chart_data(self):
        """Test chart data endpoint"""
        success, response = self.run_test(
            "Chart Data (7 days)",
            "GET",
            "dashboard/chart-data",
            200,
            params={"days": 7}
        )
        if success:
            if isinstance(response, list):
                print(f"   ✅ Chart data is array with {len(response)} entries")
            else:
                print(f"   ⚠️  Chart data should be array, got: {type(response)}")
        return success

    def test_orders_endpoints(self):
        """Test orders related endpoints"""
        # Get all orders
        success1, _ = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        # Get orders with status filter
        success2, _ = self.run_test(
            "Get Orders with Status Filter",
            "GET",
            "orders",
            200,
            params={"status": "pending"}
        )
        
        # Get orders with date filter
        today = date.today().isoformat()
        success3, _ = self.run_test(
            "Get Orders with Date Filter",
            "GET",
            "orders",
            200,
            params={"date_from": today, "date_to": today}
        )
        
        return success1 and success2 and success3

    def test_bulk_orders_endpoints(self):
        """Test bulk orders related endpoints"""
        # Get all bulk orders
        success1, _ = self.run_test(
            "Get All Bulk Orders",
            "GET",
            "bulk-orders",
            200
        )
        
        # Get bulk orders with status filter
        success2, _ = self.run_test(
            "Get Bulk Orders with Status Filter",
            "GET",
            "bulk-orders",
            200,
            params={"status": "pending"}
        )
        
        return success1 and success2

    def test_products_endpoints(self):
        """Test products related endpoints"""
        # Get all products
        success1, _ = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        # Get products with category filter
        success2, _ = self.run_test(
            "Get Products with Category Filter",
            "GET",
            "products",
            200,
            params={"category": "general"}
        )
        
        # Get products with search filter
        success3, _ = self.run_test(
            "Get Products with Search Filter",
            "GET",
            "products",
            200,
            params={"search": "test"}
        )
        
        return success1 and success2 and success3

    def test_export_orders(self):
        """Test orders export endpoint"""
        success, response = self.run_test(
            "Export Orders CSV",
            "GET",
            "orders/export",
            200
        )
        return success

    def test_status_updates(self):
        """Test status update endpoints (will fail if no data exists)"""
        # These will likely return 404 since database is empty
        # But we test the endpoint structure
        
        success1, _ = self.run_test(
            "Update Order Status (Expected 404)",
            "PATCH",
            "orders/test-id/status",
            404,  # Expecting 404 since no orders exist
            data={"status": "approved"}
        )
        
        success2, _ = self.run_test(
            "Update Bulk Order Status (Expected 404)",
            "PATCH",
            "bulk-orders/test-id/status",
            404,  # Expecting 404 since no bulk orders exist
            data={"status": "approved"}
        )
        
        success3, _ = self.run_test(
            "Update Product Price (Expected 404)",
            "PATCH",
            "products/test-id/price",
            404,  # Expecting 404 since no products exist
            data={"price": 99.99}
        )
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting CRM API Testing...")
    print("=" * 50)
    
    # Setup
    tester = CRMAPITester()
    
    # Test login first
    if not tester.test_login("admin@crm.com", "admin123"):
        print("\n❌ Login failed, stopping tests")
        return 1

    print(f"\n📊 Running comprehensive API tests...")
    
    # Test all endpoints
    tests = [
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Chart Data", tester.test_chart_data),
        ("Orders Endpoints", tester.test_orders_endpoints),
        ("Bulk Orders Endpoints", tester.test_bulk_orders_endpoints),
        ("Products Endpoints", tester.test_products_endpoints),
        ("Export Orders", tester.test_export_orders),
        ("Status Updates", tester.test_status_updates),
    ]
    
    for test_name, test_func in tests:
        print(f"\n🔄 Running {test_name}...")
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with error: {str(e)}")

    # Print final results
    print(f"\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"  - {failure.get('test', 'Unknown')}")
            if 'error' in failure:
                print(f"    Error: {failure['error']}")
            else:
                print(f"    Expected: {failure.get('expected')}, Got: {failure.get('actual')}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())