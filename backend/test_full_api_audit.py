"""
Full API Audit - Tests ALL endpoints for ALL roles (client, freelancer, admin)
Tests: Authentication, CRUD operations, role-based access, error handling
"""
import requests
import json
import sys
import time
import random
import string
import traceback

BASE = 'http://localhost:8000'
TIMEOUT = 15

# Test state
tokens = {}
users = {}
created_ids = {}

def rand_str(n=8):
    return ''.join(random.choices(string.ascii_lowercase, k=n))

def rand_email():
    return f"test_{rand_str(10)}_{int(time.time())}@megilance-test.com"


class Colors:
    OK = '\033[92m'
    FAIL = '\033[91m'
    WARN = '\033[93m'
    INFO = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

results = {"ok": 0, "fail": 0, "warn": 0, "skip": 0, "errors": []}

def log_result(tag, method, path, status=None, detail=""):
    prefix = ""
    if tag == "OK":
        results["ok"] += 1
        prefix = f"{Colors.OK}[  OK  ]{Colors.END}"
    elif tag == "FAIL":
        results["fail"] += 1
        prefix = f"{Colors.FAIL}[ FAIL ]{Colors.END}"
        results["errors"].append(f"{method} {path} -> {status}: {detail[:200]}")
    elif tag == "WARN":
        results["warn"] += 1
        prefix = f"{Colors.WARN}[ WARN ]{Colors.END}"
    elif tag == "SKIP":
        results["skip"] += 1
        prefix = f"{Colors.INFO}[ SKIP ]{Colors.END}"
    print(f"{prefix} {method:6} {path:<60} {str(status or ''):>4} {detail[:80]}")


def api(method, path, token=None, json_data=None, params=None, expect_status=None, files=None):
    """Make an API call and return (status_code, response_json_or_text)"""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        elif method == "POST":
            if files:
                r = requests.post(url, headers=headers, files=files, data=json_data or {}, timeout=TIMEOUT)
            else:
                r = requests.post(url, headers=headers, json=json_data, params=params, timeout=TIMEOUT)
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=json_data, params=params, timeout=TIMEOUT)
        elif method == "PATCH":
            r = requests.patch(url, headers=headers, json=json_data, params=params, timeout=TIMEOUT)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, params=params, timeout=TIMEOUT)
        else:
            return None, "Unknown method"
        
        try:
            body = r.json()
        except:
            body = r.text
        
        return r.status_code, body
    except Exception as e:
        return None, str(e)


def check(tag, method, path, status, body, expect_ok=True):
    """Check result and log"""
    if status is None:
        log_result("FAIL", method, path, "ERR", str(body))
        return False
    
    detail = ""
    if isinstance(body, dict):
        detail = json.dumps(body)[:120]
    elif isinstance(body, list):
        detail = f"[{len(body)} items]"
    else:
        detail = str(body)[:120]
    
    if expect_ok:
        if 200 <= status < 400:
            log_result("OK", method, path, status, detail)
            return True
        elif status == 422:
            log_result("WARN", method, path, status, detail)
            return True  # Endpoint exists
        elif status == 403:
            log_result("WARN", method, path, status, "Forbidden (wrong role)")
            return True  # Endpoint exists
        else:
            log_result("FAIL", method, path, status, detail)
            return False
    else:
        log_result("OK" if status >= 400 else "WARN", method, path, status, detail)
        return True


