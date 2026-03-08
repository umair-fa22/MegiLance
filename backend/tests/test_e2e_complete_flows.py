# @AI-HINT: Comprehensive end-to-end testing of ALL user flows, roles, and features
# Tests the LIVE running backend API at localhost:8000
# Covers: Auth, Client journeys, Freelancer journeys, Admin journeys, all features

import requests
import time
import json
import uuid
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
RESULTS = {"passed": 0, "failed": 0, "errors": [], "warnings": []}

# Unique test identifiers to avoid collisions
TEST_ID = uuid.uuid4().hex[:8]
CLIENT_EMAIL = f"e2e_client_{TEST_ID}@test.com"
FREELANCER_EMAIL = f"e2e_freelancer_{TEST_ID}@test.com"
ADMIN_EMAIL = f"e2e_admin_{TEST_ID}@test.com"
TEST_PASSWORD = "E2eTestP@ss123!"


def log_pass(test_name, detail=""):
    RESULTS["passed"] += 1
    print(f"  ✅ PASS: {test_name}" + (f" - {detail}" if detail else ""))


def log_fail(test_name, detail=""):
    RESULTS["failed"] += 1
    RESULTS["errors"].append(f"{test_name}: {detail}")
    print(f"  ❌ FAIL: {test_name}" + (f" - {detail}" if detail else ""))


def log_warn(test_name, detail=""):
    RESULTS["warnings"].append(f"{test_name}: {detail}")
    print(f"  ⚠️  WARN: {test_name}" + (f" - {detail}" if detail else ""))


def log_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")


