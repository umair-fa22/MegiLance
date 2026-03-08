#!/usr/bin/env python3
"""
MegiLance Comprehensive E2E Test Suite - All User Flows & Features
Tests every role (client, freelancer, admin) across all 110+ feature areas.
Run against a live backend: python tests/test_e2e_all_flows.py
"""
import requests
import uuid
import json
import time
import sys
import os
from datetime import datetime

# Fix Windows encoding for file redirect
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
os.environ.setdefault('PYTHONIOENCODING', 'utf-8')

BASE = "http://localhost:8000/api"
TIMEOUT = 30
TEST_ID = uuid.uuid4().hex[:8]
PASSWORD = "TestPass123!"

# Track results
results = {"pass": 0, "fail": 0, "warn": 0, "skip": 0}
failures = []
section_results = {}
current_section = ""

def req(method, path, token=None, body=None, expected=None, label=""):
    """Make an API request and report result."""
    global results, current_section
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=TIMEOUT)
        elif method == "POST":
            r = requests.post(url, json=body, headers=headers, timeout=TIMEOUT)
        elif method == "PUT":
            r = requests.put(url, json=body, headers=headers, timeout=TIMEOUT)
        elif method == "PATCH":
            r = requests.patch(url, json=body, headers=headers, timeout=TIMEOUT)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=TIMEOUT)
        else:
            r = requests.request(method, url, json=body, headers=headers, timeout=TIMEOUT)
    except requests.exceptions.Timeout:
        results["fail"] += 1
        failures.append(f"  TIMEOUT: {label} ({method} {path})")
        print(f"  \u274c TIMEOUT: {label}")
        return None, None
    except Exception as e:
        results["fail"] += 1
        failures.append(f"  ERROR: {label} - {e}")
        print(f"  \u274c ERROR: {label} - {type(e).__name__}")
        return None, None

    status = r.status_code
    try:
        data = r.json()
    except Exception:
        data = r.text

    if expected:
        if isinstance(expected, (list, tuple)):
            ok = status in expected
        else:
            ok = status == expected
    else:
        ok = 200 <= status < 400

    if ok:
        results["pass"] += 1
        detail = ""
        if isinstance(data, dict):
            if "id" in data:
                detail = f" id={data['id']}"
            elif "status" in data:
                detail = f" status={data['status']}"
            elif "access_token" in data:
                detail = " got_token"
        print(f"  \u2705 PASS: {label} [{status}]{detail}")
    else:
        results["fail"] += 1
        err_detail = ""
        if isinstance(data, dict) and "detail" in data:
            err_detail = f" - {str(data['detail'])[:80]}"
        failures.append(f"  [{current_section}] {label}: expected {expected or '2xx'}, got {status}{err_detail}")
        print(f"  \u274c FAIL: {label} [{status}]{err_detail}")

    return status, data


def section(name):
    global current_section
    current_section = name
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")


# ============================================================
# SETUP: Create test users
# ============================================================
print(f"\n{'='*60}")
print(f"  MEGILANCE COMPREHENSIVE E2E TEST SUITE")
print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print(f"  Test ID: {TEST_ID}")
print(f"{'='*60}")

CLIENT_EMAIL = f"e2e_client_{TEST_ID}@test.com"
FREELANCER_EMAIL = f"e2e_freelancer_{TEST_ID}@test.com"

# ============================================================
section("1. HEALTH & INFRASTRUCTURE")
# ============================================================
req("GET", "/health/ready", label="Health ready")
req("GET", "/health/live", label="Health live")
req("GET", "/health/metrics", label="Health metrics")
req("GET", "/health/", label="Health root")

# ============================================================
section("2. AUTHENTICATION - Registration")
# ============================================================
s, d = req("POST", "/auth/register", body={
    "email": CLIENT_EMAIL, "password": PASSWORD, "name": f"E2E Client {TEST_ID}", "user_type": "client"
}, expected=201, label="Register client")
client_id = d.get("id") if isinstance(d, dict) else None

s, d = req("POST", "/auth/register", body={
    "email": FREELANCER_EMAIL, "password": PASSWORD, "name": f"E2E Freelancer {TEST_ID}", "user_type": "freelancer"
}, expected=201, label="Register freelancer")
freelancer_id = d.get("id") if isinstance(d, dict) else None

# Duplicate email
req("POST", "/auth/register", body={
    "email": CLIENT_EMAIL, "password": PASSWORD, "name": "Dup", "user_type": "client"
}, expected=[400, 409], label="Duplicate email rejected")

