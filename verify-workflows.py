#!/usr/bin/env python3
"""
MegiLance Workflow Verification Script
Tests all client and freelancer workflows systematically
"""

import subprocess
import sys
import requests
import time
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_section(title):
    print(f"\n{BLUE}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{RESET}\n")

def check_service(url, name):
    """Check if a service is running"""
    try:
        response = requests.get(url, timeout=2)
        print(f"{GREEN}✅ {name} is running{RESET}")
        return True
    except:
        print(f"{RED}❌ {name} is NOT running at {url}{RESET}")
        return False

def run_command(cmd, description):
    """Run a shell command and report results"""
    print(f"\n{BLUE}Running: {description}...{RESET}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print(f"{GREEN}✅ Success{RESET}")
            return True
        else:
            print(f"{RED}❌ Failed{RESET}")
            if result.stdout:
                print("STDOUT:", result.stdout[:500])
            if result.stderr:
                print("STDERR:", result.stderr[:500])
            return False
    except subprocess.TimeoutExpired:
        print(f"{RED}❌ Command timed out{RESET}")
        return False
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        return False

def main():
    print(f"\n{BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║  MegiLance Complete Workflow Verification                 ║")
    print("║  Tests: Client + Freelancer workflows with validation     ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{RESET}")

    # Change to project root
    project_root = Path(__file__).parent

    print_section("1. SERVICE AVAILABILITY CHECK")

    backend_ok = check_service("http://localhost:8000/api/health/ready", "Backend API")
    frontend_ok = check_service("http://localhost:3000", "Frontend")

    if not backend_ok:
        print(f"\n{YELLOW}⚠️  Backend is required for E2E tests!{RESET}")
        print("Start it with:")
        print("  cd backend")
        print("  python -m uvicorn main:app --reload --port 8000")
        sys.exit(1)

    if not frontend_ok:
        print(f"\n{YELLOW}⚠️  Frontend not running (optional for API tests){RESET}")
        print("Start it with:")
        print("  cd frontend")
        print("  npm run dev")

    print_section("2. DEPENDENCY CHECK")

    # Check pytest
    try:
        import pytest
        print(f"{GREEN}✅ pytest is installed{RESET}")
    except ImportError:
        print(f"{YELLOW}Installing test dependencies...{RESET}")
        run_command("pip install -r backend/requirements.txt", "Install backend dependencies")

    print_section("3. RUNNING E2E TESTS")

    test_file = project_root / "backend" / "tests" / "test_e2e_complete_flows.py"
    if not test_file.exists():
        print(f"{RED}❌ Test file not found: {test_file}{RESET}")
        sys.exit(1)

    # Run E2E tests
    cmd = f"cd {project_root / 'backend'} && python -m pytest tests/test_e2e_complete_flows.py -v --tb=short"
    success = run_command(cmd, "E2E Tests (all workflows)")

    print_section("4. TEST SUMMARY")

    if success:
        print(f"{GREEN}✅ All workflows verified successfully!{RESET}")
        print(f"\n{BLUE}Workflows tested:{RESET}")
        print("  ✅ Client Authentication & Registration")
        print("  ✅ Client Profile Management")
        print("  ✅ Client Project Creation & Posting")
        print("  ✅ Client Proposals Management")
        print("  ✅ Client Project Collaboration")
        print("  ✅ Freelancer Authentication & Registration")
        print("  ✅ Freelancer Portfolio & Profile")
        print("  ✅ Freelancer Project Browsing")
        print("  ✅ Freelancer Proposal Submission")
        print("  ✅ Freelancer Project Work")
        print("  ✅ Reviews & Ratings (Both)")
        print("  ✅ Security & Authorization")
        print("  ✅ Data Validation")
        print("  ✅ Error Handling")
    else:
        print(f"{RED}❌ Some tests failed. Review output above.{RESET}")
        sys.exit(1)

    print_section("5. NEXT STEPS")

    print(f"""
{BLUE}Manual Testing Checklist:{RESET}
1. Open http://localhost:3000 in browser
2. Sign up as Client - complete profile and create a project
3. Sign up as Freelancer - complete portfolio and submit proposal
4. Accept proposal as Client
5. Upload deliverables as Freelancer
6. Submit reviews (both directions)

{BLUE}Detailed Guide:{RESET}
See WORKFLOW_VERIFICATION_GUIDE.md for step-by-step verification

{BLUE}API Documentation:{RESET}
http://localhost:8000/docs (Swagger UI)

{BLUE}View Results:{RESET}
backend/e2e_test_results.txt
""")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Verification interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Error: {e}{RESET}")
        sys.exit(1)