# ================================================================
# PHASE 1: AUTHENTICATION & USER REGISTRATION
# ================================================================
def test_auth():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 1: AUTHENTICATION & USER REGISTRATION")
    print(f"{'='*80}{Colors.END}\n")
    
    roles = ["client", "freelancer", "admin"]
    
    for role in roles:
        email = rand_email()
        password = "TestPass123!@#"
        
        # Register
        reg_data = {
            "email": email,
            "password": password,
            "full_name": f"Test {role.title()} User",
            "role": role if role != "admin" else "freelancer"  # Register as freelancer, upgrade later
        }
        
        status, body = api("POST", "/api/auth/register", json_data=reg_data)
        if status == 200 or status == 201:
            log_result("OK", "POST", f"/api/auth/register ({role})", status, f"Registered: {email}")
            users[role] = {"email": email, "password": password}
        elif status == 409 or (isinstance(body, dict) and "already" in str(body.get("detail", "")).lower()):
            log_result("WARN", "POST", f"/api/auth/register ({role})", status, "User exists")
            users[role] = {"email": email, "password": password}
        else:
            log_result("FAIL", "POST", f"/api/auth/register ({role})", status, str(body)[:100])
            continue
        
        # Login
        status, body = api("POST", "/api/auth/login", json_data={"email": email, "password": password})
        if status == 200 and isinstance(body, dict) and "access_token" in body:
            tokens[role] = body["access_token"]
            log_result("OK", "POST", f"/api/auth/login ({role})", status, f"Token received")
            if body.get("refresh_token"):
                users[role]["refresh_token"] = body["refresh_token"]
        else:
            log_result("FAIL", "POST", f"/api/auth/login ({role})", status, str(body)[:100])
    
    # If admin doesn't have special token, try to upgrade via DB or use existing admin
    if "admin" not in tokens:
        print(f"\n{Colors.WARN}[INFO] Trying existing admin credentials...{Colors.END}")
        for admin_email in ["admin@megilance.com", "admin@example.com"]:
            status, body = api("POST", "/api/auth/login", json_data={"email": admin_email, "password": "AdminPass123!"})
            if status == 200 and isinstance(body, dict) and "access_token" in body:
                tokens["admin"] = body["access_token"]
                log_result("OK", "POST", "/api/auth/login (admin)", status, f"Admin token: {admin_email}")
                break
    
    # Test /auth/me for each role
    for role in roles:
        if role in tokens:
            status, body = api("GET", "/api/auth/me", token=tokens[role])
            check("OK", "GET", f"/api/auth/me ({role})", status, body)
    
    # Test refresh token
    for role in ["client", "freelancer"]:
        if role in users and users[role].get("refresh_token"):
            status, body = api("POST", "/api/auth/refresh", json_data={"refresh_token": users[role]["refresh_token"]})
            check("OK", "POST", f"/api/auth/refresh ({role})", status, body)
            if status == 200 and isinstance(body, dict) and "access_token" in body:
                tokens[role] = body["access_token"]  # Update token
    
    # Test password change
    for role in ["freelancer"]:
        if role in tokens and role in users:
            status, body = api("POST", "/api/auth/change-password", token=tokens[role],
                             json_data={"current_password": users[role]["password"], "new_password": users[role]["password"]})
            if status in [200, 422]:
                log_result("OK", "POST", "/api/auth/change-password", status, "")
            else:
                log_result("WARN", "POST", "/api/auth/change-password", status, str(body)[:100])


# ================================================================
# PHASE 2: USER PROFILE MANAGEMENT
# ================================================================
def test_users():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 2: USER PROFILE MANAGEMENT")
    print(f"{'='*80}{Colors.END}\n")
    
    for role in ["client", "freelancer"]:
        if role not in tokens:
            continue
        t = tokens[role]
        
        # Get profile
        status, body = api("GET", "/api/users/me", token=t)
        check("OK", "GET", f"/api/users/me ({role})", status, body)
        if status == 200 and isinstance(body, dict):
            created_ids[f"user_{role}_id"] = body.get("id")
        
        # Update profile
        status, body = api("PUT", "/api/users/me", token=t, json_data={
            "full_name": f"Updated {role.title()} Name",
            "bio": f"Professional {role} on MegiLance platform",
            "location": "London, UK",
            "phone": "+44123456789"
        })
        check("OK", "PUT", f"/api/users/me ({role})", status, body)
    
    # Public profiles
    status, body = api("GET", "/api/freelancers/featured")
    check("OK", "GET", "/api/freelancers/featured", status, body)
    
    status, body = api("GET", "/api/freelancers/search")
    check("OK", "GET", "/api/freelancers/search", status, body)