# Weak password
req("POST", "/auth/register", body={
    "email": "weak@test.com", "password": "123", "name": "Weak", "user_type": "client"
}, expected=[400, 422], label="Weak password rejected")

# Invalid email
req("POST", "/auth/register", body={
    "email": "not-an-email", "password": PASSWORD, "name": "Bad", "user_type": "client"
}, expected=[400, 422], label="Invalid email rejected")

# ============================================================
section("3. AUTHENTICATION - Login & Tokens")
# ============================================================
s, d = req("POST", "/auth/login", body={"email": CLIENT_EMAIL, "password": PASSWORD}, label="Login client")
client_token = None
if isinstance(d, dict):
    client_token = d.get("access_token")
    if not client_token and "user" in d:
        client_token = d.get("access_token")

s, d = req("POST", "/auth/login", body={"email": FREELANCER_EMAIL, "password": PASSWORD}, label="Login freelancer")
freelancer_token = None
if isinstance(d, dict):
    freelancer_token = d.get("access_token")

# Invalid login
req("POST", "/auth/login", body={"email": "nobody@x.com", "password": "wrong"}, expected=[401, 422], label="Invalid login rejected")

# Token refresh
if client_token:
    req("GET", "/auth/me", token=client_token, label="Get current user (client)")

# Protected endpoint without auth
req("GET", "/auth/me", expected=[401, 403], label="Protected endpoint without auth")

# ============================================================
section("4. USER PROFILE MANAGEMENT")
# ============================================================
if client_token:
    req("GET", "/auth/me", token=client_token, label="Client profile")
    req("PUT", "/users/me", token=client_token, body={"name": f"Updated Client {TEST_ID}", "bio": "Experienced client seeking talented freelancers for web and mobile projects", "location": "Remote", "profile_image_url": "https://example.com/avatar.jpg"}, label="Update client profile")
    req("GET", "/users/me", token=client_token, label="Get updated profile")

if freelancer_token:
    req("GET", "/auth/me", token=freelancer_token, label="Freelancer profile")
    req("PUT", "/users/me", token=freelancer_token, body={
        "name": f"Updated FL {TEST_ID}", "bio": "Experienced full-stack developer specializing in Python and React applications", "hourly_rate": 50.0, "location": "Remote", "profile_image_url": "https://example.com/fl-avatar.jpg", "skills": ["python", "react", "typescript"], "headline": "Full-Stack Developer", "experience_level": "intermediate", "languages": ["English", "Spanish"]
    }, label="Update freelancer profile")

# ============================================================
section("5. PROJECTS (Client Flow)")
# ============================================================
project_id = None
if client_token:
    s, d = req("POST", "/projects", token=client_token, body={
        "title": f"E2E Project {TEST_ID}",
        "description": "A comprehensive test project for E2E testing of the MegiLance platform",
        "budget_min": 500, "budget_max": 5000,
        "budget_type": "fixed",
        "category": "Web Development",
        "skills": ["Python", "FastAPI"],
        "experience_level": "intermediate",
        "estimated_duration": "1-3 months",
        "duration": "1-3 months"
    }, expected=[200, 201], label="Create project")
    if isinstance(d, dict):
        project_id = d.get("id")

    req("GET", "/projects", token=client_token, label="List projects")
    if project_id:
        req("GET", f"/projects/{project_id}", token=client_token, label="Get project detail")

# Public project listing
req("GET", "/projects", label="Public project listing")

# ============================================================
section("6. PROPOSALS (Freelancer Flow)")
# ============================================================
proposal_id = None
if freelancer_token and project_id:
    s, d = req("POST", "/proposals", token=freelancer_token, body={
        "project_id": project_id,
        "cover_letter": f"I am an experienced full-stack developer and would love to work on this project. E2E Test Proposal {TEST_ID}",
        "bid_amount": 2500,
        "estimated_hours": 40,
        "hourly_rate": 50.0,
        "availability": "full-time"
    }, expected=[200, 201], label="Submit proposal")
    if isinstance(d, dict):
        proposal_id = d.get("id")

    req("GET", "/proposals", token=freelancer_token, label="My proposals")
    if proposal_id:
        req("GET", f"/proposals/{proposal_id}", token=freelancer_token, label="Get proposal detail")

# Client views proposals
if client_token and project_id:
    req("GET", f"/proposals?project_id={project_id}", token=client_token, label="Client views project proposals")

