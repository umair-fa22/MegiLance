"""
Update Zephyr Scale test cases with proper data and capture screenshots.
Uses Playwright persistent Chrome context + frame API.
"""
import os
import time
import sys
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

CHROME_USER_DATA = os.path.expanduser(r"~\AppData\Local\ms-playwright\mcp-chrome-72f25b4")
BASE_URL = "https://ghulam-mujtaba.atlassian.net"
ZEPHYR_BASE = f"{BASE_URL}/projects/MEG?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page"

# ── Test Case Data ──
TC_DATA = {
    "MEG-T1": {
        "objective": "Verify that a new user can register with valid credentials and receive a confirmation.",
        "precondition": "Application is running; /signup page is accessible; no existing account with the test email.",
    },
    "MEG-T2": {
        "objective": "Verify that a registered user can log in with correct email and password.",
        "precondition": "A user account exists with known credentials; /login page is accessible.",
    },
    "MEG-T3": {
        "objective": "Verify that login is rejected when an incorrect password is provided.",
        "precondition": "A valid user account exists with known email; /login page is accessible.",
    },
    "MEG-T4": {
        "objective": "Verify that a user can request a password reset link via their registered email.",
        "precondition": "User account exists with valid email; /forgot-password page is accessible; SMTP service configured.",
    },
    "MEG-T5": {
        "objective": "Verify that an expired access token can be refreshed using a valid refresh token.",
        "precondition": "User is logged in with valid access and refresh tokens; access token is expired.",
    },
    "MEG-T6": {
        "objective": "Verify that a client user can create a new project with all required fields.",
        "precondition": "User is logged in as a Client; /portal/projects/create page is accessible.",
    },
    "MEG-T7": {
        "objective": "Verify that a user can update their profile information successfully.",
        "precondition": "User is logged in; /portal/profile/edit page is accessible.",
    },
    "MEG-T8": {
        "objective": "Verify that a freelancer can submit a proposal for an open project.",
        "precondition": "User logged in as Freelancer; an open project exists; user hasn't already submitted a proposal.",
    },
    "MEG-T9": {
        "objective": "Verify that a payment can be processed for an accepted contract milestone.",
        "precondition": "A contract exists with an accepted milestone; client has sufficient balance; payment gateway configured.",
    },
    "MEG-T10": {
        "objective": "Verify that users can search and filter projects using multiple criteria.",
        "precondition": "Multiple projects exist in the system with varying skills, budgets, and categories.",
    },
}


def get_zephyr_frame(page, timeout=15000):
    """Get the Zephyr Scale iframe."""
    # Wait for the iframe to appear
    page.wait_for_selector('[data-testid="connect-iframe"], iframe[id*="com.kanoah"]', timeout=timeout)
    time.sleep(3)
    
    for f in page.frames:
        if any(kw in f.url for kw in ["zephyr", "kanoah", "tm4j", "smartbear"]):
            return f
    return None


def fill_objective_and_precondition(page, frame, tc_key, tc_data):
    """Fill in Objective and Precondition for a test case using the Zephyr frame."""
    print(f"  Filling {tc_key}...")
    
    # Fill Objective
    try:
        obj_editors = frame.locator('.fr-element.fr-view[contenteditable="true"]')
        obj_count = obj_editors.count()
        print(f"    Found {obj_count} contenteditable editors")
        
        if obj_count >= 1:
            # First editor is usually Objective
            obj_editor = obj_editors.nth(0)
            current_text = obj_editor.text_content()
            
            if "Click to type" in current_text or current_text.strip() == "":
                obj_editor.click()
                time.sleep(0.5)
                # Select all and replace
                page.keyboard.press("Control+a")
                time.sleep(0.2)
                page.keyboard.insert_text(tc_data["objective"])
                time.sleep(0.5)
                # Click outside to save
                frame.locator('h4:has-text("Description"), button:has-text("Description")').first.click()
                time.sleep(1)
                print(f"    ✓ Objective set")
            else:
                print(f"    - Objective already has text: {current_text[:60]}...")
        
        # Fill Precondition (second editor)
        if obj_count >= 2:
            pre_editor = obj_editors.nth(1)
            current_text = pre_editor.text_content()
            
            if "Click to type" in current_text or current_text.strip() == "":
                pre_editor.click()
                time.sleep(0.5)
                page.keyboard.press("Control+a")
                time.sleep(0.2)
                page.keyboard.insert_text(tc_data["precondition"])
                time.sleep(0.5)
                # Click outside to save
                frame.locator('h4:has-text("Description"), button:has-text("Description")').first.click()
                time.sleep(1)
                print(f"    ✓ Precondition set")
            else:
                print(f"    - Precondition already has text: {current_text[:60]}...")
    except Exception as e:
        print(f"    ERROR: {e}")
    
    # Wait for autosave
    time.sleep(2)


def capture(page, filename, wait=2):
    """Take a screenshot."""
    time.sleep(wait)
    path = os.path.join(SCREENSHOTS_DIR, filename)
    page.screenshot(path=path)
    sz = os.path.getsize(path) / 1024
    print(f"    → {filename} ({sz:.0f}KB)")
    return path


