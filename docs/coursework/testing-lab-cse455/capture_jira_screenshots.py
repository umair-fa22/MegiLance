"""Capture Jira + Zephyr Scale screenshots for CSE-455 assignment using Playwright."""
import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Use existing Chrome profile for authentication
CHROME_USER_DATA = os.path.expanduser(r"~\AppData\Local\ms-playwright\mcp-chrome-72f25b4")

BASE_URL = "https://ghulam-mujtaba.atlassian.net"
ZEPHYR_BASE = f"{BASE_URL}/projects/MEG?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page"


def wait_and_screenshot(page, filename, wait_secs=5, full_page=False):
    """Wait for page to load and take screenshot."""
    time.sleep(wait_secs)
    filepath = os.path.join(SCREENSHOTS_DIR, filename)
    page.screenshot(path=filepath, full_page=full_page)
    print(f"  ✓ Saved: {filename}")


def capture_all(page):
    """Capture all needed screenshots."""

    # ── 1. Zephyr Scale: Test Cases List (all 10) ──
    print("\n1. Zephyr Scale — Test Cases List")
    page.goto(ZEPHYR_BASE)
    page.wait_for_timeout(8000)
    # Collapse sidebar for more space
    try:
        sidebar_btn = page.locator('button:has-text("Collapse sidebar")')
        if sidebar_btn.count() > 0:
            sidebar_btn.click()
            page.wait_for_timeout(1000)
    except Exception:
        pass
    wait_and_screenshot(page, "zephyr-test-cases-list-all.png", wait_secs=2)

    # ── 2. Zephyr Scale: MEG-T1 Details ──
    print("\n2. Zephyr Scale — MEG-T1 Details")
    page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T1")
    wait_and_screenshot(page, "zephyr-tc1-details.png", wait_secs=8)

    # ── 3. Zephyr Scale: MEG-T1 Test Script Tab ──
    print("\n3. Zephyr Scale — MEG-T1 Test Script")
    try:
        test_script_tab = page.locator('text=Test Script').first
        if test_script_tab.count() > 0:
            test_script_tab.click()
            wait_and_screenshot(page, "zephyr-tc1-testscript.png", wait_secs=3)
    except Exception:
        print("  Could not find Test Script tab")

    # ── 4. Zephyr Scale: MEG-T6 (Project Management) ──
    print("\n4. Zephyr Scale — MEG-T6 Details")
    page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T6")
    wait_and_screenshot(page, "zephyr-tc6-details.png", wait_secs=8)

    # ── 5. Zephyr Scale: MEG-T8 (Proposals) ──
    print("\n5. Zephyr Scale — MEG-T8 Details")
    page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T8")
    wait_and_screenshot(page, "zephyr-tc8-details.png", wait_secs=8)

    # ── 6. Zephyr Scale: MEG-T9 (Payments) ──
    print("\n6. Zephyr Scale — MEG-T9 Details")
    page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T9")
    wait_and_screenshot(page, "zephyr-tc9-details.png", wait_secs=8)

    # ── 7. Zephyr Scale: MEG-T10 (Search) ──
    print("\n7. Zephyr Scale — MEG-T10 Details")
    page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T10")
    wait_and_screenshot(page, "zephyr-tc10-details.png", wait_secs=8)

    # ── 8. Zephyr Scale: Test Cycles Tab ──
    print("\n8. Zephyr Scale — Test Cycles")
    page.goto(ZEPHYR_BASE)
    page.wait_for_timeout(5000)
    try:
        cycles_tab = page.locator('text=Test Cycles').first
        if cycles_tab.count() > 0:
            cycles_tab.click()
            wait_and_screenshot(page, "zephyr-test-cycles.png", wait_secs=5)
    except Exception:
        print("  Could not find Test Cycles tab")

    # ── 9. Zephyr Scale: Test Plans Tab ──
    print("\n9. Zephyr Scale — Test Plans")
    try:
        plans_tab = page.locator('text=Test Plans').first
        if plans_tab.count() > 0:
            plans_tab.click()
            wait_and_screenshot(page, "zephyr-test-plans.png", wait_secs=5)
    except Exception:
        print("  Could not find Test Plans tab")

    # ── 10. Zephyr Scale: Reports Tab ──
    print("\n10. Zephyr Scale — Reports")
    try:
        reports_tab = page.locator('text=Reports').first
        if reports_tab.count() > 0:
            reports_tab.click()
            wait_and_screenshot(page, "zephyr-reports.png", wait_secs=5)
    except Exception:
        print("  Could not find Reports tab")

    # ── 11. Jira: Test Case Issues List (label=test-case) ──
    print("\n11. Jira — Test Case Issues (21 issues)")
    page.goto(f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20labels%20%3D%20test-case%20ORDER%20BY%20key%20ASC")
    wait_and_screenshot(page, "01-test-cases-list.png", wait_secs=6)

    # ── 12. Jira: Issue Detail — MEG-105 ──
    print("\n12. Jira — MEG-105 Detail")
    page.goto(f"{BASE_URL}/browse/MEG-105")
    wait_and_screenshot(page, "02-test-case-detail.png", wait_secs=5)

    # ── 13. Jira: Scrum Board ──
    print("\n13. Jira — Scrum Board")
    page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/boards/3")
    wait_and_screenshot(page, "03-scrum-board.png", wait_secs=6)

    # ── 14. Jira: Backlog & Sprints ──
    print("\n14. Jira — Backlog & Sprints")
    page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/backlog")
    wait_and_screenshot(page, "04-backlog-sprints.png", wait_secs=6)

    # ── 15. Jira: Timeline / Epics ──
    print("\n15. Jira — Timeline / Epics")
    page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/boards/3/timeline")
    wait_and_screenshot(page, "05-timeline-epics.png", wait_secs=6)

    # ── 16. Jira: Automation Rules ──
    print("\n16. Jira — Automation Rules")
    page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/settings/automate")
    wait_and_screenshot(page, "06-automation-rules.png", wait_secs=6)

    # ── 17. Jira: All Issues (mixed types) ──
    print("\n17. Jira — All Issues (types)")
    page.goto(f"{BASE_URL}/issues/?jql=project%20%3D%20MEG%20AND%20type%20in%20(Epic%2C%20Story%2C%20Bug%2C%20Task)%20ORDER%20BY%20type%20ASC")
    wait_and_screenshot(page, "07-all-issues-types.png", wait_secs=6)

    # ── 18. Jira: MEG-106 Detail ──
    print("\n18. Jira — MEG-106 Detail")
    page.goto(f"{BASE_URL}/browse/MEG-106")
    wait_and_screenshot(page, "08-test-case-MEG106.png", wait_secs=5)

    # ── 19. Jira: MEG-107 Detail ──
    print("\n19. Jira — MEG-107 Detail")
    page.goto(f"{BASE_URL}/browse/MEG-107")
    wait_and_screenshot(page, "09-test-case-MEG107.png", wait_secs=5)

    # ── 20. Jira: MEG-108 Detail ──
    print("\n20. Jira — MEG-108 Detail")
    page.goto(f"{BASE_URL}/browse/MEG-108")
    wait_and_screenshot(page, "10-test-case-MEG108.png", wait_secs=5)

    # ── 21. Jira: MEG-109 Detail ──
    print("\n21. Jira — MEG-109 Detail")
    page.goto(f"{BASE_URL}/browse/MEG-109")
    wait_and_screenshot(page, "11-test-case-MEG109.png", wait_secs=5)

    # ── 22. Jira: Connected Apps (Zephyr installed) ──
    print("\n22. Jira — Connected Apps (Zephyr)")
    page.goto(f"{BASE_URL}/admin/apps")
    wait_and_screenshot(page, "zephyr-check.png", wait_secs=6)

    # ── 23. Atlassian Marketplace — Zephyr Scale ──
    print("\n23. Atlassian Marketplace — Zephyr Scale")
    page.goto("https://marketplace.atlassian.com/apps/1213259/zephyr-test-management-and-automation-for-jira")
    wait_and_screenshot(page, "zephyr-install.png", wait_secs=5)

    print("\n✅ All screenshots captured!")


def main():
    print("=" * 60)
    print("Capturing Jira + Zephyr Scale screenshots")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            CHROME_USER_DATA,
            headless=False,
            viewport={"width": 1440, "height": 900},
            no_viewport=False,
        )
        page = browser.pages[0] if browser.pages else browser.new_page()
        
        try:
            capture_all(page)
        finally:
            browser.close()

    print("\nDone! Check:", SCREENSHOTS_DIR)


if __name__ == "__main__":
    main()
