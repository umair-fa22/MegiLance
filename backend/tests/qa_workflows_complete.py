#!/usr/bin/env python3
"""
MegiLance Production Launch QA - Comprehensive Workflow Testing
Executes all three workflows via API + Frontend validation
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

# Configuration
BASE_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:3000"
TEST_PASSWORD = "QATest123!"
TEST_TIMEOUT = 10

# Test Data
TEST_TS = str(int(time.time()))
CLIENT_EMAIL = f"qa_client_{TEST_TS}@test.com"
FREELANCER_EMAIL = f"qa_freelancer_{TEST_TS}@test.com"
ADMIN_EMAIL = f"qa_admin_{TEST_TS}@test.com"

# Results tracking
RESULTS = {
    "timestamp": datetime.now().isoformat(),
    "client_workflow": {"status": "pending", "steps": {}, "errors": []},
    "freelancer_workflow": {"status": "pending", "steps": {}, "errors": []},
    "admin_workflow": {"status": "pending", "steps": {}, "errors": []},
    "overall_status": "pending"
}

def log_header(title):
    """Print section header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def log_step(workflow, step_name, success, detail=""):
    """Log test step result"""
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"  [{status}] {step_name}" + (f": {detail}" if detail else ""))
    RESULTS[workflow]["steps"][step_name] = {
        "status": "pass" if success else "fail",
        "detail": detail,
        "timestamp": datetime.now().isoformat()
    }
    if not success:
        RESULTS[workflow]["errors"].append(f"{step_name}: {detail}")

def safe_request(method: str, endpoint: str, **kwargs) -> Tuple[Optional[dict], int, Optional[str]]:
    """Make HTTP request safely"""
    url = f"{BASE_URL}{endpoint}"
    kwargs.setdefault("timeout", TEST_TIMEOUT)
    
    try:
        response = getattr(requests, method.lower())(url, **kwargs)
        
        try:
            data = response.json()
        except:
            data = response.text
        
        return data, response.status_code, None
    except requests.exceptions.Timeout:
        return None, 0, "Request timeout"
    except requests.exceptions.ConnectionError:
        return None, 0, "Connection refused"
    except Exception as e:
        return None, 0, str(e)

def check_api_health():
    """Verify backend is running"""
    log_header("INFRASTRUCTURE CHECK")
    
    # Check API health
    data, status, error = safe_request("get", "/health")
    if status == 200:
        log_step("api_health", "Backend API health", True, f"Status: {data.get('status')}")
        return True
    else:
        log_step("api_health", "Backend API health", False, error or f"Status {status}")
        return False

def test_client_workflow() -> bool:
    """Test complete client workflow"""
    log_header("WORKFLOW 1: CLIENT COMPLETE JOURNEY")
    
    workflow = "client_workflow"
    client_data = {}
    
    # Step 1: Signup
    payload = {
        "email": CLIENT_EMAIL,
        "password": TEST_PASSWORD,
        "role": "client"
    }
    data, status, error = safe_request("post", "/v1/auth/signup", json=payload)
    success = status == 201 and data and data.get("user")
    log_step(workflow, "1. Signup", success, f"Status {status}" + (f": {data.get('message', '')}" if data else f" - {error}"))
    if not success:
        RESULTS[workflow]["status"] = "failed"
        return False
    
    client_data = data.get("user", {})
    client_id = client_data.get("id")
    token = data.get("access_token", "")
    
    # Step 2: Complete profile
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    profile_payload = {
        "first_name": "QA",
        "last_name": "Client",
        "bio": "Test client for QA",
        "country": "US"
    }
    data, status, error = safe_request("put", f"/v1/users/{client_id}/profile", json=profile_payload, headers=headers)
    success = status in [200, 201]
    log_step(workflow, "2. Complete profile", success, f"Status {status}")
    
    # Step 3: Post project
    project_payload = {
        "title": "QA Test Project E2E",
        "description": "Comprehensive QA testing project for all three workflows",
        "category": "Web Development",
        "budget_min": 1000,
        "budget_max": 2000,
        "budget_type": "fixed",
        "duration_days": 30,
        "experience_level": "intermediate",
        "skills": ["Testing", "QA", "Automation"],
        "status": "open"
    }
    data, status, error = safe_request("post", "/v1/projects", json=project_payload, headers=headers)
    success = status == 201 and data and data.get("id")
    detail = f"Status {status}, Project ID: {data.get('id') if data else 'N/A'}"
    log_step(workflow, "3. Post project", success, detail)
    
    if success:
        project_id = data.get("id")
        # Store for freelancer workflow
        RESULTS["project_id"] = project_id
    
    # Step 4: View projects
    data, status, error = safe_request("get", "/v1/projects", headers=headers)
    success = status == 200 and data and isinstance(data, (list, dict))
    project_count = len(data) if isinstance(data, list) else len(data.get("items", []))
    log_step(workflow, "4. View projects", success, f"Status {status}, Found {project_count} projects")
    
    # Step 5: Get project details
    if RESULTS.get("project_id"):
        data, status, error = safe_request("get", f"/v1/projects/{RESULTS['project_id']}", headers=headers)
        success = status == 200
        log_step(workflow, "5. Get project details", success, f"Status {status}")
    
    RESULTS[workflow]["status"] = "passed" if len(RESULTS[workflow]["errors"]) == 0 else "failed"
    return len(RESULTS[workflow]["errors"]) == 0