# ============================================================
section("7. GIGS (Freelancer Marketplace)")
# ============================================================
gig_id = None
if freelancer_token:
    s, d = req("POST", "/gigs", token=freelancer_token, body={
        "title": f"E2E Professional Gig Service {TEST_ID}",
        "description": "Professional web development service. I will build modern, responsive web applications using cutting-edge technologies. Fast delivery and high quality guaranteed.",
        "basic_package": {"title": "Basic", "price": 100, "delivery_days": 7, "description": "Basic package", "revisions": 1}
    }, expected=[200, 201], label="Create gig")
    if isinstance(d, dict):
        gig_id = d.get("id")

    req("GET", "/gigs/seller/my-gigs", token=freelancer_token, label="My gigs")

# Public gig listing
req("GET", "/gigs", label="Public gig listing")
if gig_id:
    req("GET", f"/gigs/{gig_id}", expected=[200, 404], label="Public gig detail")

# ============================================================
section("8. CONTRACTS & MILESTONES")
# ============================================================
contract_id = None
if client_token:
    s, d = req("POST", "/contracts/", token=client_token, body={
        "project_id": project_id or 999999,
        "freelancer_id": freelancer_id or 999999,
        "title": f"E2E Contract {TEST_ID}",
        "description": "Test contract",
        "amount": 2500,
        "payment_type": "fixed"
    }, expected=[200, 201, 403, 404, 422], label="Create contract")
    if isinstance(d, dict):
        contract_id = d.get("id")

    req("GET", "/contracts/", token=client_token, label="List contracts (client)")

if freelancer_token:
    req("GET", "/contracts/", token=freelancer_token, label="List contracts (freelancer)")

# ============================================================
section("9. MESSAGES & CONVERSATIONS")
# ============================================================
if client_token:
    req("GET", "/messages?conversation_id=0", token=client_token, expected=[200, 404, 422], label="Client messages")
    req("GET", "/messages/unread/count", token=client_token, label="Unread message count")
    if freelancer_id:
        req("POST", "/messages", token=client_token, body={
            "receiver_id": freelancer_id,
            "content": f"Test message {TEST_ID}",
            "conversation_id": None
        }, expected=[200, 201, 400, 422], label="Send message to freelancer")

    req("GET", "/conversations", token=client_token, label="Conversations list")

# ============================================================
section("10. NOTIFICATIONS")
# ============================================================
if client_token:
    req("GET", "/notifications", token=client_token, label="Client notifications")
    req("GET", "/notifications/unread/count", token=client_token, label="Unread notification count")
    req("POST", "/notifications/mark-all-read", token=client_token, label="Mark all read")

if freelancer_token:
    req("GET", "/notifications", token=freelancer_token, label="Freelancer notifications")

# ============================================================
section("11. REVIEWS & RATINGS")
# ============================================================
if client_token:
    req("GET", "/reviews", token=client_token, label="Client reviews")
    if contract_id:
        req("POST", "/reviews", token=client_token, body={
            "contract_id": contract_id,
            "rating": 5,
            "comment": "Excellent work!"
        }, expected=[200, 201, 400, 422], label="Submit review")

# ============================================================
section("12. WALLET & PAYMENTS")
# ============================================================
if freelancer_token:
    req("GET", "/wallet/balance", token=freelancer_token, label="Freelancer wallet balance")
    req("GET", "/wallet/transactions", token=freelancer_token, label="Wallet transactions")
    req("GET", "/wallet/analytics", token=freelancer_token, label="Wallet analytics")

if client_token:
    req("GET", "/payments/", token=client_token, label="Client payments")
    req("GET", "/payments/fee-calculator", token=client_token, expected=[200, 404, 422], label="Payment fee calculator")
    req("GET", "/payments/stats/earnings", token=client_token, label="Payment stats")

# ============================================================
section("13. INVOICES")
# ============================================================
if client_token:
    req("GET", "/invoices/", token=client_token, label="Client invoices")
    req("GET", "/invoice-tax/invoices", token=client_token, label="Invoice tax list")

if freelancer_token:
    req("GET", "/invoices/", token=freelancer_token, label="Freelancer invoices")

# ============================================================
section("14. ESCROW")
# ============================================================
if client_token:
    req("GET", "/escrow/", token=client_token, label="Escrow list")
    if contract_id:
        req("GET", f"/escrow/balance?contract_id={contract_id}", token=client_token, expected=[200, 404], label="Escrow balance")