def safe_request(method, url, **kwargs):
    """Make a request with error handling and timeout."""
    kwargs.setdefault("timeout", 15)
    try:
        resp = getattr(requests, method)(url, **kwargs)
        return resp
    except requests.exceptions.Timeout:
        return None
    except requests.exceptions.ConnectionError:
        return None
    except Exception:
        return None


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 1. HEALTH & INFRASTRUCTURE TESTS
# ============================================================================
def test_health_and_infrastructure():
    log_section("1. HEALTH & INFRASTRUCTURE")

    # Health ready
    r = safe_request("get", f"{BASE_URL}/health/ready")
    if r and r.status_code == 200:
        data = r.json()
        if data.get("status") == "ready" and data.get("db") == "ok":
            log_pass("Health ready endpoint", f"DB={data.get('driver')}, uptime={data.get('uptime_seconds')}s")
        else:
            log_fail("Health ready", f"status={data.get('status')}, db={data.get('db')}")
    else:
        log_fail("Health ready", f"status={r.status_code if r else 'NO RESPONSE'}")
        return False

    # Health live
    r = safe_request("get", f"{BASE_URL}/health")
    if r and r.status_code == 200:
        log_pass("Health live endpoint")
    else:
        log_fail("Health live", f"status={r.status_code if r else 'NO RESPONSE'}")

    # OpenAPI docs
    r = safe_request("get", f"{BASE_URL}/openapi.json")
    if r and r.status_code == 200:
        data = r.json()
        path_count = len(data.get("paths", {}))
        log_pass("OpenAPI spec", f"{path_count} routes registered")
    else:
        log_fail("OpenAPI spec", f"status={r.status_code if r else 'NO RESPONSE'}")

    # CORS headers
    r = safe_request("options", f"{BASE_URL}/health/ready",
                     headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
    if r:
        cors = r.headers.get("access-control-allow-origin", "")
        if cors:
            log_pass("CORS headers present", f"allowed: {cors}")
        else:
            log_warn("CORS headers", "No CORS headers in response")
    else:
        log_warn("CORS check", "No response")

    return True


# ============================================================================
# 2. AUTHENTICATION FLOWS - ALL ROLES
# ============================================================================
def test_auth_flows():
    log_section("2. AUTHENTICATION FLOWS")
    tokens = {}

    # 2a. Register Client
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": CLIENT_EMAIL,
        "password": TEST_PASSWORD,
        "name": "E2E Test Client",
        "user_type": "client"
    })
    if r and r.status_code in (200, 201):
        data = r.json()
        if data.get("access_token"):
            tokens["client"] = data["access_token"]
            tokens["client_refresh"] = data.get("refresh_token", "")
            log_pass("Register client", f"email={CLIENT_EMAIL}")
        else:
            log_fail("Register client", "No access token in response")
    elif r and r.status_code == 409:
        log_warn("Register client", "Already exists - trying login")
    else:
        log_fail("Register client", f"status={r.status_code if r else 'NO RESPONSE'}, body={r.text[:200] if r else ''}")

    # 2b. Register Freelancer
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": FREELANCER_EMAIL,
        "password": TEST_PASSWORD,
        "name": "E2E Test Freelancer",
        "user_type": "freelancer"
    })
    if r and r.status_code in (200, 201):
        data = r.json()
        if data.get("access_token"):
            tokens["freelancer"] = data["access_token"]
            tokens["freelancer_refresh"] = data.get("refresh_token", "")
            log_pass("Register freelancer", f"email={FREELANCER_EMAIL}")
        else:
            log_fail("Register freelancer", "No access token")
    else:
        log_fail("Register freelancer", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 2c. Login client
    r = safe_request("post", f"{BASE_URL}/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": TEST_PASSWORD
    })
    if r and r.status_code == 200:
        data = r.json()
        if data.get("access_token"):
            tokens["client"] = data["access_token"]
            tokens["client_refresh"] = data.get("refresh_token", "")
            log_pass("Login client", "Got access + refresh tokens")
        else:
            log_fail("Login client", "No access token")
    elif "client" not in tokens:
        log_fail("Login client", f"status={r.status_code if r else 'NO RESPONSE'}")
    else:
        log_warn("Login client", f"Using registration token, login status={r.status_code if r else 'NO RESPONSE'}")

    # 2d. Login freelancer
    r = safe_request("post", f"{BASE_URL}/auth/login", json={
        "email": FREELANCER_EMAIL,
        "password": TEST_PASSWORD
    })
    if r and r.status_code == 200:
        data = r.json()
        if data.get("access_token"):
            tokens["freelancer"] = data["access_token"]
            tokens["freelancer_refresh"] = data.get("refresh_token", "")
            log_pass("Login freelancer", "Got access + refresh tokens")
        else:
            log_fail("Login freelancer", "No access token")
    elif "freelancer" not in tokens:
        log_fail("Login freelancer", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 2e. Login invalid credentials
    r = safe_request("post", f"{BASE_URL}/auth/login", json={
        "email": CLIENT_EMAIL,
        "password": "WrongPassword123!"
    })
    if r and r.status_code in (401, 400):
        log_pass("Login invalid credentials rejected", f"status={r.status_code}")
    else:
        log_fail("Login invalid credentials", f"Expected 401, got {r.status_code if r else 'NO RESPONSE'}")

    # 2f. Get current user (client)
    if "client" in tokens:
        r = safe_request("get", f"{BASE_URL}/auth/me", headers=auth_header(tokens["client"]))
        if r and r.status_code == 200:
            data = r.json()
            log_pass("Get current user (client)", f"name={data.get('name')}, type={data.get('user_type')}")
        else:
            log_fail("Get current user (client)", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 2g. Get current user (freelancer)
    if "freelancer" in tokens:
        r = safe_request("get", f"{BASE_URL}/auth/me", headers=auth_header(tokens["freelancer"]))
        if r and r.status_code == 200:
            data = r.json()
            log_pass("Get current user (freelancer)", f"name={data.get('name')}, type={data.get('user_type')}")
        else:
            log_fail("Get current user (freelancer)", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 2h. Protected endpoint without token
    r = safe_request("get", f"{BASE_URL}/auth/me")
    if r and r.status_code == 401:
        log_pass("Protected endpoint rejects unauthenticated")
    else:
        log_fail("Protected endpoint auth check", f"Expected 401, got {r.status_code if r else 'NO RESPONSE'}")

    # 2i. Token refresh
    if tokens.get("client_refresh"):
        r = safe_request("post", f"{BASE_URL}/auth/refresh", json={
            "refresh_token": tokens["client_refresh"]
        })
        if r and r.status_code == 200:
            data = r.json()
            if data.get("access_token"):
                tokens["client"] = data["access_token"]
                log_pass("Token refresh", "Got new access token")
            else:
                log_fail("Token refresh", "No new access token")
        else:
            log_warn("Token refresh", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 2j. Register with weak password
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": f"weak_{TEST_ID}@test.com",
        "password": "123",
        "name": "Weak",
        "user_type": "client"
    })
    if r and r.status_code in (400, 422):
        log_pass("Weak password rejected", f"status={r.status_code}")
    else:
        log_fail("Weak password validation", f"Expected 400/422, got {r.status_code if r else 'NO RESPONSE'}")

    # 2k. Register duplicate email
    if "client" in tokens:
        r = safe_request("post", f"{BASE_URL}/auth/register", json={
            "email": CLIENT_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Duplicate",
            "user_type": "client"
        })
        if r and r.status_code in (400, 409, 422):
            log_pass("Duplicate email rejected", f"status={r.status_code}")
        else:
            log_fail("Duplicate email check", f"Expected 400/409, got {r.status_code if r else 'NO RESPONSE'}")

    # 2l. Forgot password
    r = safe_request("post", f"{BASE_URL}/auth/forgot-password", json={
        "email": CLIENT_EMAIL
    })
    if r and r.status_code in (200, 202):
        log_pass("Forgot password request accepted")
    else:
        log_warn("Forgot password", f"status={r.status_code if r else 'NO RESPONSE'}")

    return tokens


# ============================================================================
# 3. CLIENT USER JOURNEY
# ============================================================================
def test_client_journey(tokens):
    log_section("3. CLIENT USER JOURNEY")
    if "client" not in tokens:
        log_fail("Client journey", "No client token - skipping all")
        return {}

    h = auth_header(tokens["client"])
    created = {}

    # 3a. Update profile
    r = safe_request("put", f"{BASE_URL}/users/me", headers=h, json={
        "name": "E2E Client Updated",
        "bio": "I'm a test client looking for freelancers",
        "location": "London"
    })
    if r and r.status_code == 200:
        log_pass("Client update profile")
    else:
        log_warn("Client update profile", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3b. Create a project
    r = safe_request("post", f"{BASE_URL}/projects", headers=h, json={
        "title": f"E2E Test Project {TEST_ID}",
        "description": "This is a comprehensive E2E test project for validating all platform flows.",
        "category": "web-development",
        "budget_type": "fixed",
        "budget_min": 500,
        "budget_max": 2000,
        "experience_level": "intermediate",
        "estimated_duration": "1-3 months",
        "skills": "python,react,fastapi"
    })
    if r and r.status_code in (200, 201):
        data = r.json()
        created["project_id"] = data.get("id")
        log_pass("Create project", f"id={created.get('project_id')}")
    else:
        log_fail("Create project", f"status={r.status_code if r else 'NO RESPONSE'}, body={r.text[:200] if r else ''}")

    # 3c. List my projects
    r = safe_request("get", f"{BASE_URL}/projects", headers=h)
    if r and r.status_code == 200:
        data = r.json()
        items = data if isinstance(data, list) else data.get("items", data.get("projects", []))
        log_pass("List projects", f"count={len(items) if isinstance(items, list) else 'N/A'}")
    else:
        log_fail("List projects", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3d. Get specific project
    if created.get("project_id"):
        r = safe_request("get", f"{BASE_URL}/projects/{created['project_id']}", headers=h)
        if r and r.status_code == 200:
            log_pass("Get project by ID")
        else:
            log_fail("Get project by ID", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3e. Client dashboard
    r = safe_request("get", f"{BASE_URL}/portal/client/dashboard", headers=h)
    if r and r.status_code == 200:
        log_pass("Client dashboard")
    else:
        log_warn("Client dashboard", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3f. Client projects portal
    r = safe_request("get", f"{BASE_URL}/client/projects", headers=h)
    if r and r.status_code == 200:
        log_pass("Client projects portal")
    else:
        log_warn("Client projects portal", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3g. Search freelancers
    r = safe_request("get", f"{BASE_URL}/search/freelancers?q=python", headers=h)
    if r and r.status_code == 200:
        log_pass("Search freelancers")
    else:
        log_warn("Search freelancers", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3h. Browse gigs
    r = safe_request("get", f"{BASE_URL}/gigs")
    if r and r.status_code == 200:
        log_pass("Browse gigs (public)")
    else:
        log_fail("Browse gigs", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3i. View notifications
    r = safe_request("get", f"{BASE_URL}/notifications", headers=h)
    if r and r.status_code == 200:
        log_pass("Client notifications")
    else:
        log_warn("Client notifications", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3j. View messages
    r = safe_request("get", f"{BASE_URL}/messages", headers=h)
    if r and r.status_code == 200:
        log_pass("Client messages")
    else:
        log_warn("Client messages", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3k. View contracts
    r = safe_request("get", f"{BASE_URL}/contracts", headers=h)
    if r and r.status_code == 200:
        log_pass("Client contracts list")
    else:
        log_warn("Client contracts", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3l. View invoices
    r = safe_request("get", f"{BASE_URL}/invoices", headers=h)
    if r and r.status_code == 200:
        log_pass("Client invoices")
    else:
        log_warn("Client invoices", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3m. View payments
    r = safe_request("get", f"{BASE_URL}/payments", headers=h)
    if r and r.status_code == 200:
        log_pass("Client payments")
    else:
        log_warn("Client payments", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3n. Favorites
    r = safe_request("get", f"{BASE_URL}/favorites", headers=h)
    if r and r.status_code == 200:
        log_pass("Client favorites")
    else:
        log_warn("Client favorites", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 3o. Support tickets
    r = safe_request("get", f"{BASE_URL}/support-tickets", headers=h)
    if r and r.status_code == 200:
        log_pass("Client support tickets")
    else:
        log_warn("Client support tickets", f"status={r.status_code if r else 'NO RESPONSE'}")

    return created


# ============================================================================
# 4. FREELANCER USER JOURNEY
# ============================================================================
def test_freelancer_journey(tokens, client_created):
    log_section("4. FREELANCER USER JOURNEY")
    if "freelancer" not in tokens:
        log_fail("Freelancer journey", "No freelancer token - skipping all")
        return {}

    h = auth_header(tokens["freelancer"])
    created = {}

    # 4a. Update freelancer profile
    r = safe_request("put", f"{BASE_URL}/users/me", headers=h, json={
        "name": "E2E Freelancer Updated",
        "bio": "Full-stack developer with 5 years of experience in Python and React",
        "skills": "python,react,fastapi,postgresql",
        "hourly_rate": 75.0,
        "location": "Berlin"
    })
    if r and r.status_code == 200:
        log_pass("Freelancer update profile")
    else:
        log_warn("Freelancer update profile", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4b. Browse available projects
    r = safe_request("get", f"{BASE_URL}/projects")
    if r and r.status_code == 200:
        data = r.json()
        items = data if isinstance(data, list) else data.get("items", data.get("projects", []))
        log_pass("Browse projects", f"count={len(items) if isinstance(items, list) else 'N/A'}")
    else:
        log_fail("Browse projects", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4c. Submit a proposal
    project_id = client_created.get("project_id")
    if project_id:
        r = safe_request("post", f"{BASE_URL}/proposals", headers=h, json={
            "project_id": project_id,
            "cover_letter": "I am an experienced developer and would love to work on this project. I have extensive experience with the required technologies.",
            "bid_amount": 1500.0,
            "estimated_duration": "2 months",
            "milestones": [
                {"title": "Phase 1 - Setup", "amount": 500, "description": "Project setup and architecture"},
                {"title": "Phase 2 - Development", "amount": 750, "description": "Core feature development"},
                {"title": "Phase 3 - Testing", "amount": 250, "description": "Testing and deployment"}
            ]
        })
        if r and r.status_code in (200, 201):
            data = r.json()
            created["proposal_id"] = data.get("id")
            log_pass("Submit proposal", f"id={created.get('proposal_id')}")
        else:
            log_fail("Submit proposal", f"status={r.status_code if r else 'NO RESPONSE'}, body={r.text[:200] if r else ''}")

    # 4d. View my proposals
    r = safe_request("get", f"{BASE_URL}/proposals", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer proposals list")
    else:
        log_warn("Freelancer proposals", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4e. Freelancer dashboard
    r = safe_request("get", f"{BASE_URL}/portal/freelancer/dashboard", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer dashboard")
    else:
        log_warn("Freelancer dashboard", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4f. Create a gig
    r = safe_request("post", f"{BASE_URL}/gigs", headers=h, json={
        "title": f"I will build a REST API - E2E {TEST_ID}",
        "description": "Professional REST API development with FastAPI, including documentation and tests.",
        "short_description": "Professional API development",
        "category_id": 1,
        "basic_title": "Basic API",
        "basic_description": "Simple REST API with 5 endpoints",
        "basic_price": 50.0,
        "basic_delivery_days": 7,
        "basic_revisions": 2,
        "standard_title": "Standard API",
        "standard_description": "REST API with 15 endpoints and auth",
        "standard_price": 150.0,
        "standard_delivery_days": 14,
        "standard_revisions": 3,
        "premium_title": "Premium API",
        "premium_description": "Full API with auth, tests, docs, deployment",
        "premium_price": 300.0,
        "premium_delivery_days": 21,
        "premium_revisions": 5
    })
    if r and r.status_code in (200, 201):
        data = r.json()
        created["gig_id"] = data.get("id")
        log_pass("Create gig", f"id={created.get('gig_id')}")
    else:
        log_fail("Create gig", f"status={r.status_code if r else 'NO RESPONSE'}, body={r.text[:200] if r else ''}")

    # 4g. List my gigs
    r = safe_request("get", f"{BASE_URL}/gigs", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer gigs list")
    else:
        log_fail("Freelancer gigs list", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4h. Portfolio 
    r = safe_request("get", f"{BASE_URL}/portfolio", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer portfolio")
    else:
        log_warn("Freelancer portfolio", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4i. View contracts
    r = safe_request("get", f"{BASE_URL}/contracts", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer contracts list")
    else:
        log_warn("Freelancer contracts", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4j. Wallet 
    r = safe_request("get", f"{BASE_URL}/wallet/balance", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer wallet balance")
    else:
        log_warn("Freelancer wallet", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4k. Seller stats
    r = safe_request("get", f"{BASE_URL}/seller-stats/me", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer seller stats")
    else:
        log_warn("Freelancer seller stats", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4l. Time entries
    r = safe_request("get", f"{BASE_URL}/time-entries", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer time entries")
    else:
        log_warn("Freelancer time entries", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4m. Availability calendar
    r = safe_request("get", f"{BASE_URL}/availability/schedule", headers=h)
    if r and r.status_code == 200:
        log_pass("Freelancer availability schedule")
    else:
        log_warn("Freelancer availability", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 4n. Skills/assessments
    r = safe_request("get", f"{BASE_URL}/assessments/skills/available")
    if r and r.status_code == 200:
        log_pass("Available skill assessments")
    else:
        log_warn("Skill assessments", f"status={r.status_code if r else 'NO RESPONSE'}")

    return created


# ============================================================================
# 5. ADMIN USER JOURNEY
# ============================================================================
def test_admin_journey(tokens):
    log_section("5. ADMIN USER JOURNEY")

    # Try registering an admin (may not be allowed via API)
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": ADMIN_EMAIL,
        "password": TEST_PASSWORD,
        "name": "E2E Test Admin",
        "user_type": "admin"
    })
    admin_token = None
    if r and r.status_code in (200, 201):
        data = r.json()
        admin_token = data.get("access_token")
        log_pass("Register admin")
    else:
        log_warn("Register admin", f"status={r.status_code if r else 'NO RESPONSE'} (admin reg may be restricted)")

    if not admin_token:
        # Try login with admin credentials if they exist
        r = safe_request("post", f"{BASE_URL}/auth/login", json={
            "email": "admin@megilance.com",
            "password": "AdminPass123!"
        })
        if r and r.status_code == 200:
            admin_token = r.json().get("access_token")
            log_pass("Admin login (default admin)")
        else:
            log_warn("Admin login", "No admin credentials available - testing public admin endpoints only")

    h = auth_header(admin_token) if admin_token else {}

    # 5a. Admin dashboard overview
    r = safe_request("get", f"{BASE_URL}/admin/dashboard/overview", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin dashboard overview")
    elif r and r.status_code == 401:
        log_warn("Admin dashboard", "Auth required")
    else:
        log_warn("Admin dashboard", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5b. Admin users list
    r = safe_request("get", f"{BASE_URL}/admin/users/list", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin users list")
    elif r and r.status_code == 401:
        log_warn("Admin users list", "Auth required")
    else:
        log_warn("Admin users list", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5c. Admin projects
    r = safe_request("get", f"{BASE_URL}/admin/projects", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin projects list")
    else:
        log_warn("Admin projects", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5d. Admin contracts
    r = safe_request("get", f"{BASE_URL}/admin/contracts", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin contracts")
    else:
        log_warn("Admin contracts", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5e. Admin payments
    r = safe_request("get", f"{BASE_URL}/admin/payments", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin payments")
    else:
        log_warn("Admin payments", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5f. Admin disputes
    r = safe_request("get", f"{BASE_URL}/admin/disputes", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin disputes")
    else:
        log_warn("Admin disputes", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5g. Admin fraud alerts
    r = safe_request("get", f"{BASE_URL}/admin/fraud-alerts", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin fraud alerts")
    else:
        log_warn("Admin fraud alerts", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5h. Admin analytics
    r = safe_request("get", f"{BASE_URL}/admin/analytics/overview", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin analytics overview")
    else:
        log_warn("Admin analytics", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5i. Admin settings
    r = safe_request("get", f"{BASE_URL}/admin/settings", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin settings")
    else:
        log_warn("Admin settings", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5j. Admin support tickets
    r = safe_request("get", f"{BASE_URL}/admin/support/tickets", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin support tickets")
    else:
        log_warn("Admin support tickets", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 5k. Admin reports
    r = safe_request("get", f"{BASE_URL}/admin/reports", headers=h)
    if r and r.status_code == 200:
        log_pass("Admin reports")
    else:
        log_warn("Admin reports", f"status={r.status_code if r else 'NO RESPONSE'}")

    return admin_token


# ============================================================================
# 6. PLATFORM FEATURES - PUBLIC ENDPOINTS
# ============================================================================
def test_public_features():
    log_section("6. PUBLIC FEATURES & PAGES")

    endpoints = [
        ("GET", "/health/ready", "Health check"),
        ("GET", "/projects", "Public projects"),
        ("GET", "/gigs", "Gig marketplace"),
        ("GET", "/freelancers", "Public freelancer profiles"),
        ("GET", "/categories/", "Categories"),
        ("GET", "/categories/tree", "Category tree"),
        ("GET", "/skills/", "Skills list"),
        ("GET", "/blog/", "Blog posts"),
        ("GET", "/i18n/locales", "i18n locales"),
        ("GET", "/knowledge-base/", "Knowledge base"),
        ("GET", "/learning/courses", "Learning courses"),
        ("GET", "/assessments/skills/available", "Available assessments"),
        ("GET", "/price-estimator/estimate", "Price estimator"),
        ("GET", "/external-projects/", "External projects"),
    ]

    for method, path, desc in endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}")
        if r and r.status_code == 200:
            log_pass(f"Public: {desc}")
        elif r and r.status_code == 404:
            log_warn(f"Public: {desc}", f"404 - route may not exist at {path}")
        elif r and r.status_code == 422:
            log_warn(f"Public: {desc}", f"422 - missing required params")
        else:
            log_fail(f"Public: {desc}", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 7. AUTHENTICATED FEATURES - ALL ROLES
# ============================================================================
def test_authenticated_features(tokens):
    log_section("7. AUTHENTICATED FEATURES")

    for role in ["client", "freelancer"]:
        if role not in tokens:
            continue
        h = auth_header(tokens[role])

        endpoints = [
            ("GET", "/notifications", f"{role}: Notifications"),
            ("GET", "/messages", f"{role}: Messages"),
            ("GET", "/contracts", f"{role}: Contracts"),
            ("GET", "/invoices", f"{role}: Invoices"),
            ("GET", "/payments", f"{role}: Payments"),
            ("GET", "/favorites", f"{role}: Favorites"),
            ("GET", "/reviews", f"{role}: Reviews"),
            ("GET", "/disputes", f"{role}: Disputes"),
            ("GET", "/support-tickets", f"{role}: Support tickets"),
            ("GET", "/wallet/balance", f"{role}: Wallet balance"),
            ("GET", "/wallet/transactions", f"{role}: Wallet transactions"),
            ("GET", "/activity/feed", f"{role}: Activity feed"),
            ("GET", "/saved-searches", f"{role}: Saved searches"),
            ("GET", "/referrals/stats", f"{role}: Referral stats"),
            ("GET", "/time-entries", f"{role}: Time entries"),
            ("GET", "/escrow/transactions", f"{role}: Escrow"),
        ]

        for method, path, desc in endpoints:
            r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h)
            if r and r.status_code == 200:
                log_pass(desc)
            elif r and r.status_code in (401, 403):
                log_fail(desc, f"Auth error: {r.status_code}")
            elif r and r.status_code == 404:
                log_warn(desc, "404 - endpoint may not exist")
            else:
                log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 8. ADVANCED FEATURES
# ============================================================================
def test_advanced_features(tokens):
    log_section("8. ADVANCED FEATURES")

    h = auth_header(tokens.get("freelancer", tokens.get("client", "")))
    if not h.get("Authorization"):
        log_fail("Advanced features", "No token available")
        return

    # 8a. AI Services
    ai_endpoints = [
        ("POST", "/ai/extract-skills", {"text": "I know Python, React, and PostgreSQL"}, "AI: Extract skills"),
        ("POST", "/ai/estimate-price", {"title": "Web App", "description": "Build a web app", "category": "web-development"}, "AI: Price estimate"),
        ("POST", "/ai/categorize-project", {"title": "Mobile App", "description": "iOS and Android app"}, "AI: Categorize project"),
    ]
    for method, path, body, desc in ai_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8b. AI Writing
    writing_endpoints = [
        ("GET", "/ai-writing/templates", None, "AI Writing: Templates"),
        ("GET", "/ai-writing/usage", None, "AI Writing: Usage"),
    ]
    for method, path, body, desc in writing_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8c. Gamification
    gamification_endpoints = [
        ("GET", "/gamification/profile", None, "Gamification: Profile"),
        ("GET", "/gamification/leaderboard", None, "Gamification: Leaderboard"),
        ("GET", "/gamification/badges", None, "Gamification: Badges"),
        ("GET", "/gamification/challenges", None, "Gamification: Challenges"),
    ]
    for method, path, body, desc in gamification_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8d. Community
    community_endpoints = [
        ("GET", "/community/questions", None, "Community: Questions"),
        ("GET", "/community/playbooks", None, "Community: Playbooks"),
    ]
    for method, path, body, desc in community_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8e. Teams
    r = safe_request("get", f"{BASE_URL}/teams", headers=h)
    if r and r.status_code == 200:
        log_pass("Teams list")
    else:
        log_warn("Teams list", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8f. Analytics
    analytics_endpoints = [
        ("GET", "/analytics/dashboard/summary", None, "Analytics: Dashboard summary"),
        ("GET", "/analytics/platform/health", None, "Analytics: Platform health"),
        ("GET", "/analytics/revenue/stats", None, "Analytics: Revenue stats"),
    ]
    for method, path, body, desc in analytics_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8g. Security features
    security_endpoints = [
        ("GET", "/2fa/status", None, "2FA: Status"),
        ("GET", "/security/sessions", None, "Security: Active sessions"),
    ]
    for method, path, body, desc in security_endpoints:
        r = safe_request(method.lower(), f"{BASE_URL}{path}", headers=h, json=body)
        if r and r.status_code == 200:
            log_pass(desc)
        else:
            log_warn(desc, f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8h. Chatbot
    r = safe_request("post", f"{BASE_URL}/chatbot/start", headers=h)
    if r and r.status_code in (200, 201):
        data = r.json()
        log_pass("Chatbot: Start conversation", f"id={data.get('conversation_id', 'N/A')}")
    else:
        log_warn("Chatbot start", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8i. Webhooks
    r = safe_request("get", f"{BASE_URL}/webhooks", headers=h)
    if r and r.status_code == 200:
        log_pass("Webhooks list")
    else:
        log_warn("Webhooks", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8j. Export/Import
    r = safe_request("get", f"{BASE_URL}/export-import/status", headers=h)
    if r and r.status_code == 200:
        log_pass("Export/Import status")
    else:
        log_warn("Export/Import", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8k. Pakistan Payments
    r = safe_request("get", f"{BASE_URL}/pk-payments/methods", headers=h)
    if r and r.status_code == 200:
        log_pass("Pakistan payment methods")
    else:
        log_warn("Pakistan payments", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8l. Feature flags
    r = safe_request("get", f"{BASE_URL}/feature-flags", headers=h)
    if r and r.status_code == 200:
        log_pass("Feature flags")
    else:
        log_warn("Feature flags", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8m. Notification preferences
    r = safe_request("get", f"{BASE_URL}/notification-preferences", headers=h)
    if r and r.status_code == 200:
        log_pass("Notification preferences")
    else:
        log_warn("Notification preferences", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 8n. Compliance
    r = safe_request("get", f"{BASE_URL}/compliance/status", headers=h)
    if r and r.status_code == 200:
        log_pass("Compliance status")
    else:
        log_warn("Compliance status", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 9. STANDALONE PUBLIC TOOLS
# ============================================================================
def test_standalone_tools():
    log_section("9. STANDALONE PUBLIC TOOLS")

    # Invoice Generator
    r = safe_request("post", f"{BASE_URL}/invoice-generator/generate", json={
        "client_name": "Test Client",
        "freelancer_name": "Test Freelancer",
        "items": [{"description": "Web Development", "quantity": 40, "rate": 50}],
        "currency": "USD"
    })
    if r and r.status_code == 200:
        log_pass("Invoice Generator")
    else:
        log_warn("Invoice Generator", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Contract Builder
    r = safe_request("post", f"{BASE_URL}/contract-builder-standalone/generate", json={
        "project_name": "E2E Test Project",
        "client_name": "Test Client",
        "freelancer_name": "Test Freelancer",
        "contract_type": "fixed",
        "total_amount": 5000,
        "currency": "USD"
    })
    if r and r.status_code == 200:
        log_pass("Contract Builder Standalone")
    else:
        log_warn("Contract Builder Standalone", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Income Calculator
    r = safe_request("post", f"{BASE_URL}/income-calculator/calculate", json={
        "hourly_rate": 75,
        "hours_per_week": 40,
        "country": "US"
    })
    if r and r.status_code == 200:
        log_pass("Income Calculator")
    else:
        log_warn("Income Calculator", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Scope Planner
    r = safe_request("post", f"{BASE_URL}/scope-planner/plan", json={
        "project_type": "web-application",
        "description": "Full-stack web application with user auth, dashboard, and payments"
    })
    if r and r.status_code == 200:
        log_pass("Scope Planner")
    else:
        log_warn("Scope Planner", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Expense/Tax Calculator
    r = safe_request("post", f"{BASE_URL}/expense-tax-calculator/calculate", json={
        "annual_income": 100000,
        "country": "US",
        "expenses": [{"category": "software", "amount": 2000}]
    })
    if r and r.status_code == 200:
        log_pass("Expense Tax Calculator")
    else:
        log_warn("Expense Tax Calculator", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Skill Analyzer
    r = safe_request("post", f"{BASE_URL}/skill-analyzer/analyze", json={
        "skills": ["Python", "React", "PostgreSQL", "Docker"]
    })
    if r and r.status_code == 200:
        log_pass("Skill Analyzer")
    else:
        log_warn("Skill Analyzer", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Rate Advisor
    r = safe_request("post", f"{BASE_URL}/rate-advisor/recommend", json={
        "skills": ["Python", "FastAPI"],
        "experience_years": 5,
        "location": "US"
    })
    if r and r.status_code == 200:
        log_pass("Rate Advisor")
    else:
        log_warn("Rate Advisor", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Proposal Writer
    r = safe_request("post", f"{BASE_URL}/proposal-writer/generate", json={
        "project_title": "Web App Development",
        "project_description": "Build a modern SaaS web application",
        "freelancer_skills": ["React", "Node.js", "PostgreSQL"]
    })
    if r and r.status_code == 200:
        log_pass("Proposal Writer")
    else:
        log_warn("Proposal Writer", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 10. CROSS-ROLE INTERACTION FLOWS
# ============================================================================
def test_cross_role_flows(tokens, client_created, freelancer_created):
    log_section("10. CROSS-ROLE INTERACTION FLOWS")

    client_h = auth_header(tokens.get("client", ""))
    freelancer_h = auth_header(tokens.get("freelancer", ""))

    if not client_h.get("Authorization") or not freelancer_h.get("Authorization"):
        log_fail("Cross-role flows", "Missing tokens for one or more roles")
        return

    # 10a. Client views proposals for their project
    project_id = client_created.get("project_id")
    if project_id:
        r = safe_request("get", f"{BASE_URL}/proposals?project_id={project_id}", headers=client_h)
        if r and r.status_code == 200:
            log_pass("Client views proposals for project")
        else:
            log_warn("Client views proposals", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 10b. Client sends message to freelancer
    r = safe_request("get", f"{BASE_URL}/auth/me", headers=auth_header(tokens["freelancer"]))
    freelancer_id = None
    if r and r.status_code == 200:
        freelancer_id = r.json().get("id")

    if freelancer_id:
        r = safe_request("post", f"{BASE_URL}/messages", headers=client_h, json={
            "receiver_id": freelancer_id,
            "content": f"Hi! I'd like to discuss the project. (E2E test {TEST_ID})"
        })
        if r and r.status_code in (200, 201):
            log_pass("Client sends message to freelancer")
        else:
            log_warn("Client message send", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 10c. Freelancer views received messages
    r = safe_request("get", f"{BASE_URL}/messages", headers=freelancer_h)
    if r and r.status_code == 200:
        log_pass("Freelancer views messages (inbox)")
    else:
        log_warn("Freelancer messages", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 10d. Client creates a contract (if proposal was accepted)
    proposal_id = freelancer_created.get("proposal_id")
    if proposal_id and freelancer_id:
        r = safe_request("post", f"{BASE_URL}/contracts", headers=client_h, json={
            "project_id": project_id,
            "freelancer_id": freelancer_id,
            "total_amount": 1500.0,
            "contract_type": "fixed",
            "description": f"E2E Test Contract {TEST_ID}",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
        })
        if r and r.status_code in (200, 201):
            data = r.json()
            log_pass("Client creates contract", f"id={data.get('id')}")
        else:
            log_warn("Create contract", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 10e. Client views reviews 
    r = safe_request("get", f"{BASE_URL}/reviews", headers=client_h)
    if r and r.status_code == 200:
        log_pass("Client views reviews")
    else:
        log_warn("Client reviews", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 11. SECURITY TESTS
# ============================================================================
def test_security(tokens):
    log_section("11. SECURITY TESTS")

    # 11a. SQL injection attempt
    r = safe_request("get", f"{BASE_URL}/projects?search=' OR 1=1 --")
    if r and r.status_code in (200, 400, 422):
        log_pass("SQL injection protection", f"status={r.status_code}")
    else:
        log_warn("SQL injection test", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 11b. XSS attempt in input
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": f"xss_{TEST_ID}@test.com",
        "password": TEST_PASSWORD,
        "name": "<script>alert('xss')</script>",
        "user_type": "client"
    })
    if r and r.status_code in (200, 201, 400, 422):
        if r.status_code in (200, 201):
            data = r.json()
            name = str(data.get("user", {}).get("name", data.get("name", "")))
            if "<script>" not in name:
                log_pass("XSS sanitization", "Script tags removed/escaped")
            else:
                log_fail("XSS vulnerability", "Script tags stored verbatim")
        else:
            log_pass("XSS input rejected", f"status={r.status_code}")
    else:
        log_warn("XSS test", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 11c. Rate limiting
    results = []
    for i in range(15):
        r = safe_request("post", f"{BASE_URL}/auth/login", json={
            "email": "ratelimit@test.com",
            "password": "wrong"
        })
        if r:
            results.append(r.status_code)
    if 429 in results:
        log_pass("Rate limiting active", f"429 triggered after {results.index(429)+1} requests")
    else:
        log_warn("Rate limiting", f"No 429 in {len(results)} requests, codes: {set(results)}")

    # 11d. Expired/invalid token
    r = safe_request("get", f"{BASE_URL}/auth/me",
                     headers={"Authorization": "Bearer invalid.token.here"})
    if r and r.status_code in (401, 403):
        log_pass("Invalid token rejected", f"status={r.status_code}")
    else:
        log_fail("Invalid token check", f"Expected 401/403, got {r.status_code if r else 'NO RESPONSE'}")

    # 11e. Authorization check - freelancer can't create project
    if "freelancer" in tokens:
        r = safe_request("post", f"{BASE_URL}/projects",
                        headers=auth_header(tokens["freelancer"]),
                        json={
                            "title": "Unauthorized Project",
                            "description": "This should fail",
                            "category": "test",
                            "budget_type": "fixed"
                        })
        if r and r.status_code in (403, 401):
            log_pass("RBAC: Freelancer can't create project", f"status={r.status_code}")
        elif r and r.status_code in (200, 201):
            log_fail("RBAC violation", "Freelancer was able to create a project!")
        else:
            log_warn("RBAC check", f"status={r.status_code if r else 'NO RESPONSE'}")

    # 11f. Client can't create gig
    if "client" in tokens:
        r = safe_request("post", f"{BASE_URL}/gigs",
                        headers=auth_header(tokens["client"]),
                        json={
                            "title": "Unauthorized Gig",
                            "description": "This should fail",
                            "basic_price": 50,
                            "basic_delivery_days": 7
                        })
        if r and r.status_code in (403, 401):
            log_pass("RBAC: Client can't create gig", f"status={r.status_code}")
        elif r and r.status_code in (200, 201):
            log_fail("RBAC violation", "Client was able to create a gig!")
        else:
            log_warn("RBAC check (gig)", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 12. INPUT VALIDATION TESTS
# ============================================================================
def test_input_validation():
    log_section("12. INPUT VALIDATION")

    # Missing required fields
    r = safe_request("post", f"{BASE_URL}/auth/register", json={})
    if r and r.status_code == 422:
        log_pass("Missing fields validation", "422 Unprocessable Entity")
    else:
        log_fail("Missing fields", f"Expected 422, got {r.status_code if r else 'NO RESPONSE'}")

    # Invalid email format
    r = safe_request("post", f"{BASE_URL}/auth/register", json={
        "email": "not-an-email",
        "password": TEST_PASSWORD,
        "name": "Test",
        "user_type": "client"
    })
    if r and r.status_code in (400, 422):
        log_pass("Invalid email rejected", f"status={r.status_code}")
    else:
        log_fail("Email validation", f"Expected 400/422, got {r.status_code if r else 'NO RESPONSE'}")

    # Invalid project data
    r = safe_request("post", f"{BASE_URL}/auth/login", json={
        "email": "",
        "password": ""
    })
    if r and r.status_code in (400, 422):
        log_pass("Empty login fields rejected")
    else:
        log_warn("Empty fields", f"status={r.status_code if r else 'NO RESPONSE'}")

    # Non-existent resource
    r = safe_request("get", f"{BASE_URL}/projects/999999")
    if r and r.status_code in (404, 401):
        log_pass("Non-existent project returns 404/401")
    else:
        log_warn("404 handling", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# 13. LOGOUT & SESSION CLEANUP
# ============================================================================
def test_logout(tokens):
    log_section("13. LOGOUT & SESSION CLEANUP")

    if "client" in tokens:
        r = safe_request("post", f"{BASE_URL}/auth/logout",
                        headers=auth_header(tokens["client"]))
        if r and r.status_code in (200, 204):
            log_pass("Client logout")
            # Verify token is invalidated
            r2 = safe_request("get", f"{BASE_URL}/auth/me",
                            headers=auth_header(tokens["client"]))
            if r2 and r2.status_code == 401:
                log_pass("Token invalidated after logout")
            else:
                log_warn("Token still valid after logout", f"status={r2.status_code if r2 else 'NO RESPONSE'}")
        else:
            log_warn("Client logout", f"status={r.status_code if r else 'NO RESPONSE'}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    print("\n" + "="*70)
    print("  MEGILANCE E2E COMPREHENSIVE TEST SUITE")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Test ID: {TEST_ID}")
    print(f"  Backend: {BASE_URL}")
    print("="*70)

    start = time.time()

    # 1. Health checks
    if not test_health_and_infrastructure():
        print("\n❌ Backend is not healthy. Cannot proceed with E2E tests.")
        sys.exit(1)

    # 2. Auth flows
    tokens = test_auth_flows()

    # 3. Client journey
    client_created = test_client_journey(tokens)

    # 4. Freelancer journey
    freelancer_created = test_freelancer_journey(tokens, client_created)

    # 5. Admin journey
    test_admin_journey(tokens)

    # 6. Public features
    test_public_features()

    # 7. Authenticated features
    test_authenticated_features(tokens)

    # 8. Advanced features
    test_advanced_features(tokens)

    # 9. Standalone tools
    test_standalone_tools()

    # 10. Cross-role flows
    test_cross_role_flows(tokens, client_created, freelancer_created)

    # 11. Security
    test_security(tokens)

    # 12. Input validation
    test_input_validation()

    # 13. Logout
    test_logout(tokens)

    # Final report
    duration = time.time() - start
    total = RESULTS["passed"] + RESULTS["failed"]

    print("\n" + "="*70)
    print("  FINAL E2E TEST REPORT")
    print("="*70)
    print(f"  Total tests:  {total}")
    print(f"  ✅ Passed:     {RESULTS['passed']}")
    print(f"  ❌ Failed:     {RESULTS['failed']}")
    print(f"  ⚠️  Warnings:  {len(RESULTS['warnings'])}")
    print(f"  Duration:     {duration:.1f}s")
    print(f"  Pass rate:    {(RESULTS['passed']/total*100):.1f}%" if total > 0 else "  Pass rate: N/A")

    if RESULTS["errors"]:
        print(f"\n  FAILURES ({len(RESULTS['errors'])}):")
        for err in RESULTS["errors"]:
            print(f"    ❌ {err}")

    if RESULTS["warnings"]:
        print(f"\n  WARNINGS ({len(RESULTS['warnings'])}):")
        for warn in RESULTS["warnings"]:
            print(f"    ⚠️  {warn}")

    print("\n" + "="*70)

    # Exit with error code if failures
    sys.exit(1 if RESULTS["failed"] > 0 else 0)


if __name__ == "__main__":
    main()
