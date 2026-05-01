#!/bin/bash
# Deployment Verification Script
# Run this to verify your production deployment is working correctly

echo "🚀 MrPitani Dashboard - Production Verification Script"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if URL is accessible
check_url() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ $response -eq 200 ] || [ $response -eq 301 ] || [ $response -eq 302 ]; then
        echo -e "${GREEN}✓ OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $response)${NC}"
        return 1
    fi
}

# Get URLs from user
echo "📋 Please provide your deployment URLs:"
echo ""

read -p "Frontend URL (Vercel): " frontend_url
if [ -z "$frontend_url" ]; then
    frontend_url="https://mrpitani-dashboard.vercel.app"
fi

read -p "Backend URL (Railway): " backend_url
if [ -z "$backend_url" ]; then
    backend_url="https://mrpitani-api-production.up.railway.app"
fi

echo ""
echo "🔍 Verifying Deployment..."
echo ""

# Check frontend
echo "1️⃣  Frontend (Vercel)"
check_url "$frontend_url" "Frontend"
frontend_ok=$?

# Check backend health
echo ""
echo "2️⃣  Backend (Railway)"
check_url "$backend_url/docs" "Backend API Docs"
backend_ok=$?

# Check CORS configuration
echo ""
echo "3️⃣  CORS Configuration"
echo -n "Testing CORS headers... "

cors_response=$(curl -s -H "Origin: $frontend_url" \
  -H "Access-Control-Request-Method: GET" \
  -w "\n%{http_code}" \
  "$backend_url/api/health" 2>/dev/null)

http_code=$(echo "$cors_response" | tail -n1)

if echo "$cors_response" | grep -q "access-control-allow-origin"; then
    echo -e "${GREEN}✓ CORS Headers Present${NC}"
else
    if [ $http_code -eq 200 ]; then
        echo -e "${YELLOW}⚠ Check manually - endpoint returned 200${NC}"
    else
        echo -e "${YELLOW}⚠ Could not verify CORS (HTTP $http_code)${NC}"
    fi
fi

# Summary
echo ""
echo "=================================================="
echo "📊 Verification Summary"
echo "=================================================="
echo ""

if [ $frontend_ok -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend is not accessible${NC}"
fi

if [ $backend_ok -eq 0 ]; then
    echo -e "${GREEN}✓ Backend is accessible${NC}"
else
    echo -e "${RED}✗ Backend is not accessible${NC}"
fi

echo ""
echo "🔗 Deployment URLs:"
echo "   Frontend: $frontend_url"
echo "   Backend:  $backend_url"
echo ""

if [ $frontend_ok -eq 0 ] && [ $backend_ok -eq 0 ]; then
    echo -e "${GREEN}✅ All systems operational!${NC}"
else
    echo -e "${YELLOW}⚠️  Some systems need attention${NC}"
    echo "Run verification again or check the troubleshooting guide."
fi

echo ""
echo "📚 For troubleshooting, see: DEPLOYMENT_CHECKLIST.md"