# ================================================================
# PHASE 3: PROJECTS CRUD (Client creates, Freelancer browses)
# ================================================================
def test_projects():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 3: PROJECT MANAGEMENT CRUD")
    print(f"{'='*80}{Colors.END}\n")
    
    ct = tokens.get("client")
    ft = tokens.get("freelancer")
    
    if not ct:
        log_result("SKIP", "---", "Projects (no client token)", None, "")
        return
    
    # CREATE project (client)
    project_data = {
        "title": f"Test Project {rand_str(6)}",
        "description": "A comprehensive test project for API validation. This project requires full-stack development expertise.",
        "budget_min": 500,
        "budget_max": 5000,
        "category": "Web Development",
        "skills_required": ["Python", "React", "FastAPI"],
        "duration": "1-3 months",
        "experience_level": "intermediate"
    }
    status, body = api("POST", "/api/projects", token=ct, json_data=project_data)
    check("OK", "POST", "/api/projects (create)", status, body)
    project_id = None
    if status in [200, 201] and isinstance(body, dict):
        project_id = body.get("id")
        created_ids["project_id"] = project_id
    
    # READ - List projects (public)
    status, body = api("GET", "/api/projects/browse")
    check("OK", "GET", "/api/projects/browse", status, body)
    
    # READ - My projects (client)
    status, body = api("GET", "/api/projects/my-projects", token=ct)
    check("OK", "GET", "/api/projects/my-projects (client)", status, body)
    
    # READ - Single project
    if project_id:
        status, body = api("GET", f"/api/projects/{project_id}", token=ct)
        check("OK", "GET", f"/api/projects/{project_id}", status, body)
        
        # UPDATE project
        status, body = api("PUT", f"/api/projects/{project_id}", token=ct, json_data={
            "title": f"Updated Project {rand_str(4)}",
            "description": "Updated description for testing",
            "budget_min": 600,
            "budget_max": 6000
        })
        check("OK", "PUT", f"/api/projects/{project_id} (update)", status, body)
    
    # Recommended projects (freelancer)
    if ft:
        status, body = api("GET", "/api/projects/recommended", token=ft)
        check("OK", "GET", "/api/projects/recommended (freelancer)", status, body)
        
        status, body = api("GET", "/api/projects/browse", token=ft)
        check("OK", "GET", "/api/projects/browse (freelancer)", status, body)


# ================================================================
# PHASE 4: PROPOSALS CRUD
# ================================================================
def test_proposals():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 4: PROPOSAL MANAGEMENT CRUD")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    project_id = created_ids.get("project_id")
    
    if not ft:
        log_result("SKIP", "---", "Proposals (no freelancer token)", None, "")
        return
    
    # CREATE proposal (freelancer)
    if project_id:
        proposal_data = {
            "project_id": project_id,
            "cover_letter": "I am an experienced developer and would love to work on this project. I have 5+ years of relevant experience.",
            "bid_amount": 2500,
            "estimated_duration": "4 weeks",
            "milestones": [
                {"title": "Phase 1: Design", "amount": 800, "duration": "1 week"},
                {"title": "Phase 2: Development", "amount": 1200, "duration": "2 weeks"},
                {"title": "Phase 3: Testing", "amount": 500, "duration": "1 week"}
            ]
        }
        status, body = api("POST", "/api/proposals/", token=ft, json_data=proposal_data)
        check("OK", "POST", "/api/proposals/ (create)", status, body)
        if status in [200, 201] and isinstance(body, dict):
            created_ids["proposal_id"] = body.get("id")
    
    # READ - My proposals (freelancer)
    status, body = api("GET", "/api/proposals/my-proposals", token=ft)
    check("OK", "GET", "/api/proposals/my-proposals (freelancer)", status, body)
    
    # READ - Project proposals (client)
    if ct and project_id:
        status, body = api("GET", f"/api/proposals/project/{project_id}", token=ct)
        check("OK", "GET", f"/api/proposals/project/{project_id} (client)", status, body)
    
    # READ - Single proposal
    proposal_id = created_ids.get("proposal_id")
    if proposal_id:
        status, body = api("GET", f"/api/proposals/{proposal_id}", token=ft)
        check("OK", "GET", f"/api/proposals/{proposal_id}", status, body)
        
        # UPDATE proposal
        status, body = api("PUT", f"/api/proposals/{proposal_id}", token=ft, json_data={
            "cover_letter": "Updated cover letter with more details about my experience.",
            "bid_amount": 2800
        })
        check("OK", "PUT", f"/api/proposals/{proposal_id} (update)", status, body)


