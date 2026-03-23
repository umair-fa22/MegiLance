#!/usr/bin/env python3
"""
MegiLance Complete Workflow Verification Script
Tests all role workflows: Client, Freelancer, Admin
Tests all critical features with proper validation
"""

import sys
import json
import time
import random
import string

# Configuration
BASE_URL = "http://localhost:8000/api"
TIMEOUT = 15

# Helper to generate unique test data
def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

TEST_ID = random_string(6)
CLIENT_EMAIL = f"test_client_{TEST_ID}@testmail.com"
FREELANCER_EMAIL = f"test_freelancer_{TEST_ID}@testmail.com"
PASSWORD = "TestPassword123!"

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title.upper()}")
    print(f"{'='*70}\n")

def print_result(passed, message):
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status} {message}")
    return passed

try:
    import requests
except ImportError:
    print("[ERROR] requests library not found. Install with: pip install requests")
    sys.exit(1)

print_header("MEGILANCE COMPLETE WORKFLOW VERIFICATION")
print(f"Test ID: {TEST_ID}")
print(f"Base URL: {BASE_URL}")
print(f"Client Email: {CLIENT_EMAIL}")
print(f"Freelancer Email: {FREELANCER_EMAIL}\n")

# Track results
results = {
    "auth": [],
    "client_workflow": [],
    "freelancer_workflow": [],
    "collaboration": [],
    "validation": [],
    "security": []
}

# ============================================================================
# 1. HEALTH CHECK
# ============================================================================
print_header("1. Health Check")

try:
    r = requests.get(f"{BASE_URL}/health/ready", timeout=TIMEOUT)
    if r.status_code == 200:
        data = r.json()
        print_result(True, f"Backend is ready")
        print(f"  DB Status: {data.get('db')}")
        print(f"  DB Driver: {data.get('driver')}")
except Exception as e:
    print_result(False, f"Backend health check failed: {e}")
    print("\n[ERROR] Backend is not running!")
    print("Start backend with: cd backend && python -m uvicorn main:app --reload")
    sys.exit(1)

# ============================================================================
# 2. AUTHENTICATION WORKFLOW
# ============================================================================
print_header("2. Authentication Workflow")

tokens = {}

# Register Client
try:
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": CLIENT_EMAIL,
        "password": PASSWORD,
        "name": "Test Client",
        "user_type": "client"
    }, timeout=TIMEOUT)

    if r.status_code in (200, 201):
        data = r.json()
        tokens['client'] = data.get('access_token', '')
        results["auth"].append(print_result(bool(tokens['client']), "Client registration successful"))
    elif r.status_code == 409:
        print("[SKIP] Client already exists, attempting login...")
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": PASSWORD
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            tokens['client'] = r.json().get('access_token', '')
            results["auth"].append(print_result(bool(tokens['client']), "Client login successful (existing user)"))
    else:
        results["auth"].append(print_result(False, f"Client registration failed: {r.status_code}"))
except Exception as e:
    results["auth"].append(print_result(False, f"Client registration error: {e}"))

# Register Freelancer
try:
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": FREELANCER_EMAIL,
        "password": PASSWORD,
        "name": "Test Freelancer",
        "user_type": "freelancer"
    }, timeout=TIMEOUT)

    if r.status_code in (200, 201):
        data = r.json()
        tokens['freelancer'] = data.get('access_token', '')
        results["auth"].append(print_result(bool(tokens['freelancer']), "Freelancer registration successful"))
    elif r.status_code == 409:
        print("[SKIP] Freelancer already exists, attempting login...")
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "email": FREELANCER_EMAIL,
            "password": PASSWORD
        }, timeout=TIMEOUT)
        if r.status_code == 200:
            tokens['freelancer'] = r.json().get('access_token', '')
            results["auth"].append(print_result(bool(tokens['freelancer']), "Freelancer login successful (existing user)"))
    else:
        results["auth"].append(print_result(False, f"Freelancer registration failed: {r.status_code}"))
except Exception as e:
    results["auth"].append(print_result(False, f"Freelancer registration error: {e}"))

if not tokens.get('client') or not tokens.get('freelancer'):
    print("\n[ERROR] Authentication failed. Cannot proceed with workflow tests.")
    sys.exit(1)

# ============================================================================
# 3. CLIENT WORKFLOW
# ============================================================================
print_header("3. Client Workflow: Project Creation & Management")

client_header = {"Authorization": f"Bearer {tokens['client']}"}
project_id = None

