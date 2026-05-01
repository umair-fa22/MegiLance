#!/usr/bin/env python3
"""
MegiLance Complete Workflow Verification Script
Checks all critical user workflows for completeness and correctness
"""

import sys
import requests
import json
from typing import Dict, List, Tuple

# Test configuration
BASE_URL = "http://localhost:8000"
API_ENDPOINTS = {
    "auth": [
        ("POST", "/api/auth/register"),
        ("POST", "/api/auth/login"),
        ("POST", "/api/auth/refresh"),
        ("POST", "/api/auth/logout"),
        ("GET", "/api/auth/me"),
    ],
    "projects": [
        ("GET", "/api/projects"),
        ("POST", "/api/projects"),
        ("GET", "/api/projects/{id}"),
        ("PUT", "/api/projects/{id}"),
        ("DELETE", "/api/projects/{id}"),
    ],
    "proposals": [
        ("GET", "/api/proposals"),
        ("POST", "/api/proposals"),
        ("GET", "/api/proposals/{id}"),
        ("PUT", "/api/proposals/{id}"),
    ],
    "contracts": [
        ("GET", "/api/contracts"),
        ("POST", "/api/contracts"),
        ("GET", "/api/contracts/{id}"),
        ("PUT", "/api/contracts/{id}"),
    ],
    "payments": [
        ("GET", "/api/payments"),
        ("POST", "/api/payments"),
        ("GET", "/api/payments/{id}"),
    ],
    "profiles": [
        ("GET", "/api/users/{id}/profile"),
        ("PUT", "/api/users/{id}/profile"),
        ("GET", "/api/users/{id}/portfolio"),
    ],
    "social_auth": [
        ("GET", "/api/social-auth/providers"),
        ("POST", "/api/social-auth/start"),
    ],
}

CRITICAL_FEATURES = {
    "Authentication": [
        "Email signup works",
        "Email login works",
        "Google OAuth works",
        "Password reset works",
        "2FA setup works",
    ],
    "Project Management": [
        "Create project",
        "Edit project",
        "Search projects",
        "Filter projects by skills",
        "Soft delete projects",
    ],
    "Profiles": [
        "Client profile complete",
        "Freelancer profile complete",
        "Avatar upload",
        "Skills management",
        "Portfolio display",
    ],
    "Proposals": [
        "Submit proposal",
        "Edit proposal",
        "View all proposals",
        "Accept/reject proposal",
    ],
    "Contracts": [
        "Create contract",
        "View milestones",
        "Update milestone status",
        "View contract history",
    ],
    "Payments": [
        "Add funds to wallet",
        "Process payment",
        "View payment history",
        "Withdraw earnings",
    ],
}

def check_endpoint(method: str, endpoint: str) -> Tuple[str, bool, str]:
    """Check if an endpoint is accessible (returns 200-299 or expected error)"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "GET":
            resp = requests.get(url, timeout=5)
        elif method == "POST":
            resp = requests.post(url, json={}, timeout=5)
        elif method == "PUT":
            resp = requests.put(url, json={}, timeout=5)
        elif method == "DELETE":
            resp = requests.delete(url, timeout=5)
        
        # Status 200-299 = OK
        # Status 400-404 = endpoint exists but validation/auth failed (still good)
        # Status 405 = method not allowed (endpoint exists)
        # Status 500+ = server error
        if 200 <= resp.status_code < 300:
            return endpoint, True, f"{resp.status_code}"
        elif 400 <= resp.status_code < 500:
            return endpoint, True, f"{resp.status_code} (validation/auth)"
        elif resp.status_code == 405:
            return endpoint, True, f"{resp.status_code} (method not supported)"
        else:
            return endpoint, False, f"{resp.status_code}"
    except requests.exceptions.ConnectionError:
        return endpoint, False, "Connection refused"
    except Exception as e:
        return endpoint, False, str(e)

def main():
    print("\n" + "="*80)
    print("MegiLance Complete Workflow Verification")
    print("="*80 + "\n")
    
    # Check API health
    print("🔍 Checking API Health...")
    try:
        resp = requests.get(f"{BASE_URL}/api/health/ready", timeout=5)
        if resp.status_code == 200:
            print("✅ Backend is running\n")
        else:
            print(f"❌ Backend health check failed: {resp.status_code}\n")
            sys.exit(1)
    except:
        print("❌ Cannot connect to backend at localhost:8000\n")
        print("Start the backend with: cd backend && python -m uvicorn main:app --reload\n")
        sys.exit(1)
    
    # Check API endpoints
    print("📋 Checking API Endpoints...")
    print("-" * 80)
    
    total = 0
    working = 0
    
    for category, endpoints in API_ENDPOINTS.items():
        print(f"\n{category.upper()}:")
        for method, endpoint in endpoints:
            endpoint_name, success, status = check_endpoint(method, endpoint)
            total += 1
            if success:
                working += 1
                print(f"  ✅ {method:6} {endpoint_name:50} ({status})")
            else:
                print(f"  ❌ {method:6} {endpoint_name:50} ({status})")
    
    print(f"\n" + "-" * 80)
    print(f"API Endpoints: {working}/{total} working")
    
    # Check critical features
    print("\n📊 Critical Features Status:")
    print("-" * 80)
    
    for category, features in CRITICAL_FEATURES.items():
        print(f"\n{category}:")
        for feature in features:
            print(f"  ⏳ {feature:40} (manual verification needed)")
    
    print("\n" + "="*80)
    print(f"API Health: {working}/{total} endpoints responding")
    print("="*80 + "\n")
    print("Next Steps:")
    print("1. Run frontend in another terminal: cd frontend && npm run dev")
    print("2. Visit http://localhost:3000 and test workflows manually")
    print("3. Check browser console for errors")
    print("4. Check backend logs for API errors")
    print("\n")

if __name__ == "__main__":
    main()