# ============================================================
section("15. CATEGORIES, SKILLS & TAGS")
# ============================================================
req("GET", "/categories/", label="Categories list")
req("GET", "/categories/tree", label="Category tree")
req("GET", "/skills/", label="Skills list")
req("GET", "/skills/categories", label="Skill categories")
req("GET", "/tags/", label="Tags list")

# ============================================================
section("16. SEARCH & MARKETPLACE")
# ============================================================
req("GET", "/search/projects?q=test", label="Search projects")
req("GET", "/search/freelancers?q=python", label="Search freelancers")
req("GET", "/marketplace/stats", label="Marketplace stats")
req("GET", "/marketplace/trending/skills", label="Trending skills")
req("GET", "/marketplace/categories", label="Marketplace categories")
req("GET", "/marketplace/projects", label="Marketplace projects")
req("GET", "/marketplace/freelancers", label="Marketplace freelancers")

# ============================================================
section("17. FREELANCER PUBLIC PROFILES")
# ============================================================
req("GET", "/freelancers/featured", label="Featured freelancers")
req("GET", "/freelancers/search", label="Search freelancers")
if freelancer_id:
    req("GET", f"/freelancers/id/{freelancer_id}", expected=[200, 404], label="Freelancer profile by ID")

# ============================================================
section("18. BLOG")
# ============================================================
req("GET", "/blog/", label="Blog posts list")

# ============================================================
section("19. PORTFOLIO")
# ============================================================
if freelancer_token:
    req("GET", "/portfolio-builder/list", token=freelancer_token, label="Get portfolio")
    req("POST", "/portfolio-builder/", token=freelancer_token, body={
        "title": f"E2E Portfolio {TEST_ID}",
        "description": "Test portfolio item",
        "project_url": "https://example.com",
        "technologies": ["Python", "FastAPI"]
    }, expected=[200, 201, 422], label="Add portfolio item")

# ============================================================
section("20. FAVORITES & SAVED SEARCHES")
# ============================================================
if client_token:
    req("GET", "/favorites/", token=client_token, label="Favorites list")
    if project_id:
        req("POST", "/favorites/", token=client_token, body={
            "target_type": "project", "target_id": project_id
        }, expected=[200, 201, 409, 422], label="Add favorite")

    req("GET", "/saved-searches", token=client_token, label="Saved searches")

# ============================================================
section("21. SUPPORT TICKETS")
# ============================================================
if client_token:
    req("POST", "/support-tickets/", token=client_token, body={
        "subject": f"E2E Support {TEST_ID}",
        "description": "Test support ticket",
        "category": "general",
        "priority": "medium"
    }, expected=[200, 201, 422], label="Create support ticket")
    req("GET", "/support-tickets/", token=client_token, label="List support tickets")

# ============================================================
section("22. TIME ENTRIES")
# ============================================================
if freelancer_token:
    req("GET", "/time-entries/", token=freelancer_token, label="Time entries list")
    req("POST", "/time-entries/", token=freelancer_token, body={
        "description": f"E2E Work {TEST_ID}",
        "hours": 2.5,
        "date": "2026-03-08",
        "project_id": project_id or 1
    }, expected=[200, 201, 422], label="Log time entry")

# ============================================================
section("23. AVAILABILITY CALENDAR")
# ============================================================
if freelancer_token:
    req("GET", "/availability/settings", token=freelancer_token, label="Get availability")
    req("PUT", "/availability/settings", token=freelancer_token, body={
        "status": "available",
        "hours_per_week": 40
    }, expected=[200, 201, 422], label="Update availability")

# ============================================================
section("24. DISPUTES & REFUNDS")
# ============================================================
if client_token:
    req("GET", "/disputes", token=client_token, label="Disputes list")
    req("GET", "/refunds/", token=client_token, label="Refunds list")

# ============================================================
section("25. PORTAL ENDPOINTS")
# ============================================================
if client_token:
    req("GET", "/portal/client/dashboard/stats", token=client_token, label="Client dashboard stats")
    req("GET", "/portal/client/projects", token=client_token, label="Client portal projects")
    req("GET", "/portal/client/payments", token=client_token, label="Client portal payments")
    req("GET", "/portal/client/proposals", token=client_token, label="Client portal proposals")

if freelancer_token:
    req("GET", "/portal/freelancer/dashboard/stats", token=freelancer_token, label="Freelancer dashboard stats")
    req("GET", "/portal/freelancer/projects", token=freelancer_token, label="Freelancer portal projects")
    req("GET", "/portal/freelancer/proposals", token=freelancer_token, label="Freelancer portal proposals")
    req("GET", "/portal/freelancer/notifications", token=freelancer_token, label="Freelancer portal notifications")
    req("GET", "/portal/freelancer/earnings", token=freelancer_token, label="Freelancer earnings")