def main():
    print("=" * 60)
    print("Zephyr Scale: Update Test Cases + Capture Screenshots")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=CHROME_USER_DATA,
            headless=False,
            viewport={"width": 1440, "height": 900},
            args=[
                "--no-first-run",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()
        
        # ═══ PHASE 1: Fill Objective + Precondition for all 10 TCs ═══
        print("\n" + "═" * 60)
        print("PHASE 1: Filling Objective & Precondition")
        print("═" * 60)
        
        for tc_key, tc_data in TC_DATA.items():
            url = f"{ZEPHYR_BASE}#!/v2/testCase/{tc_key}"
            print(f"\n→ {tc_key}: {url}")
            page.goto(url)
            page.wait_for_timeout(10000)
            
            frame = get_zephyr_frame(page)
            if frame:
                fill_objective_and_precondition(page, frame, tc_key, tc_data)
            else:
                print(f"  ✗ Zephyr frame not found for {tc_key}")
        
        # ═══ PHASE 2: Capture all screenshots ═══
        print("\n" + "═" * 60)
        print("PHASE 2: Capturing Screenshots")
        print("═" * 60)
        
        # 1. Marketplace
        print("\n[1] Zephyr Marketplace")
        page.goto("https://marketplace.atlassian.com/apps/1213259/zephyr-test-management-and-automation-for-jira")
        capture(page, "zephyr-install.png", wait=5)
        
        # 2. Jira Admin - Manage Apps
        print("\n[2] Jira Admin — Manage Apps")
        page.goto(f"{BASE_URL}/plugins/servlet/upm/manage/all")
        page.wait_for_timeout(6000)
        # Try to find and expand Zephyr section
        try:
            page.locator('text=Zephyr').first.click()
            page.wait_for_timeout(2000)
        except:
            pass
        capture(page, "zephyr-check.png", wait=2)
        
        # 3. Jira Admin — Connected Apps
        print("\n[3] Jira Admin — Connected Apps")
        page.goto(f"{BASE_URL}/plugins/servlet/upm/manage/user-installed")
        page.wait_for_timeout(6000)
        capture(page, "zephyr-admin-apps.png", wait=2)
        
        # 4. Test Cases List (all 10)
        print("\n[4] Zephyr — Test Cases List")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCases?projectId=10002")
        page.wait_for_timeout(12000)
        capture(page, "zephyr-test-cases-list-all.png", wait=3)
        
        # 5-10. Individual TC details
        tc_details = [
            ("MEG-T1", "zephyr-tc1-details.png"),
            ("MEG-T6", "zephyr-tc6-details.png"),
            ("MEG-T8", "zephyr-tc8-details.png"),
            ("MEG-T9", "zephyr-tc9-details.png"),
            ("MEG-T10", "zephyr-tc10-details.png"),
        ]
        for i, (tc, filename) in enumerate(tc_details):
            n = [5, 7, 8, 9, 10][i]
            print(f"\n[{n}] {tc} Details")
            page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/{tc}")
            page.wait_for_timeout(10000)
            capture(page, filename, wait=3)
        
        # 6. MEG-T1 Test Script
        print("\n[6] MEG-T1 Test Script")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T1")
        page.wait_for_timeout(10000)
        frame = get_zephyr_frame(page)
        if frame:
            try:
                frame.locator('text=Test Script').first.click()
                time.sleep(5)
            except:
                pass
        capture(page, "zephyr-tc1-testscript.png", wait=2)
        
        # 11-13. Zephyr tabs
        print("\n[11] Zephyr — Test Cycles")
        page.goto(ZEPHYR_BASE)
        page.wait_for_timeout(10000)
        frame = get_zephyr_frame(page)
        if frame:
            try:
                frame.locator('[role="tab"]:has-text("Test Cycles"), button:has-text("Test Cycles")').first.click()
                time.sleep(4)
            except Exception as e:
                print(f"    Tab click error: {e}")
        capture(page, "zephyr-test-cycles.png", wait=2)
        
        print("\n[12] Zephyr — Test Plans")
        frame = get_zephyr_frame(page)
        if frame:
            try:
                frame.locator('[role="tab"]:has-text("Test Plans"), button:has-text("Test Plans")').first.click()
                time.sleep(4)
            except Exception as e:
                print(f"    Tab click error: {e}")
        capture(page, "zephyr-test-plans.png", wait=2)
        
        print("\n[13] Zephyr — Reports")
        frame = get_zephyr_frame(page)
        if frame:
            try:
                frame.locator('[role="tab"]:has-text("Reports"), button:has-text("Reports")').first.click()
                time.sleep(4)
            except Exception as e:
                print(f"    Tab click error: {e}")
        capture(page, "zephyr-reports.png", wait=2)
        
        # 14-20. Jira project pages
        jira_pages = [
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3", "03-scrum-board.png", "Scrum Board"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/backlog", "04-backlog-sprints.png", "Backlog"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/timeline", "05-timeline-epics.png", "Timeline"),
            (f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20type%20in%20(Epic%2C%20Story%2C%20Bug%2C%20Task)%20ORDER%20BY%20type%20ASC", "07-all-issues-types.png", "All Issues"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/settings/automate", "06-automation-rules.png", "Automation"),
            (f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20labels%20%3D%20test-case", "01-test-cases-list.png", "Test Cases"),
            (f"{BASE_URL}/browse/MEG-105", "02-test-case-detail.png", "TC Detail"),
        ]
        for url, filename, label in jira_pages:
            print(f"\n[{label}] {filename}")
            page.goto(url)
            capture(page, filename, wait=7)
        
        print("\n" + "═" * 60)
        print("DONE! All screenshots captured.")
        print("═" * 60)
        
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                sz = os.path.getsize(os.path.join(SCREENSHOTS_DIR, f))
                print(f"  {f:45s} {sz//1024:>4d}KB")
        
        browser.close()


if __name__ == "__main__":
    main()
