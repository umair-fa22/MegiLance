"""
Update Zephyr Scale test cases with proper data and capture screenshots.
Uses frame_locator for cross-origin iframe access.
"""
import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

CHROME_USER_DATA = os.path.expanduser(r"~\AppData\Local\ms-playwright\mcp-chrome-72f25b4")
BASE_URL = "https://ghulam-mujtaba.atlassian.net"
ZEPHYR_BASE = f"{BASE_URL}/projects/MEG?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page"

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


def capture(page, filename, wait=2):
    """Take a screenshot."""
    time.sleep(wait)
    path = os.path.join(SCREENSHOTS_DIR, filename)
    page.screenshot(path=path)
    sz = os.path.getsize(path) / 1024
    print(f"    -> {filename} ({sz:.0f}KB)")
    return path


def fill_tc_fields(page, tc_key, tc_data):
    """Fill Objective and Precondition using frame_locator for cross-origin iframe."""
    print(f"  Filling {tc_key}...")
    
    # Use frame_locator to access the cross-origin Zephyr iframe
    # Try multiple selectors for the iframe
    iframe_selectors = [
        'iframe[data-testid="connect-iframe"]',
        'iframe[id*="com.kanoah"]',
        'iframe[src*="tm4j"]',
        'iframe[src*="smartbear"]',
        'iframe[src*="zephyr"]',
    ]
    
    frame = None
    for sel in iframe_selectors:
        try:
            if page.locator(sel).count() > 0:
                frame = page.frame_locator(sel)
                # Test if we can access content
                test = frame.locator('.fr-element').count()
                print(f"    Found iframe ({sel}): {test} .fr-element")
                if test > 0:
                    break
                # Also try contenteditable
                test2 = frame.locator('[contenteditable="true"]').count()
                print(f"    Also found {test2} [contenteditable] elements")
                if test2 > 0:
                    break
        except Exception as e:
            print(f"    Selector {sel}: {e}")
    
    if frame is None:
        # Fallback: try to find any iframe on the page
        iframes = page.locator('iframe')
        count = iframes.count()
        print(f"    Total iframes on page: {count}")
        for i in range(count):
            try:
                src = iframes.nth(i).get_attribute('src') or ''
                tid = iframes.nth(i).get_attribute('data-testid') or ''
                iid = iframes.nth(i).get_attribute('id') or ''
                print(f"    iframe[{i}]: id={iid[:40]}, testid={tid}, src={src[:80]}")
            except:
                pass
        return False
    
    # Try to find contenteditable editors
    editors = frame.locator('[contenteditable="true"]')
    editor_count = editors.count()
    print(f"    Contenteditable editors found: {editor_count}")
    
    if editor_count == 0:
        # Try alternative selectors
        for alt_sel in ['.fr-view', '[class*="editor"]', '[role="textbox"]', 'div[dir="auto"]']:
            alt_count = frame.locator(alt_sel).count()
            print(f"    Alt selector '{alt_sel}': {alt_count} elements")
    
    if editor_count >= 1:
        # First contenteditable = Objective
        try:
            obj_editor = editors.nth(0)
            text = obj_editor.text_content()
            print(f"    Objective current: '{text[:50]}...'")
            if "Click to type" in text or text.strip() == "":
                obj_editor.click()
                time.sleep(0.5)
                page.keyboard.press("Control+a")
                time.sleep(0.2)
                page.keyboard.insert_text(tc_data["objective"])
                time.sleep(1)
                print(f"    OK Objective set")
            else:
                print(f"    OK Objective already filled")
        except Exception as e:
            print(f"    ERROR Objective: {e}")
    
    if editor_count >= 2:
        # Second contenteditable = Precondition
        try:
            pre_editor = editors.nth(1)
            text = pre_editor.text_content()
            print(f"    Precondition current: '{text[:50]}...'")
            if "Click to type" in text or text.strip() == "":
                pre_editor.click()
                time.sleep(0.5)
                page.keyboard.press("Control+a")
                time.sleep(0.2)
                page.keyboard.insert_text(tc_data["precondition"])
                time.sleep(1)
                print(f"    OK Precondition set")
            else:
                print(f"    OK Precondition already filled")
        except Exception as e:
            print(f"    ERROR Precondition: {e}")
    
    # Wait for autosave
    time.sleep(3)
    return True