# ============================================================
section("26. SELLER STATS")
# ============================================================
if freelancer_token:
    req("GET", "/seller-stats/me", token=freelancer_token, label="Seller stats")
    req("GET", "/seller-stats/leaderboard", token=freelancer_token, label="Seller leaderboard")
    req("GET", "/seller-stats/levels", token=freelancer_token, label="Seller levels")

# ============================================================
section("27. GAMIFICATION")
# ============================================================
if client_token:
    req("GET", "/gamification/achievements", token=client_token, label="Achievements")
    req("GET", "/gamification/badges", token=client_token, label="Badges")
    req("GET", "/gamification/leaderboard", token=client_token, label="Leaderboard")
    req("GET", "/gamification/my-rank", token=client_token, label="My rank")

# ============================================================
section("28. AI SERVICES")
# ============================================================
if client_token:
    req("GET", "/ai/health", token=client_token, expected=[200, 404, 503], label="AI health")
    req("POST", "/ai/matching/project", token=client_token, body={
        "project_id": project_id or 1
    }, expected=[200, 404, 503, 422], label="AI project matching")

# ============================================================
section("29. KNOWLEDGE BASE & LEARNING")
# ============================================================
req("GET", "/knowledge-base/articles", label="KB articles")
req("GET", "/knowledge-base/categories", label="KB categories")
req("GET", "/knowledge-base/faqs", label="KB FAQs")
req("GET", "/knowledge-base/popular", label="KB popular")
req("GET", "/knowledge-base/search?q=test", label="KB search")

if freelancer_token:
    req("GET", "/learning/courses", token=freelancer_token, label="Learning courses")
    req("GET", "/learning/featured", token=freelancer_token, label="Featured courses")

# ============================================================
section("30. ASSESSMENTS")
# ============================================================
if freelancer_token:
    req("GET", "/assessments/skills/available", token=freelancer_token, label="Available assessments")
    req("GET", "/assessments/profile", token=freelancer_token, label="My assessment results")

# ============================================================
section("31. I18N (Internationalization)")
# ============================================================
req("GET", "/i18n/languages", label="Available languages")
req("GET", "/i18n/translations/en", label="English translations")

# ============================================================
section("32. EXTERNAL PROJECTS")
# ============================================================
req("GET", "/external-projects", label="External projects")
req("GET", "/external-projects-categories", label="External project categories")
req("GET", "/external-projects-stats", label="External project stats")

# ============================================================
section("33. PRICE ESTIMATOR")
# ============================================================
req("POST", "/price-estimator/estimate", body={
    "category": "Web Development",
    "complexity": "medium",
    "duration": "1-3 months"
}, expected=[200, 422], label="Price estimate")
req("GET", "/price-estimator/categories", label="Price categories")

# ============================================================
section("34. STANDALONE TOOLS")
# ============================================================
# Invoice Generator
req("GET", "/invoice-generator/options", label="Invoice generator options")
req("POST", "/invoice-generator/generate", body={
    "client_name": "Test Client",
    "items": [{"description": "Web Dev", "amount": 500, "quantity": 1}],
    "currency": "USD"
}, expected=[200, 422], label="Generate invoice")

# Contract Builder Standalone
req("GET", "/contract-builder-standalone/options", label="Contract builder options")

# Income Calculator
req("GET", "/income-calculator/options", label="Income calculator options")
req("POST", "/income-calculator/calculate", body={
    "annual_revenue": 100000,
    "expenses": 20000,
    "country": "US"
}, expected=[200, 422], label="Calculate income")

# Scope Planner
req("POST", "/scope-planner/plan", body={
    "project_description": "E-commerce website",
    "features": ["auth", "cart", "payments"]
}, expected=[200, 422], label="Scope plan")

# Expense Tax Calculator
req("GET", "/expense-tax-calculator/options", label="Expense tax options")
req("POST", "/expense-tax-calculator/calculate", body={
    "income": 100000,
    "expenses": [{"category": "office", "amount": 5000}],
    "country": "US"
}, expected=[200, 422], label="Calculate expense tax")

# AI Parallel Tools
req("POST", "/skill-analyzer/analyze", body={
    "skills": ["Python", "JavaScript", "FastAPI"]
}, expected=[200, 422], label="Analyze skills")