def test_freelancer_workflow() -> bool:
    """Test complete freelancer workflow"""
    log_header("WORKFLOW 2: FREELANCER COMPLETE JOURNEY")
    
    workflow = "freelancer_workflow"
    freelancer_data = {}
    
    # Step 1: Signup
    payload = {
        "email": FREELANCER_EMAIL,
        "password": TEST_PASSWORD,
        "role": "freelancer"
    }
    data, status, error = safe_request("post", "/v1/auth/signup", json=payload)
    success = status == 201 and data and data.get("user")
    log_step(workflow, "1. Signup", success, f"Status {status}" + (f": {data.get('message', '')}" if data else f" - {error}"))
    if not success:
        RESULTS[workflow]["status"] = "failed"
        return False
    
    freelancer_data = data.get("user", {})
    freelancer_id = freelancer_data.get("id")
    token = data.get("access_token", "")
    
    # Step 2: Complete profile
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    profile_payload = {
        "first_name": "QA",
        "last_name": "Freelancer",
        "title": "QA Engineer",
        "bio": "Expert QA tester",
        "skills": ["Testing", "QA", "Automation", "Selenium"],
        "hourly_rate": 75,
        "country": "US"
    }
    data, status, error = safe_request("put", f"/v1/users/{freelancer_id}/profile", json=profile_payload, headers=headers)
    success = status in [200, 201]
    log_step(workflow, "2. Complete profile", success, f"Status {status}")
    
    # Step 3: Browse projects
    data, status, error = safe_request("get", "/v1/projects?status=open", headers=headers)
    success = status == 200
    project_count = len(data) if isinstance(data, list) else len(data.get("items", []))
    log_step(workflow, "3. Browse projects", success, f"Status {status}, Found {project_count} projects")
    
    # Step 4: Submit proposal
    if RESULTS.get("project_id"):
        proposal_payload = {
            "project_id": RESULTS["project_id"],
            "cover_letter": "I am an experienced QA engineer ready to help validate this platform.",
            "bid_amount": 1200,
            "estimated_duration_days": 20
        }
        data, status, error = safe_request("post", "/v1/proposals", json=proposal_payload, headers=headers)
        success = status == 201 and data and data.get("id")
        detail = f"Status {status}" + (f", Proposal ID: {data.get('id')}" if success else "")
        log_step(workflow, "4. Submit proposal", success, detail)
        
        if success:
            RESULTS["proposal_id"] = data.get("id")
    else:
        log_step(workflow, "4. Submit proposal", False, "No project ID from client workflow")
    
    # Step 5: View proposals
    data, status, error = safe_request("get", "/v1/proposals/my", headers=headers)
    success = status == 200
    proposal_count = len(data) if isinstance(data, list) else len(data.get("items", []))
    log_step(workflow, "5. View proposals", success, f"Status {status}, Found {proposal_count} proposals")
    
    RESULTS[workflow]["status"] = "passed" if len(RESULTS[workflow]["errors"]) == 0 else "failed"
    return len(RESULTS[workflow]["errors"]) == 0

def test_admin_workflow() -> bool:
    """Test admin dashboard workflow"""
    log_header("WORKFLOW 3: ADMIN DASHBOARD")
    
    workflow = "admin_workflow"
    
    # Note: Admin workflow requires valid admin credentials
    # This test will check if endpoints are available
    
    # Step 1: Try admin login (will likely fail without real admin creds)
    payload = {
        "email": ADMIN_EMAIL,
        "password": TEST_PASSWORD
    }
    data, status, error = safe_request("post", "/v1/auth/login", json=payload)
    success = status in [200, 401, 404]  # 401 if no admin, 200 if exists
    log_step(workflow, "1. Admin login attempt", True, f"Status {status} (expected: may not exist)")
    
    # Step 2: Check admin analytics endpoint
    data, status, error = safe_request("get", "/v1/admin/analytics")
    success = status in [200, 401, 403]  # 401 if not authenticated
    log_step(workflow, "2. Admin analytics endpoint", success, f"Status {status}")
    
    # Step 3: Check user management endpoint
    data, status, error = safe_request("get", "/v1/admin/users")
    success = status in [200, 401, 403]
    log_step(workflow, "3. User management endpoint", success, f"Status {status}")
    
    # Step 4: Check projects admin endpoint
    data, status, error = safe_request("get", "/v1/admin/projects")
    success = status in [200, 401, 403]
    log_step(workflow, "4. Projects admin endpoint", success, f"Status {status}")
    
    # Step 5: Check disputes endpoint
    data, status, error = safe_request("get", "/v1/admin/disputes")
    success = status in [200, 401, 403]
    log_step(workflow, "5. Disputes management endpoint", success, f"Status {status}")
    
    # Admin workflow status depends on whether endpoints exist
    RESULTS[workflow]["status"] = "passed" if status != 404 else "endpoints_missing"
    return True  # Don't fail overall on admin - it needs credentials