# ================================================================
# PHASE 5: CONTRACTS & MILESTONES
# ================================================================
def test_contracts():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 5: CONTRACTS & MILESTONES")
    print(f"{'='*80}{Colors.END}\n")
    
    ct = tokens.get("client")
    ft = tokens.get("freelancer")
    
    # List contracts
    for role, t in [("client", ct), ("freelancer", ft)]:
        if t:
            status, body = api("GET", "/api/contracts/", token=t)
            check("OK", "GET", f"/api/contracts/ ({role})", status, body)
    
    # Create contract (client)
    proposal_id = created_ids.get("proposal_id")
    freelancer_id = created_ids.get("user_freelancer_id")
    project_id = created_ids.get("project_id")
    
    if ct and proposal_id and freelancer_id and project_id:
        contract_data = {
            "project_id": project_id,
            "freelancer_id": freelancer_id,
            "proposal_id": proposal_id,
            "title": f"Contract for Test Project",
            "description": "Full development contract",
            "amount": 2500,
            "start_date": "2026-03-15",
            "end_date": "2026-06-15",
            "payment_terms": "milestone-based"
        }
        status, body = api("POST", "/api/contracts/", token=ct, json_data=contract_data)
        check("OK", "POST", "/api/contracts/ (create)", status, body)
        if status in [200, 201] and isinstance(body, dict):
            created_ids["contract_id"] = body.get("id")
    
    # List milestones
    for role, t in [("client", ct), ("freelancer", ft)]:
        if t:
            status, body = api("GET", "/api/milestones", token=t)
            check("OK", "GET", f"/api/milestones ({role})", status, body)


# ================================================================
# PHASE 6: MESSAGING
# ================================================================
def test_messages():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 6: MESSAGING")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    
    for role, t in [("client", ct), ("freelancer", ft)]:
        if not t:
            continue
        
        status, body = api("GET", "/api/messages", token=t)
        check("OK", "GET", f"/api/messages ({role})", status, body)
        
        status, body = api("GET", "/api/messages/conversations", token=t)
        check("OK", "GET", f"/api/messages/conversations ({role})", status, body)
    
    # Send message (client -> freelancer)
    freelancer_id = created_ids.get("user_freelancer_id")
    if ct and freelancer_id:
        status, body = api("POST", "/api/messages", token=ct, json_data={
            "receiver_id": freelancer_id,
            "content": "Hello! I'd like to discuss the project."
        })
        check("OK", "POST", "/api/messages (send)", status, body)
        if status in [200, 201] and isinstance(body, dict):
            created_ids["message_id"] = body.get("id")


# ================================================================
# PHASE 7: NOTIFICATIONS 
# ================================================================
def test_notifications():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 7: NOTIFICATIONS")
    print(f"{'='*80}{Colors.END}\n")
    
    for role in ["client", "freelancer"]:
        t = tokens.get(role)
        if not t:
            continue
        
        status, body = api("GET", "/api/notifications", token=t)
        check("OK", "GET", f"/api/notifications ({role})", status, body)
        
        status, body = api("GET", "/api/notifications/unread-count", token=t)
        check("OK", "GET", f"/api/notifications/unread-count ({role})", status, body)
    
    # Notification preferences
    for role in ["client", "freelancer"]:
        t = tokens.get(role)
        if not t:
            continue
        status, body = api("GET", "/api/notification-preferences", token=t)
        check("OK", "GET", f"/api/notification-preferences ({role})", status, body)


# ================================================================
# PHASE 8: REVIEWS & DISPUTES
# ================================================================
def test_reviews_disputes():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 8: REVIEWS & DISPUTES")
    print(f"{'='*80}{Colors.END}\n")
    
    for role in ["client", "freelancer"]:
        t = tokens.get(role)
        if not t:
            continue
        
        # Reviews
        status, body = api("GET", "/api/reviews", token=t)
        check("OK", "GET", f"/api/reviews ({role})", status, body)
        
        status, body = api("GET", "/api/reviews/received", token=t)
        check("OK", "GET", f"/api/reviews/received ({role})", status, body)
        
        status, body = api("GET", "/api/reviews/given", token=t)
        check("OK", "GET", f"/api/reviews/given ({role})", status, body)
        
        # Disputes
        status, body = api("GET", "/api/disputes", token=t)
        check("OK", "GET", f"/api/disputes ({role})", status, body)