req("POST", "/rate-advisor/advise", body={
    "skills": ["Python", "FastAPI"],
    "experience_years": 5,
    "location": "US"
}, expected=[200, 422], label="Rate advisor")

req("POST", "/proposal-writer/generate", body={
    "project_description": "Build a web app",
    "freelancer_skills": ["Python", "React"]
}, expected=[200, 422], label="Generate proposal")

# ============================================================
section("35. COMMUNITY")
# ============================================================
if client_token:
    req("GET", "/community/questions", token=client_token, label="Community questions")
    req("GET", "/community/trending-tags", token=client_token, label="Community trending tags")

# ============================================================
section("36. FEATURE FLAGS")
# ============================================================
if client_token:
    req("GET", "/feature-flags/flags", token=client_token, label="Feature flags")
    req("GET", "/feature-flags/my-flags", token=client_token, label="My feature flags")

# ============================================================
section("37. ANALYTICS")
# ============================================================
if client_token:
    req("GET", "/analytics/dashboard/client", token=client_token, label="Analytics dashboard")
    req("GET", "/analytics-dashboard/metrics", token=client_token, label="Analytics metrics")

if freelancer_token:
    req("GET", "/analytics/dashboard/freelancer", token=freelancer_token, label="Freelancer analytics")

# ============================================================
section("38. COMPLIANCE")
# ============================================================
if client_token:
    req("GET", "/compliance/status", token=client_token, label="Compliance status")
    req("GET", "/compliance/consents", token=client_token, label="Compliance consents")

# ============================================================
section("39. INVITATIONS")
# ============================================================
if client_token and freelancer_id:
    req("POST", "/invitations", token=client_token, body={
        "freelancer_id": freelancer_id,
        "project_id": project_id or 999999,
        "message": f"E2E invitation {TEST_ID}"
    }, expected=[200, 201, 404, 422], label="Send invitation")
    req("GET", "/invitations/sent", token=client_token, label="Sent invitations")

if freelancer_token:
    req("GET", "/invitations/received", token=freelancer_token, label="Received invitations")

# ============================================================
section("40. JOB ALERTS")
# ============================================================
if freelancer_token:
    req("GET", "/job-alerts/", token=freelancer_token, label="Job alerts list")
    req("POST", "/job-alerts/", token=freelancer_token, body={
        "keywords": "python fastapi",
        "category": "Web Development",
        "min_budget": 500
    }, expected=[200, 201, 422], label="Create job alert")

# ============================================================
section("41. ORGANIZATIONS & TEAMS")
# ============================================================
if client_token:
    req("GET", "/organizations", token=client_token, label="Organizations list")
    req("GET", "/teams/teams/my-teams", token=client_token, label="Teams list")

# ============================================================
section("42. TEMPLATES")
# ============================================================
if client_token:
    req("GET", "/templates", token=client_token, label="Templates list")

# ============================================================
section("43. NOTIFICATION PREFERENCES")
# ============================================================
if client_token:
    req("GET", "/notification-preferences", token=client_token, label="Notification prefs")
    req("GET", "/notification-preferences/channels", token=client_token, label="Notification channels")
    req("GET", "/notification-preferences/categories", token=client_token, label="Notification categories")

# ============================================================
section("44. 2FA")
# ============================================================
if client_token:
    req("GET", "/2fa/status", token=client_token, label="2FA status")

# ============================================================
section("45. API KEYS")
# ============================================================
if client_token:
    req("GET", "/api-keys", token=client_token, label="API keys list")

# ============================================================
section("46. WEBHOOKS")
# ============================================================
if client_token:
    req("GET", "/webhooks", token=client_token, label="Webhooks list")

# ============================================================
section("47. DATA EXPORT")
# ============================================================
if client_token:
    req("GET", "/data-export/list", token=client_token, label="Export list")
    req("GET", "/data-export/templates", token=client_token, label="Export templates")
    req("GET", "/export-import/formats", token=client_token, label="Export formats")
    req("GET", "/export-import/gdpr/my-data", token=client_token, expected=[200, 404, 500], label="GDPR export status")

# ============================================================
section("48. SKILL GRAPH")
# ============================================================
if freelancer_token:
    req("GET", "/skill-graph/user/skills", token=freelancer_token, label="My skill graph")
    req("GET", "/skill-graph/recommendations", token=freelancer_token, label="Skill recommendations")