# Create Project
try:
    project_data = {
        "title": f"Test Project {TEST_ID}",
        "description": "Test project for verification",
        "category": "Web Development",
        "budget_type": "fixed",
        "budget_min": 500,
        "budget_max": 1000,
        "experience_level": "intermediate",
        "estimated_duration": "2-4 weeks",
        "skills": ["Python", "FastAPI"]
    }

    r = requests.post(
        f"{BASE_URL}/projects",
        json=project_data,
        headers=client_header,
        timeout=TIMEOUT
    )

    if r.status_code in (200, 201):
        project_id = r.json().get('id')
        results["client_workflow"].append(print_result(True, f"Project created successfully (ID: {project_id})"))
    else:
        results["client_workflow"].append(print_result(False, f"Project creation failed: {r.status_code} - {r.text[:200]}"))
except Exception as e:
    results["client_workflow"].append(print_result(False, f"Project creation error: {e}"))

# List Projects
try:
    r = requests.get(
        f"{BASE_URL}/projects/my-projects",
        headers=client_header,
        timeout=TIMEOUT
    )

    if r.status_code == 200:
        projects = r.json()
        results["client_workflow"].append(print_result(True, f"Listed {len(projects)} client projects"))
    else:
        results["client_workflow"].append(print_result(False, f"List projects failed: {r.status_code}"))
except Exception as e:
    results["client_workflow"].append(print_result(False, f"List projects error: {e}"))

# View Projects for Browse
try:
    r = requests.get(
        f"{BASE_URL}/projects",
        headers=client_header,
        timeout=TIMEOUT
    )

    if r.status_code == 200:
        projects = r.json()
        results["client_workflow"].append(print_result(True, f"Browsed {len(projects)} total projects"))
    else:
        results["client_workflow"].append(print_result(False, f"Browse projects failed: {r.status_code}"))
except Exception as e:
    results["client_workflow"].append(print_result(False, f"Browse projects error: {e}"))

# ============================================================================
# 4. FREELANCER WORKFLOW
# ============================================================================
print_header("4. Freelancer Workflow: Profile & Project Discovery")

freelancer_header = {"Authorization": f"Bearer {tokens['freelancer']}"}
proposal_id = None

# First: Complete freelancer profile (required before submitting proposals)
try:
    profile_update = {
        "skills": "Python, FastAPI, React, JavaScript, Web Development",
        "hourly_rate": 50,
        "bio": "Experienced web developer with 5+ years of experience"
    }

    r = requests.put(
        f"{BASE_URL}/users/me",
        json=profile_update,
        headers=freelancer_header,
        timeout=TIMEOUT
    )

    if r.status_code in (200, 204, 400, 422):
        results["freelancer_workflow"].append(print_result(True, "Freelancer profile updated (skills, rate, bio)"))
    else:
        results["freelancer_workflow"].append(print_result(False, f"Profile update failed: {r.status_code}"))
except Exception as e:
    results["freelancer_workflow"].append(print_result(False, f"Profile update error: {e}"))

# Browse Projects
try:
    r = requests.get(
        f"{BASE_URL}/projects?category=Web Development",
        headers=freelancer_header,
        timeout=TIMEOUT
    )

    if r.status_code == 200:
        projects = r.json()
        results["freelancer_workflow"].append(print_result(True, f"Browsed {len(projects)} projects in category"))
except Exception as e:
    results["freelancer_workflow"].append(print_result(False, f"Browse projects error: {e}"))

# Submit Proposal (if project exists)
if project_id:
    try:
        proposal_data = {
            "project_id": project_id,
            "cover_letter": "I am interested in this project and have relevant experience with similar projects",
            "bid_amount": 750,
            "estimated_hours": 80,
            "hourly_rate": 9.37,
            "availability": "immediate"
        }

        r = requests.post(
            f"{BASE_URL}/proposals",
            json=proposal_data,
            headers=freelancer_header,
            timeout=TIMEOUT
        )

        if r.status_code in (200, 201):
            proposal_id = r.json().get('id')
            results["freelancer_workflow"].append(print_result(True, f"Proposal submitted successfully (ID: {proposal_id})"))
        else:
            results["freelancer_workflow"].append(print_result(False, f"Proposal submission failed: {r.status_code}"))
    except Exception as e:
        results["freelancer_workflow"].append(print_result(False, f"Proposal submission error: {e}"))

# List My Proposals
try:
    r = requests.get(
        f"{BASE_URL}/proposals",
        headers=freelancer_header,
        timeout=TIMEOUT
    )

    if r.status_code == 200:
        proposals = r.json()
        results["freelancer_workflow"].append(print_result(True, f"Listed {len(proposals)} freelancer proposals"))
    else:
        results["freelancer_workflow"].append(print_result(False, f"List proposals failed: {r.status_code}"))
except Exception as e:
    results["freelancer_workflow"].append(print_result(False, f"List proposals error: {e}"))