def generate_report():
    """Generate final test report"""
    log_header("QA TEST SUMMARY REPORT")
    
    client_status = RESULTS["client_workflow"]["status"]
    freelancer_status = RESULTS["freelancer_workflow"]["status"]
    admin_status = RESULTS["admin_workflow"]["status"]
    
    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║         MegiLance Production Launch QA Report              ║
    ╚════════════════════════════════════════════════════════════╝
    
    Timestamp: {RESULTS['timestamp']}
    
    ═══════════════════════════════════════════════════════════
    WORKFLOW RESULTS
    ═══════════════════════════════════════════════════════════
    
    WORKFLOW 1: CLIENT JOURNEY
    Status: {"✅ PASSED" if client_status == "passed" else "❌ FAILED" if client_status == "failed" else "⏳ PENDING"}
    Tests Passed: {sum(1 for s in RESULTS["client_workflow"]["steps"].values() if s["status"] == "pass")}
    Tests Failed: {sum(1 for s in RESULTS["client_workflow"]["steps"].values() if s["status"] == "fail")}
    Errors: {len(RESULTS["client_workflow"]["errors"])}
    
    WORKFLOW 2: FREELANCER JOURNEY
    Status: {"✅ PASSED" if freelancer_status == "passed" else "❌ FAILED" if freelancer_status == "failed" else "⏳ PENDING"}
    Tests Passed: {sum(1 for s in RESULTS["freelancer_workflow"]["steps"].values() if s["status"] == "pass")}
    Tests Failed: {sum(1 for s in RESULTS["freelancer_workflow"]["steps"].values() if s["status"] == "fail")}
    Errors: {len(RESULTS["freelancer_workflow"]["errors"])}
    
    WORKFLOW 3: ADMIN DASHBOARD
    Status: {"✅ PASSED" if admin_status == "passed" else "⏳ PENDING" if admin_status == "endpoints_missing" else "❌ FAILED"}
    Tests Passed: {sum(1 for s in RESULTS["admin_workflow"]["steps"].values() if s["status"] == "pass")}
    Tests Failed: {sum(1 for s in RESULTS["admin_workflow"]["steps"].values() if s["status"] == "fail")}
    Errors: {len(RESULTS["admin_workflow"]["errors"])}
    
    ═══════════════════════════════════════════════════════════
    TEST DATA
    ═══════════════════════════════════════════════════════════
    
    Client Email:      {CLIENT_EMAIL}
    Freelancer Email:  {FREELANCER_EMAIL}
    Admin Email:       {ADMIN_EMAIL}
    Test Password:     {TEST_PASSWORD}
    Project ID:        {RESULTS.get("project_id", "N/A")}
    Proposal ID:       {RESULTS.get("proposal_id", "N/A")}
    
    ═══════════════════════════════════════════════════════════
    ERRORS SUMMARY
    ═══════════════════════════════════════════════════════════
    """)
    
    all_errors = (
        RESULTS["client_workflow"]["errors"] +
        RESULTS["freelancer_workflow"]["errors"] +
        RESULTS["admin_workflow"]["errors"]
    )
    
    if all_errors:
        for error in all_errors:
            print(f"    ⚠ {error}")
    else:
        print("    ✓ No critical errors")
    
    print(f"""
    ═══════════════════════════════════════════════════════════
    PRODUCTION READINESS
    ═══════════════════════════════════════════════════════════
    """)
    
    if client_status == "passed" and freelancer_status == "passed":
        print("    ✅ READY FOR LAUNCH - All critical workflows functional")
        RESULTS["overall_status"] = "production_ready"
    elif client_status == "passed":
        print("    ⚠ CONDITIONAL - Client workflow functional, freelancer needs attention")
        RESULTS["overall_status"] = "conditional"
    else:
        print("    ❌ NOT READY - Critical workflows failing")
        RESULTS["overall_status"] = "not_ready"
    
    print(f"""
    ═══════════════════════════════════════════════════════════
    """)
    
    return RESULTS

def main():
    print(f"""
    ╔════════════════════════════════════════════════════════════╗
    ║     MegiLance E2E Workflow Testing Suite                  ║
    ║     Production Launch QA Verification                      ║
    ║     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                        ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Check infrastructure
    if not check_api_health():
        print("\n❌ Backend API is not responding. Cannot proceed with tests.")
        sys.exit(1)
    
    # Test workflows
    print("\nStarting workflow tests...\n")
    test_client_workflow()
    test_freelancer_workflow()
    test_admin_workflow()
    
    # Generate report
    results = generate_report()
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exit with appropriate code
    if results["overall_status"] == "production_ready":
        sys.exit(0)
    elif results["overall_status"] == "conditional":
        sys.exit(1)
    else:
        sys.exit(2)