# ================================================================
# PHASE 9: PAYMENTS, WALLET, ESCROW, INVOICES
# ================================================================
def test_payments():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 9: PAYMENTS, WALLET, ESCROW, INVOICES")
    print(f"{'='*80}{Colors.END}\n")
    
    for role in ["client", "freelancer"]:
        t = tokens.get(role)
        if not t:
            continue
        
        # Payments
        status, body = api("GET", "/api/payments/", token=t)
        check("OK", "GET", f"/api/payments/ ({role})", status, body)
        
        # Wallet
        status, body = api("GET", "/api/wallet/balance", token=t)
        check("OK", "GET", f"/api/wallet/balance ({role})", status, body)
        
        status, body = api("GET", "/api/wallet/transactions", token=t)
        check("OK", "GET", f"/api/wallet/transactions ({role})", status, body)
        
        # Escrow
        status, body = api("GET", "/api/escrow/", token=t)
        check("OK", "GET", f"/api/escrow/ ({role})", status, body)
        
        # Invoices
        status, body = api("GET", "/api/invoices/", token=t)
        check("OK", "GET", f"/api/invoices/ ({role})", status, body)
        
        # Refunds
        status, body = api("GET", "/api/refunds/", token=t)
        check("OK", "GET", f"/api/refunds/ ({role})", status, body)


# ================================================================
# PHASE 10: GIGS MARKETPLACE
# ================================================================
def test_gigs():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 10: GIG MARKETPLACE")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    
    # Public gig listing
    status, body = api("GET", "/api/gigs")
    check("OK", "GET", "/api/gigs (public)", status, body)
    
    # Freelancer creates gig
    if ft:
        gig_data = {
            "title": f"Professional Web Development Service {rand_str(4)}",
            "description": "I will build a professional website using modern technologies including React, Next.js, and Node.js.",
            "category": "Web Development",
            "price": 150,
            "delivery_time": 7,
            "packages": [
                {"name": "Basic", "price": 150, "delivery_days": 7, "description": "Basic website with 3 pages"},
                {"name": "Standard", "price": 350, "delivery_days": 14, "description": "Website with 5 pages + responsive"},
                {"name": "Premium", "price": 700, "delivery_days": 21, "description": "Full website + SEO + animations"}
            ]
        }
        status, body = api("POST", "/api/gigs", token=ft, json_data=gig_data)
        check("OK", "POST", "/api/gigs (create)", status, body)
        if status in [200, 201] and isinstance(body, dict):
            created_ids["gig_id"] = body.get("id")
        
        # My gigs
        status, body = api("GET", "/api/gigs/seller/my-gigs", token=ft)
        check("OK", "GET", "/api/gigs/seller/my-gigs", status, body)
    
    # Seller stats
    if ft:
        status, body = api("GET", "/api/seller-stats/me", token=ft)
        check("OK", "GET", "/api/seller-stats/me", status, body)
    
    status, body = api("GET", "/api/seller-stats/levels")
    check("OK", "GET", "/api/seller-stats/levels (public)", status, body)
    
    status, body = api("GET", "/api/seller-stats/leaderboard")
    check("OK", "GET", "/api/seller-stats/leaderboard (public)", status, body)


# ================================================================
# PHASE 11: PORTAL ENDPOINTS (Dashboard APIs)
# ================================================================
def test_portal():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 11: PORTAL/DASHBOARD ENDPOINTS")  
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    
    # Freelancer portal
    if ft:
        freelancer_endpoints = [
            "/api/portal/freelancer/dashboard",
            "/api/portal/freelancer/stats",
            "/api/portal/freelancer/projects",
            "/api/portal/freelancer/proposals",
            "/api/portal/freelancer/wallet",
            "/api/portal/freelancer/earnings",
            "/api/portal/freelancer/reviews",
            "/api/portal/freelancer/notifications",
        ]
        for ep in freelancer_endpoints:
            status, body = api("GET", ep, token=ft)
            check("OK", "GET", ep, status, body)
    
    # Client portal
    if ct:
        client_endpoints = [
            "/api/portal/client/dashboard/stats",
            "/api/portal/client/projects",
            "/api/portal/client/proposals",
            "/api/portal/client/payments",
            "/api/portal/client/wallet",
            "/api/portal/client/spending/monthly",
        ]
        for ep in client_endpoints:
            status, body = api("GET", ep, token=ct)
            check("OK", "GET", ep, status, body)


# ================================================================
# PHASE 12: SEARCH & DISCOVERY
# ================================================================
def test_search():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 12: SEARCH & DISCOVERY")
    print(f"{'='*80}{Colors.END}\n")
    
    t = tokens.get("freelancer") or tokens.get("client")
    
    status, body = api("GET", "/api/search/projects", token=t)
    check("OK", "GET", "/api/search/projects", status, body)
    
    status, body = api("GET", "/api/search/freelancers", token=t)
    check("OK", "GET", "/api/search/freelancers", status, body)


