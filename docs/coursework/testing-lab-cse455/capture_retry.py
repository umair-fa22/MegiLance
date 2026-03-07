"""Recapture screenshots that may not have loaded fully."""
import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = os.path.join(os.path.dirname(__file__), "screenshots")
CHROME_USER_DATA = os.path.expanduser(r"~\AppData\Local\ms-playwright\mcp-chrome-72f25b4")
BASE_URL = "https://ghulam-mujtaba.atlassian.net"
ZEPHYR_BASE = f"{BASE_URL}/projects/MEG?selectedItem=com.atlassian.plugins.atlassian-connect-plugin:com.kanoah.test-manager__main-project-page"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            CHROME_USER_DATA,
            headless=False,
            viewport={"width": 1440, "height": 900},
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        # 1. Zephyr Test Cases List - wait extra long
        print("1. Zephyr Test Cases List (extra wait)")
        page.goto(ZEPHYR_BASE)
        time.sleep(15)  # extra wait for Zephyr iframe
        
        # Try to collapse sidebar
        try:
            sb = page.locator('button:has-text("Collapse sidebar")')
            if sb.count() > 0 and sb.is_visible():
                sb.click()
                time.sleep(1)
        except:
            pass
        
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-test-cases-list-all.png"))
        print("  ✓ Saved")

        # 2. MEG-T6 Details (was only 38KB)
        print("2. MEG-T6 Details (retry)")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T6")
        time.sleep(12)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc6-details.png"))
        print("  ✓ Saved")

        # 3. Zephyr check (admin connected apps) - was only 6KB
        print("3. Connected Apps / Zephyr check")
        page.goto(f"{BASE_URL}/wiki/plugins/servlet/upm")
        time.sleep(8)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-check.png"))
        print("  ✓ Saved (UPM)")

        # Try admin manage apps
        page.goto(f"{BASE_URL}/admin/apps")
        time.sleep(8)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-admin-apps.png"))
        print("  ✓ Saved (Admin apps)")

        # 4. Automation rules (was 20KB)
        print("4. Automation Rules (retry)")
        page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/settings/automate")
        time.sleep(10)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "06-automation-rules.png"))
        print("  ✓ Saved")

        # 5. Scrum Board (was 54KB - check)
        print("5. Scrum Board")
        page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/boards/3")
        time.sleep(8)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "03-scrum-board.png"))
        print("  ✓ Saved")

        browser.close()
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
