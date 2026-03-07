"""Capture remaining Zephyr Scale screenshots (Test Script, Test Cycles, Test Plans)."""
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

        # 1. Go to MEG-T1 detail
        print("1. MEG-T1 Details + Test Script")   
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T1")
        time.sleep(10)  # wait for full load including iframe content
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc1-details.png"))
        print("  ✓ Details saved")

        # Try clicking Test Script tab within the Zephyr iframe
        try:
            # Look for Test Script tab or link
            for selector in ['text=Test Script', 'a:has-text("Test Script")', '[data-testid="test-script-tab"]',
                             'li:has-text("Test Script")', 'button:has-text("Test Script")']:
                el = page.locator(selector).first
                if el.count() > 0 and el.is_visible():
                    el.click()
                    time.sleep(3)
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc1-testscript.png"))
                    print("  ✓ Test Script saved")
                    break
            else:
                # Take a full page screenshot to see what's available
                page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc1-testscript.png"))
                print("  ✓ Saved (current state)")
        except Exception as e:
            print(f"  ✗ Test Script: {e}")

        # 2. Test Cycles
        print("\n2. Test Cycles")
        page.goto(ZEPHYR_BASE)
        time.sleep(8)
        try:
            for selector in ['text=Test Cycles', 'a:has-text("Test Cycles")', 'button:has-text("Test Cycles")']:
                el = page.locator(selector).first
                if el.count() > 0 and el.is_visible():
                    el.click()
                    time.sleep(5)
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-test-cycles.png"))
                    print("  ✓ Test Cycles saved")
                    break
            else:
                print("  ✗ Test Cycles tab not found")
        except Exception as e:
            print(f"  ✗ Test Cycles: {e}")

        # 3. Test Plans
        print("\n3. Test Plans")
        try:
            for selector in ['text=Test Plans', 'a:has-text("Test Plans")', 'button:has-text("Test Plans")']:
                el = page.locator(selector).first
                if el.count() > 0 and el.is_visible():
                    el.click()
                    time.sleep(5)
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-test-plans.png"))
                    print("  ✓ Test Plans saved")
                    break
            else:
                print("  ✗ Test Plans tab not found")
        except Exception as e:
            print(f"  ✗ Test Plans: {e}")

        # 4. Jira Summary page
        print("\n4. Jira Project Summary")
        page.goto(f"{BASE_URL}/jira/software/c/projects/MEG/summary")
        time.sleep(6)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "jira-project-summary.png"))
        print("  ✓ Project Summary saved")

        browser.close()
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