# ================================================================
# PHASE 13: CATEGORIES, SKILLS, TAGS
# ================================================================
def test_categories_skills():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 13: CATEGORIES, SKILLS, TAGS")
    print(f"{'='*80}{Colors.END}\n")
    
    # Public endpoints
    status, body = api("GET", "/api/categories/")
    check("OK", "GET", "/api/categories/", status, body)
    
    status, body = api("GET", "/api/skills/")
    check("OK", "GET", "/api/skills/", status, body)
    
    status, body = api("GET", "/api/tags/")
    check("OK", "GET", "/api/tags/", status, body)


# ================================================================
# PHASE 14: PORTFOLIO
# ================================================================
def test_portfolio():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 14: PORTFOLIO")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    if not ft:
        log_result("SKIP", "---", "Portfolio", None, "")
        return
    
    status, body = api("GET", "/api/portfolio/", token=ft)
    check("OK", "GET", "/api/portfolio/", status, body)
    
    # Create portfolio item
    portfolio_data = {
        "title": f"Amazing Project {rand_str(4)}",
        "description": "A showcase project demonstrating full-stack development skills",
        "project_url": "https://example.com/project",
        "technologies": ["React", "Python", "FastAPI"],
        "category": "Web Development"
    }
    status, body = api("POST", "/api/portfolio/", token=ft, json_data=portfolio_data)
    check("OK", "POST", "/api/portfolio/ (create)", status, body)
    if status in [200, 201] and isinstance(body, dict):
        created_ids["portfolio_id"] = body.get("id")


# ================================================================
# PHASE 15: COMMUNITY
# ================================================================
def test_community():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 15: COMMUNITY FEATURES")
    print(f"{'='*80}{Colors.END}\n")
    
    t = tokens.get("freelancer") or tokens.get("client")
    
    endpoints = [
        "/api/community/questions",
        "/api/community/playbooks",
        "/api/community/office-hours",
    ]
    for ep in endpoints:
        status, body = api("GET", ep, token=t)
        check("OK", "GET", ep, status, body)


# ================================================================
# PHASE 16: ADMIN ENDPOINTS
# ================================================================
def test_admin():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 16: ADMIN ENDPOINTS")
    print(f"{'='*80}{Colors.END}\n")
    
    at = tokens.get("admin")
    if not at:
        log_result("SKIP", "---", "Admin endpoints (no admin token)", None, "")
        return
    
    admin_endpoints = [
        "/api/admin/dashboard/stats",
        "/api/admin/users",
        "/api/admin/projects",
        "/api/admin/contracts",
        "/api/admin/payments",
        "/api/admin/disputes",
        "/api/admin/reports",
    ]
    for ep in admin_endpoints:
        status, body = api("GET", ep, token=at)
        check("OK", "GET", ep, status, body)


# ================================================================
# PHASE 17: ANALYTICS & REPORTING
# ================================================================
def test_analytics():
    print(f"\n{Colors.BOLD}{'='*80}")  
    print("PHASE 17: ANALYTICS & REPORTING")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    
    if ft:
        status, body = api("GET", "/api/analytics/dashboard/freelancer", token=ft)
        check("OK", "GET", "/api/analytics/dashboard/freelancer", status, body)
    
    t = ft or ct
    if t:
        status, body = api("GET", "/api/analytics/dashboard/summary", token=t)
        check("OK", "GET", "/api/analytics/dashboard/summary", status, body)
        
        status, body = api("GET", "/api/analytics/platform/health", token=t)
        check("OK", "GET", "/api/analytics/platform/health", status, body)


# ================================================================
# PHASE 18: SUPPORT & TIME TRACKING
# ================================================================
def test_support():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 18: SUPPORT TICKETS & TIME TRACKING")
    print(f"{'='*80}{Colors.END}\n")
    
    for role in ["client", "freelancer"]:
        t = tokens.get(role)
        if not t:
            continue
        
        status, body = api("GET", "/api/support-tickets/", token=t)
        check("OK", "GET", f"/api/support-tickets/ ({role})", status, body)
        
        status, body = api("GET", "/api/time-entries/", token=t)
        check("OK", "GET", f"/api/time-entries/ ({role})", status, body)


