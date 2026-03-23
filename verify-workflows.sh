#!/bin/bash
# MegiLance Workflow Verification Script
# This script tests and verifies all client and freelancer workflows

set -e

echo "=========================================="
echo "MegiLance Workflow Verification Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "🔍 Checking backend availability..."
if curl -s http://localhost:8000/api/health/ready > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running at http://localhost:8000${NC}"
    echo "Start backend with: cd backend && python -m uvicorn main:app --reload --port 8000"
    exit 1
fi

# Check if frontend is running
echo "🔍 Checking frontend availability..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is NOT running at http://localhost:3000${NC}"
    echo "Start frontend with: cd frontend && npm run dev"
fi

echo ""
echo "=========================================="
echo "Running E2E Tests"
echo "=========================================="
echo ""

cd backend

# Install dependencies if needed
if ! python -c "import pytest" 2>/dev/null; then
    echo "Installing test dependencies..."
    pip install -r requirements.txt
fi

# Run the E2E tests
echo "Running comprehensive E2E tests..."
python -m pytest tests/test_e2e_complete_flows.py -v --tb=short 2>&1 | tee e2e_test_results.txt

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo ""

# Check results
if grep -q "passed" e2e_test_results.txt; then
    PASSED=$(grep -oP '\d+(?= passed)' e2e_test_results.txt | head -1)
    echo -e "${GREEN}✅ Tests Passed: $PASSED${NC}"
fi

if grep -q "failed" e2e_test_results.txt; then
    FAILED=$(grep -oP '\d+(?= failed)' e2e_test_results.txt | head -1)
    echo -e "${RED}❌ Tests Failed: $FAILED${NC}"
fi

echo ""
echo "Full report saved to: backend/e2e_test_results.txt"
echo ""