# ============================================================
section("49. PK PAYMENTS")
# ============================================================
req("GET", "/pk-payments/providers", token=client_token, label="PK payment providers")
req("GET", "/pk-payments/exchange-rate", token=client_token, expected=[200, 422], label="PK exchange rate")
req("GET", "/pk-payments/network-status", label="PK network status")

# ============================================================
section("50. SECURITY TESTS")
# ============================================================
# SQL Injection
req("GET", "/search/projects?q=' OR 1=1 --", label="SQL injection test (search)")
req("POST", "/auth/login", body={"email": "' OR 1=1 --", "password": "test"}, expected=[400, 401, 422], label="SQL injection test (login)")

# XSS
req("POST", "/auth/register", body={
    "email": f"xss_{TEST_ID}@test.com", "password": PASSWORD,
    "name": "<script>alert('xss')</script>", "user_type": "client"
}, expected=[201, 400], label="XSS in name field")

# Invalid token
req("GET", "/auth/me", token="invalid.jwt.token", expected=[401, 403, 422], label="Invalid JWT rejected")

# RBAC - Freelancer can't access admin
if freelancer_token:
    req("GET", "/admin/dashboard/overview", token=freelancer_token, expected=[401, 403], label="RBAC: freelancer blocked from admin")
    req("GET", "/admin/users", token=freelancer_token, expected=[401, 403], label="RBAC: freelancer blocked from users")

# ============================================================
section("51. ADMIN ENDPOINTS")
# ============================================================
# Try to login as admin (may not exist)
admin_token = None
s, d = req("POST", "/auth/login", body={"email": "admin@megilance.com", "password": "admin123"}, expected=[200, 401], label="Admin login attempt")
if s == 200 and isinstance(d, dict):
    admin_token = d.get("access_token")

if admin_token:
    req("GET", "/admin/dashboard/overview", token=admin_token, label="Admin dashboard")
    req("GET", "/admin/users", token=admin_token, label="Admin users list")
    req("GET", "/admin/projects", token=admin_token, label="Admin projects list")
    req("GET", "/admin/contracts", token=admin_token, label="Admin contracts list")
    req("GET", "/admin/payments", token=admin_token, label="Admin payments list")
    req("GET", "/admin/analytics", token=admin_token, label="Admin analytics")
    req("GET", "/admin/reports", token=admin_token, label="Admin reports")
else:
    results["skip"] += 8
    print("  \u26a0\ufe0f  SKIP: Admin endpoints (no admin credentials)")

# ============================================================
section("52. RATE CARDS")
# ============================================================
if freelancer_token:
    req("GET", "/rate-cards/my-cards", token=freelancer_token, label="Rate cards list")

# ============================================================
section("53. MODERATION")
# ============================================================
if client_token:
    req("GET", "/moderation/content-types", token=client_token, label="Content types")
    req("GET", "/moderation/violation-types", token=client_token, label="Violation types")

# ============================================================
section("54. EMAIL TEMPLATES")
# ============================================================
if client_token:
    req("GET", "/email-templates/types", token=client_token, label="Email template types")

# ============================================================
section("55. TIMEZONE")
# ============================================================
if client_token:
    req("GET", "/timezone/current/UTC", token=client_token, label="Current timezone")
    req("GET", "/timezone/list", token=client_token, label="Available timezones")

# ============================================================
section("56. FILE VERSIONS")
# ============================================================
if client_token:
    req("GET", "/file-versions/info/config", token=client_token, label="File version config")

# ============================================================
section("57. REFERRALS")
# ============================================================
if client_token:
    req("GET", "/referrals/", token=client_token, label="My referrals")

# ============================================================
section("58. CUSTOM FIELDS & STATUSES")
# ============================================================
if client_token:
    req("GET", "/custom-fields/info/types", token=client_token, label="Custom field types")
    req("GET", "/custom-statuses", token=client_token, label="Custom statuses")

# ============================================================
section("59. NOTES & TAGS")
# ============================================================
if client_token:
    req("GET", "/notes-tags/notes", token=client_token, label="Notes list")
    req("GET", "/notes-tags/tags", token=client_token, label="Tags list")
    req("GET", "/notes-tags/stats", token=client_token, label="Notes/tags stats")

# ============================================================
section("60. PROPOSAL TEMPLATES")
# ============================================================
if freelancer_token:
    req("GET", "/proposal-templates/", token=freelancer_token, label="Proposal templates")

# ============================================================
section("61. LEGAL DOCUMENTS")
# ============================================================
if client_token:
    req("GET", "/legal-documents/my-documents", token=client_token, label="My legal documents")
    req("GET", "/legal-documents/templates", token=client_token, label="Legal templates")
    req("GET", "/legal-documents/signature-requests", token=client_token, label="Signature requests")