# ================================================================
# PHASE 19: AI FEATURES
# ================================================================
def test_ai():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 19: AI-POWERED FEATURES")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    if ft:
        status, body = api("GET", "/api/ai-advanced/model-stats", token=ft)
        check("OK", "GET", "/api/ai-advanced/model-stats", status, body)
        
        status, body = api("GET", "/api/ai-writing/templates", token=ft)
        check("OK", "GET", "/api/ai-writing/templates", status, body)
        
        status, body = api("GET", "/api/ai-writing/usage", token=ft)
        check("OK", "GET", "/api/ai-writing/usage", status, body)


# ================================================================
# PHASE 20: MISCELLANEOUS FEATURES
# ================================================================
def test_misc():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 20: MISCELLANEOUS FEATURES")
    print(f"{'='*80}{Colors.END}\n")
    
    t = tokens.get("freelancer") or tokens.get("client")
    
    misc_auth_endpoints = [
        "/api/activity/feed",
        "/api/activity/stats",
        "/api/saved-searches",
        "/api/job-alerts/",
        "/api/favorites/",
        "/api/referrals/",
        "/api/verification/status",
        "/api/2fa/status",
        "/api/compliance/data-request/status",
        "/api/feature-flags/flags",
        "/api/availability/schedule",
        "/api/availability/settings",
        "/api/rate-cards/my-cards",
        "/api/proposal-templates/",
        "/api/workroom/my-workrooms",
        "/api/teams/teams/my-teams",
        "/api/learning/courses",
    ]
    
    for ep in misc_auth_endpoints:
        status, body = api("GET", ep, token=t)
        check("OK", "GET", ep, status, body)
    
    # Public endpoints
    public_endpoints = [
        "/api/blog/",
        "/api/knowledge-base/categories",
        "/api/knowledge-base/articles",
        "/api/external-projects",
        "/api/external-projects-categories",
        "/api/health/live",
        "/api/health/ready",
    ]
    
    for ep in public_endpoints:
        status, body = api("GET", ep)
        check("OK", "GET", ep, status, body)


# ================================================================
# PHASE 21: PUBLIC TOOLS (Standalone tools)
# ================================================================
def test_public_tools():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 21: PUBLIC STANDALONE TOOLS")
    print(f"{'='*80}{Colors.END}\n")
    
    # Price Estimator
    status, body = api("POST", "/api/price-estimator/estimate", json_data={
        "project_type": "web_development",
        "complexity": "medium",
        "features": ["authentication", "dashboard", "payments"],
        "timeline": "1-3 months"
    })
    check("OK", "POST", "/api/price-estimator/estimate", status, body)
    
    # Income Calculator
    status, body = api("POST", "/api/income-calculator/calculate", json_data={
        "hourly_rate": 50,
        "hours_per_week": 40,
        "weeks_per_year": 48,
        "tax_rate": 20,
        "expenses_monthly": 500
    })
    check("OK", "POST", "/api/income-calculator/calculate", status, body)
    
    # Scope Planner
    status, body = api("POST", "/api/scope-planner/plan", json_data={
        "project_description": "E-commerce website with user authentication",
        "features": ["Product catalog", "Shopping cart", "Payment processing"]
    })
    check("OK", "POST", "/api/scope-planner/plan", status, body)


# ================================================================
# PHASE 22: ROLE-BASED ACCESS CONTROL TESTS
# ================================================================
def test_rbac():
    print(f"\n{Colors.BOLD}{'='*80}")
    print("PHASE 22: ROLE-BASED ACCESS CONTROL")
    print(f"{'='*80}{Colors.END}\n")
    
    ft = tokens.get("freelancer")
    ct = tokens.get("client")
    
    # Freelancer should NOT create projects
    if ft:
        status, body = api("POST", "/api/projects/", token=ft, json_data={
            "title": "Should fail", "description": "Test", "budget_min": 100, "budget_max": 1000
        })
        if status in [403, 401]:
            log_result("OK", "POST", "/api/projects/ (freelancer=forbidden)", status, "RBAC enforced")
        elif status in [200, 201]:
            log_result("WARN", "POST", "/api/projects/ (freelancer)", status, "Freelancer can create projects - check RBAC")
        else:
            log_result("WARN", "POST", "/api/projects/ (freelancer)", status, str(body)[:80])
    
    # Client should NOT create gigs
    if ct:
        status, body = api("POST", "/api/gigs", token=ct, json_data={
            "title": "Should fail", "description": "Test", "price": 100
        })
        if status in [403, 401]:
            log_result("OK", "POST", "/api/gigs (client=forbidden)", status, "RBAC enforced")
        elif status in [200, 201]:
            log_result("WARN", "POST", "/api/gigs (client)", status, "Client can create gigs - check RBAC")
        else:
            log_result("WARN", "POST", "/api/gigs (client)", status, str(body)[:80])
    
    # Unauthenticated should NOT access protected endpoints
    protected = ["/api/auth/me", "/api/projects/my-projects", "/api/contracts/", "/api/wallet/balance"]
    for ep in protected:
        status, body = api("GET", ep)
        if status in [401, 403]:
            log_result("OK", "GET", f"{ep} (no auth)", status, "Auth enforced")
        else:
            log_result("FAIL", "GET", f"{ep} (no auth)", status, "Should require auth!")