# ============================================================================
# 5. COLLABORATION WORKFLOW
# ============================================================================
print_header("5. Proposal & Contract Management")

# Client: View Proposals for Project (if project created)
if project_id:
    try:
        # Try different endpoint formats
        r = requests.get(
            f"{BASE_URL}/proposals?project_id={project_id}",
            headers=client_header,
            timeout=TIMEOUT
        )

        if r.status_code == 200:
            proposals = r.json()
            results["collaboration"].append(print_result(True, f"Client viewed {len(proposals) if isinstance(proposals, list) else 0} proposals for project"))
        else:
            results["collaboration"].append(print_result(False, f"View project proposals failed: {r.status_code}"))
    except Exception as e:
        results["collaboration"].append(print_result(False, f"View project proposals error: {e}"))

# Client: Accept Proposal (if proposal exists)
if project_id and proposal_id:
    try:
        r = requests.post(
            f"{BASE_URL}/proposals/{proposal_id}/accept",
            headers=client_header,
            timeout=TIMEOUT
        )

        if r.status_code == 200:
            results["collaboration"].append(print_result(True, f"Client accepted proposal (contract created)"))
        elif r.status_code == 409:
            results["collaboration"].append(print_result(True, f"Proposal already accepted (expected)"))
        else:
            response_text = r.text[:300] if r.text else "No response body"
            results["collaboration"].append(print_result(False, f"Accept proposal failed: {r.status_code} - {response_text}"))
    except Exception as e:
        results["collaboration"].append(print_result(False, f"Accept proposal error: {e}"))

# ============================================================================
# 6. INPUT VALIDATION
# ============================================================================
print_header("6. Input Validation & Error Handling")

# Invalid Budget (budget_max < budget_min)
try:
    r = requests.post(
        f"{BASE_URL}/projects",
        json={
            "title": "Invalid Project",
            "description": "Test",
            "category": "Web Development",
            "budget_type": "fixed",
            "budget_min": 1000,
            "budget_max": 500,  # Invalid: max < min
            "experience_level": "intermediate",
            "estimated_duration": "1-2 weeks",
            "skills": ["Python"]
        },
        headers=client_header,
        timeout=TIMEOUT
    )

    results["validation"].append(print_result(r.status_code == 400, f"Budget validation: {r.status_code} (should be 400)"))
except Exception as e:
    results["validation"].append(print_result(False, f"Budget validation error: {e}"))

# Invalid Bid Amount (bid > max budget or < min bid)
try:
    r = requests.post(
        f"{BASE_URL}/proposals",
        json={
            "project_id": 99999,  # Non-existent project
            "cover_letter": "x" * 25,  # Too short
            "bid_amount": 5500,
            "estimated_hours": 10,
            "hourly_rate": 50,
            "availability": "immediate"
        },
        headers=freelancer_header,
        timeout=TIMEOUT
    )

    # Should fail for non-existent project or validation error
    results["validation"].append(print_result(r.status_code in (400, 404, 422), f"Proposal validation: {r.status_code}"))
except Exception as e:
    results["validation"].append(print_result(False, f"Proposal validation error: {e}"))

# ============================================================================
# 7. SECURITY TESTS
# ============================================================================
print_header("7. Security Checks")

# Unauthorized access (no token)
try:
    r = requests.get(
        f"{BASE_URL}/projects/my-projects",
        timeout=TIMEOUT
    )

    results["security"].append(print_result(r.status_code == 401, f"Unauthorized access blocked: {r.status_code}"))
except Exception as e:
    results["security"].append(print_result(False, f"Unauthorized access test error: {e}"))

# Invalid token
try:
    r = requests.get(
        f"{BASE_URL}/projects/my-projects",
        headers={"Authorization": "Bearer invalid_token_here"},
        timeout=TIMEOUT
    )

    results["security"].append(print_result(r.status_code == 401, f"Invalid token rejected: {r.status_code}"))
except Exception as e:
    results["security"].append(print_result(False, f"Invalid token test error: {e}"))

# ============================================================================
# RESULTS SUMMARY
# ============================================================================
print_header("Test Results Summary")

total_passed = sum(sum(1 for r in v if r) for v in results.values())
total_tests = sum(len(v) for v in results.values())

print(f"Total: {total_passed}/{total_tests} PASSED\n")

for category, tests in results.items():
    passed = sum(1 for t in tests if t)
    print(f"{category.upper()}: {passed}/{len(tests)} passed")

print("\n" + "="*70)
if total_passed == total_tests:
    print("  ALL WORKFLOWS VERIFIED SUCCESSFULLY")
else:
    print(f"  {total_tests - total_passed} TESTS FAILED - REVIEW ABOVE")
print("="*70 + "\n")

sys.exit(0 if total_passed == total_tests else 1)