def main():
    print("=" * 60)
    print("Zephyr Scale: Update + Capture (v2 - frame_locator)")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=CHROME_USER_DATA,
            headless=False,
            viewport={"width": 1440, "height": 900},
            args=[
                "--no-first-run",
                "--disable-blink-features=AutomationControlled",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()
        
        # ═══ PHASE 1: Fill Objective + Precondition ═══
        print("\nPHASE 1: Filling fields...")
        
        for tc_key, tc_data in TC_DATA.items():
            url = f"{ZEPHYR_BASE}#!/v2/testCase/{tc_key}"
            print(f"\n  >> {tc_key}")
            page.goto(url)
            page.wait_for_timeout(12000)  # Longer wait for iframe load
            fill_tc_fields(page, tc_key, tc_data)
        
        # ═══ PHASE 2: Capture screenshots ═══
        print("\n\nPHASE 2: Capturing screenshots...")
        
        # Marketplace
        print("\n[1] Marketplace")
        page.goto("https://marketplace.atlassian.com/apps/1213259/zephyr-test-management-and-automation-for-jira")
        capture(page, "zephyr-install.png", wait=5)
        
        # Jira Admin — UPM Manage Apps
        print("\n[2] UPM Manage Apps")
        page.goto(f"{BASE_URL}/plugins/servlet/upm/manage/all")
        page.wait_for_timeout(6000)
        try:
            page.locator('text=Zephyr').first.click(timeout=5000)
            page.wait_for_timeout(2000)
        except:
            pass
        capture(page, "zephyr-check.png", wait=2)
        
        # Connected/User-installed apps
        print("\n[3] User-installed apps")
        page.goto(f"{BASE_URL}/plugins/servlet/upm/manage/user-installed")
        page.wait_for_timeout(6000)
        capture(page, "zephyr-admin-apps.png", wait=2)
        
        # Test Cases list
        print("\n[4] Test Cases List")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCases?projectId=10002")
        page.wait_for_timeout(14000)
        capture(page, "zephyr-test-cases-list-all.png", wait=3)
        
        # Individual TC screenshots
        tc_shots = [
            ("MEG-T1", "zephyr-tc1-details.png"),
            ("MEG-T6", "zephyr-tc6-details.png"),
            ("MEG-T8", "zephyr-tc8-details.png"),
            ("MEG-T9", "zephyr-tc9-details.png"),
            ("MEG-T10", "zephyr-tc10-details.png"),
        ]
        for tc, fname in tc_shots:
            print(f"\n[{tc}] Details")
            page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/{tc}")
            page.wait_for_timeout(12000)
            capture(page, fname, wait=3)
        
        # Test Script tab for MEG-T1
        print("\n[T1-script] Test Script")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T1")
        page.wait_for_timeout(12000)
        # Click Test Script tab in iframe
        try:
            fl = page.frame_locator('iframe[data-testid="connect-iframe"], iframe[id*="com.kanoah"]')
            fl.locator('text=Test Script').first.click(timeout=5000)
            time.sleep(5)
        except Exception as e:
            print(f"    Tab click error: {e}")
        capture(page, "zephyr-tc1-testscript.png", wait=2)
        
        # Zephyr tabs: Test Cycles, Plans, Reports
        print("\n[Cycles]")
        page.goto(ZEPHYR_BASE)
        page.wait_for_timeout(12000)
        try:
            fl = page.frame_locator('iframe[data-testid="connect-iframe"], iframe[id*="com.kanoah"]')
            fl.locator('text=Test Cycles').first.click(timeout=5000)
            time.sleep(4)
        except Exception as e:
            print(f"    {e}")
        capture(page, "zephyr-test-cycles.png", wait=2)
        
        print("\n[Plans]")
        try:
            fl.locator('text=Test Plans').first.click(timeout=5000)
            time.sleep(4)
        except Exception as e:
            print(f"    {e}")
        capture(page, "zephyr-test-plans.png", wait=2)
        
        print("\n[Reports]")
        try:
            fl.locator('text=Reports').first.click(timeout=5000)
            time.sleep(4)
        except Exception as e:
            print(f"    {e}")
        capture(page, "zephyr-reports.png", wait=2)
        
        # Jira pages
        jira = [
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3", "03-scrum-board.png"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/backlog", "04-backlog-sprints.png"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/timeline", "05-timeline-epics.png"),
            (f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20type%20in%20(Epic%2C%20Story%2C%20Bug%2C%20Task)%20ORDER%20BY%20type%20ASC", "07-all-issues-types.png"),
            (f"{BASE_URL}/jira/software/c/projects/MEG/settings/automate", "06-automation-rules.png"),
            (f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20labels%20%3D%20test-case", "01-test-cases-list.png"),
            (f"{BASE_URL}/browse/MEG-105", "02-test-case-detail.png"),
        ]
        for url, fname in jira:
            print(f"\n[{fname}]")
            page.goto(url)
            capture(page, fname, wait=7)
        
        print("\n" + "=" * 60)
        print("COMPLETE")
        print("=" * 60)
        for f in sorted(os.listdir(SCREENSHOTS_DIR)):
            if f.endswith('.png'):
                sz = os.path.getsize(os.path.join(SCREENSHOTS_DIR, f)) // 1024
                print(f"  {f:45s} {sz:>4d}KB")
        
        browser.close()


if __name__ == "__main__":
    main()