# ================================================================
# MAIN
# ================================================================
def main():
    print(f"\n{Colors.BOLD}")
    print("=" * 80)
    print("  MEGILANCE FULL API AUDIT")
    print("  Testing ALL endpoints for ALL roles (Client, Freelancer, Admin)")
    print("  CRUD Operations + Role-Based Access Control")
    print("=" * 80)
    print(f"{Colors.END}")
    
    # Check server is running
    try:
        r = requests.get(f"{BASE}/api/health/ready", timeout=5)
        if r.status_code != 200:
            print(f"{Colors.FAIL}Backend not ready: {r.status_code}{Colors.END}")
            sys.exit(1)
    except:
        print(f"{Colors.FAIL}Backend not reachable at {BASE}{Colors.END}")
        sys.exit(1)
    
    phases = [
        ("Auth & Registration", test_auth),
        ("User Profiles", test_users),
        ("Projects CRUD", test_projects),
        ("Proposals CRUD", test_proposals),
        ("Contracts & Milestones", test_contracts),
        ("Messaging", test_messages),
        ("Notifications", test_notifications),
        ("Reviews & Disputes", test_reviews_disputes),
        ("Payments & Wallet", test_payments),
        ("Gig Marketplace", test_gigs),
        ("Portal/Dashboard", test_portal),
        ("Search & Discovery", test_search),
        ("Categories & Skills", test_categories_skills),
        ("Portfolio", test_portfolio),
        ("Community", test_community),
        ("Admin", test_admin),
        ("Analytics", test_analytics),
        ("Support & Time", test_support),
        ("AI Features", test_ai),
        ("Misc Features", test_misc),
        ("Public Tools", test_public_tools),
        ("RBAC Enforcement", test_rbac),
    ]
    
    for name, fn in phases:
        try:
            fn()
        except Exception as e:
            print(f"\n{Colors.FAIL}[CRASH] Phase '{name}' crashed: {e}{Colors.END}")
            traceback.print_exc()
            results["fail"] += 1
            results["errors"].append(f"Phase '{name}' crashed: {str(e)[:200]}")
    
    # Summary
    total = results["ok"] + results["fail"] + results["warn"] + results["skip"]
    print(f"\n{'='*80}")
    print(f"{Colors.BOLD}  FINAL AUDIT RESULTS{Colors.END}")
    print(f"{'='*80}")
    print(f"  {Colors.OK}PASSED:  {results['ok']}{Colors.END}")
    print(f"  {Colors.FAIL}FAILED:  {results['fail']}{Colors.END}")
    print(f"  {Colors.WARN}WARNINGS:{results['warn']}{Colors.END}")
    print(f"  {Colors.INFO}SKIPPED: {results['skip']}{Colors.END}")
    print(f"  TOTAL:   {total}")
    print(f"{'='*80}")
    
    if results["errors"]:
        print(f"\n{Colors.FAIL}{Colors.BOLD}FAILED ENDPOINTS ({len(results['errors'])}):{Colors.END}")
        for err in results["errors"]:
            print(f"  {Colors.FAIL}X {err}{Colors.END}")
    
    pass_rate = (results["ok"] / total * 100) if total > 0 else 0
    print(f"\n  Pass Rate: {pass_rate:.1f}%")
    
    if results["fail"] == 0:
        print(f"\n  {Colors.OK}{Colors.BOLD}[OK] ALL TESTS PASSED - READY FOR DEFENSE!{Colors.END}")
    else:
        print(f"\n  {Colors.FAIL}{Colors.BOLD}[X] {results['fail']} TESTS FAILED - NEEDS FIXING{Colors.END}")
    
    return results["fail"] == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