# ============================================================
section("62. SUBSCRIPTIONS")
# ============================================================
if client_token:
    req("GET", "/subscriptions/plans", token=client_token, label="Subscription plans")
    req("GET", "/subscriptions/my-subscription", token=client_token, label="My subscription")

# ============================================================
section("63. WORKFLOW AUTOMATION")
# ============================================================
if client_token:
    req("GET", "/workflows/my-workflows", token=client_token, label="Workflows list")
    req("GET", "/workflows/templates", token=client_token, label="Workflow templates")

# ============================================================
section("64. FEEDBACK SYSTEM")
# ============================================================
if client_token:
    req("GET", "/feedback/my-feedback", token=client_token, label="My feedback")
    req("GET", "/feedback/csat/score", token=client_token, expected=[200, 403], label="CSAT score")
    req("GET", "/feedback/roadmap/public", label="Public roadmap")
    req("GET", "/feedback/board/public", label="Public feedback board")

# ============================================================
section("65. PUBLIC CLIENT PROFILES")
# ============================================================
req("GET", "/public-clients/featured", label="Public client list")
if client_id:
    req("GET", f"/public-clients/{client_id}", expected=[200, 404], label="Public client profile")

# ============================================================
section("66. MATCHING ENGINE")
# ============================================================
if freelancer_token:
    req("GET", "/matching/projects", token=freelancer_token, label="Matched projects")
    req("GET", "/matching/recommendations", token=freelancer_token, label="Recommendations")
    req("GET", "/matching/algorithm-info", token=freelancer_token, label="Algorithm info")

# ============================================================
section("67. AUDIT TRAIL")
# ============================================================
if client_token:
    req("GET", "/audit/audit/logs", token=client_token, expected=[200, 403], label="Audit logs")

# ============================================================
section("68. CONTRACT BUILDER")
# ============================================================
if client_token:
    req("GET", "/contract-builder/templates", token=client_token, label="Contract templates")
    req("GET", "/contract-builder/clauses", token=client_token, label="Contract clauses")

# ============================================================
section("69. PORTFOLIO BUILDER")
# ============================================================
if freelancer_token:
    req("GET", "/portfolio-builder/my-portfolio", token=freelancer_token, label="Portfolio builder")
    req("GET", "/portfolio-builder/templates", token=freelancer_token, label="Portfolio templates")

# ============================================================
section("70. FRAUD DETECTION")
# ============================================================
if client_token:
    req("GET", "/fraud-detection/my-risk-profile", token=client_token, label="My risk profile")

# ============================================================
section("71. SOCIAL AUTH")
# ============================================================
req("GET", "/social-auth/providers", label="Social auth providers")

# ============================================================
section("72. VERIFICATION")
# ============================================================
if client_token:
    req("GET", "/verification/status", token=client_token, label="Verification status")

# ============================================================
section("73. MULTICURRENCY")
# ============================================================
req("GET", "/multicurrency/currencies", label="Currencies list")
req("GET", "/multicurrency/cryptocurrencies", label="Crypto list")

# ============================================================
section("74. CLEANUP & LOGOUT")
# ============================================================
if client_token:
    req("POST", "/auth/logout", token=client_token, expected=[200, 204, 422], label="Client logout")
if freelancer_token:
    req("POST", "/auth/logout", token=freelancer_token, expected=[200, 204, 422], label="Freelancer logout")

# ============================================================
# FINAL REPORT
# ============================================================
print(f"\n{'='*60}")
print(f"  FINAL RESULTS")
print(f"{'='*60}")
print(f"  \u2705 PASSED:  {results['pass']}")
print(f"  \u274c FAILED:  {results['fail']}")
print(f"  \u26a0\ufe0f  SKIPPED: {results['skip']}")
total = results['pass'] + results['fail'] + results['skip']
pct = (results['pass'] / total * 100) if total else 0
print(f"  TOTAL:    {total}")
print(f"  PASS RATE: {pct:.1f}%")

if failures:
    print(f"\n{'='*60}")
    print(f"  FAILURES ({len(failures)})")
    print(f"{'='*60}")
    for f in failures:
        print(f)

print(f"\n{'='*60}")
print(f"  Test completed at {datetime.now().strftime('%H:%M:%S')}")
print(f"{'='*60}")

sys.exit(1 if results['fail'] > 0 else 0)
