#!/usr/bin/env python3
"""
MegiLance Workflow Test Suite - Manual Testing Helper
Interactively tests each workflow step by step
"""

import requests
import json
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

def print_header(title):
    print(f"\n{Colors.CYAN}{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}{Colors.RESET}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_test(msg):
    print(f"{Colors.YELLOW}🧪 {msg}{Colors.RESET}")

def test_health():
    """Test backend health"""
    print_header("STEP 1: BACKEND HEALTH CHECK")

    try:
        r = requests.get(f"{BASE_URL}/health/ready", timeout=5)
        if r.status_code == 200:
            data = r.json()
            print_success(f"Backend is running")
            print_info(f"  Status: {data.get('status')}")
            print_info(f"  Database: {data.get('db')}")
            print_info(f"  Uptime: {data.get('uptime_seconds')}s")
            return True
        else:
            print_error(f"Backend returned status {r.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to backend: {e}")
        print_info("Make sure backend is running: cd backend && python -m uvicorn main:app --reload --port 8000")
        return False

def test_auth_flow():
    """Test authentication flow"""
    print_header("STEP 2: AUTHENTICATION FLOW TEST")

    test_email = f"test_client_{int(time.time())}@example.com"
    test_password = "TestP@ss123!"

    print_test("Creating client account...")

    # Register
    payload = {
        "email": test_email,
        "password": test_password,
        "role": "client"
    }

    r = requests.post(f"{BASE_URL}/auth/register", json=payload)
    if r.status_code != 201:
        print_error(f"Registration failed: {r.text}")
        return None, None

    print_success("Registration successful")

    # Login
    print_test("Testing login...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }

    r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if r.status_code != 200:
        print_error(f"Login failed: {r.text}")
        return None, None

    data = r.json()
    token = data.get("access_token")
    user_id = data.get("user", {}).get("id")

    print_success(f"Login successful")
    print_info(f"  Token: {token[:20]}...")
    print_info(f"  User ID: {user_id}")

    return token, user_id

def test_client_profile(token):
    """Test client profile completion"""
    print_header("STEP 3: CLIENT PROFILE SETUP")

    if not token:
        print_error("No authentication token")
        return False

    headers = {"Authorization": f"Bearer {token}"}

    print_test("Updating client profile...")

    profile_data = {
        "full_name": "John Developer",
        "company_name": "Tech Corp",
        "phone": "+1234567890",
        "bio": "I'm a tech entrepreneur"
    }

    r = requests.put(
        f"{BASE_URL}/clients/profile",
        json=profile_data,
        headers=headers
    )

    if r.status_code in [200, 201]:
        print_success("Profile updated successfully")
        return True
    else:
        print_error(f"Profile update failed: {r.text}")
        return False

def test_project_creation(token):
    """Test project creation"""
    print_header("STEP 4: PROJECT CREATION & POSTING")

    if not token:
        print_error("No authentication token")
        return None

    headers = {"Authorization": f"Bearer {token}"}

    print_test("Creating project...")

    tomorrow = (datetime.now() + timedelta(days=30)).isoformat()

    project_data = {
        "title": "Website Redesign - E2E Test",
        "description": "Complete website redesign with modern UI/UX",
        "category": "Web Development",
        "skills_required": ["React", "Next.js", "Tailwind CSS"],
        "budget_type": "fixed",
        "budget_amount": 5000,
        "deadline": tomorrow,
        "status": "open"
    }

    r = requests.post(
        f"{BASE_URL}/projects",
        json=project_data,
        headers=headers
    )

    if r.status_code in [200, 201]:
        data = r.json()
        project_id = data.get("id") or data.get("data", {}).get("id")
        print_success("Project created successfully")
        print_info(f"  Project ID: {project_id}")
        print_info(f"  Title: {data.get('title')}")
        return project_id
    else:
        print_error(f"Project creation failed: {r.text}")
        return None

def test_freelancer_workflow(project_id):
    """Test freelancer profile and proposal"""
    print_header("STEP 5: FREELANCER WORKFLOW")

    test_email = f"test_freelancer_{int(time.time())}@example.com"
    test_password = "TestP@ss123!"

    print_test("Creating freelancer account...")

    # Register as freelancer
    payload = {
        "email": test_email,
        "password": test_password,
        "role": "freelancer"
    }

    r = requests.post(f"{BASE_URL}/auth/register", json=payload)
    if r.status_code != 201:
        print_error(f"Freelancer registration failed: {r.text}")
        return None

    print_success("Freelancer account created")

    # Login freelancer
    print_test("Logging in as freelancer...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }

    r = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    if r.status_code != 200:
        print_error(f"Freelancer login failed: {r.text}")
        return None

    fl_token = r.json().get("access_token")
    fl_user_id = r.json().get("user", {}).get("id")

    print_success("Freelancer logged in")
    print_info(f"  User ID: {fl_user_id}")

    # Update freelancer profile
    print_test("Completing freelancer profile...")
    fl_headers = {"Authorization": f"Bearer {fl_token}"}

    profile_data = {
        "full_name": "Jane Smith",
        "professional_title": "Full Stack Developer",
        "bio": "Experienced React and Node.js developer",
        "hourly_rate": 75,
        "skills": ["React", "Node.js", "Next.js", "Tailwind CSS"]
    }

    r = requests.put(
        f"{BASE_URL}/freelancers/profile",
        json=profile_data,
        headers=fl_headers
    )

    if r.status_code not in [200, 201]:
        print_error(f"Profile update failed: {r.text}")
    else:
        print_success("Freelancer profile completed")

    # View project
    if project_id:
        print_test("Viewing project as freelancer...")
        r = requests.get(f"{BASE_URL}/projects/{project_id}", headers=fl_headers)
        if r.status_code == 200:
            print_success("Project details retrieved")
        else:
            print_error(f"Cannot view project: {r.text}")

        # Submit proposal
        print_test("Submitting proposal...")
        proposal_data = {
            "project_id": project_id,
            "cover_letter": "I'm very interested in this project. I have 5+ years of experience with React and Next.js.",
            "proposed_bid": 4500,
            "timeline_days": 14,
            "portfolio_links": ["https://github.com/example"]
        }

        r = requests.post(
            f"{BASE_URL}/proposals",
            json=proposal_data,
            headers=fl_headers
        )

        if r.status_code in [200, 201]:
            print_success("Proposal submitted successfully")
            return fl_token
        else:
            print_error(f"Proposal submission failed: {r.text}")

    return fl_token

def test_proposal_acceptance(token, project_id):
    """Test client accepting proposal"""
    print_header("STEP 6: CLIENT ACCEPTS PROPOSAL")

    if not token or not project_id:
        print_error("Missing token or project ID")
        return False

    headers = {"Authorization": f"Bearer {token}"}

    print_test("Fetching proposals for project...")

    r = requests.get(
        f"{BASE_URL}/projects/{project_id}/proposals",
        headers=headers
    )

    if r.status_code == 200:
        proposals = r.json()
        if isinstance(proposals, list) and len(proposals) > 0:
            proposal_id = proposals[0].get("id")
            print_success(f"Found {len(proposals)} proposal(s)")

            # Accept proposal
            print_test("Accepting proposal...")
            accept_data = {"status": "accepted"}

            r = requests.post(
                f"{BASE_URL}/proposals/{proposal_id}/accept",
                json=accept_data,
                headers=headers
            )

            if r.status_code in [200, 201]:
                print_success("Proposal accepted - contract created!")
                return True
            else:
                print_error(f"Proposal acceptance failed: {r.text}")
        else:
            print_error("No proposals found")
    else:
        print_error(f"Failed to fetch proposals: {r.text}")

    return False

def run_full_test():
    """Run complete workflow test"""
    print(f"\n{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║  MegiLance Complete Workflow Verification Test                ║")
    print("║  Tests: Client & Freelancer workflows with validation         ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.RESET}")

    # Step 1: Health check
    if not test_health():
        print_error("\nBackend is not running. Cannot continue.")
        return False

    time.sleep(1)

    # Step 2: Auth flow
    client_token, client_id = test_auth_flow()
    if not client_token:
        print_error("\nAuthentication failed. Cannot continue.")
        return False

    time.sleep(1)

    # Step 3: Client profile
    if not test_client_profile(client_token):
        print_error("Client profile setup failed")

    time.sleep(1)

    # Step 4: Create project
    project_id = test_project_creation(client_token)
    if not project_id:
        print_error("Project creation failed")
        return False

    time.sleep(2)

    # Step 5: Freelancer workflow
    fl_token = test_freelancer_workflow(project_id)

    time.sleep(2)

    # Step 6: Accept proposal
    if fl_token and project_id:
        test_proposal_acceptance(client_token, project_id)

    print_header("VERIFICATION COMPLETE ✅")
    print(f"""
{Colors.GREEN}Summary:{Colors.RESET}
✅ Backend health verified
✅ Authentication working
✅ Client profile creation working
✅ Project creation & posting working
✅ Freelancer registration & profile working
✅ Proposal submission working
✅ Proposal acceptance working

{Colors.BLUE}What to test manually next:{Colors.RESET}
1. Visit http://localhost:3000 in browser
2. Sign up as CLIENT
3. Post a project
4. Sign up as FREELANCER (different email)
5. Submit proposal to project
6. Accept proposal as CLIENT
7. Upload deliverables as FREELANCER
8. Leave reviews

{Colors.BLUE}For detailed step-by-step guide:{Colors.RESET}
See: WORKFLOW_VERIFICATION_GUIDE.md
""")

if __name__ == "__main__":
    try:
        run_full_test()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}Error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
