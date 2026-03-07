"""Capture Zephyr Scale Test Cycles and Test Plans via direct URL navigation."""
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

        # Direct URL for Test Cycles
        print("1. Zephyr — Test Cycles (direct URL)")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCycles?projectId=10002")
        time.sleep(10)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-test-cycles.png"))
        print("  ✓ Saved")

        # Direct URL for Test Plans
        print("2. Zephyr — Test Plans (direct URL)")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testPlans?projectId=10002")
        time.sleep(10)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-test-plans.png"))
        print("  ✓ Saved")

        # Direct URL for Reports
        print("3. Zephyr — Reports (direct URL)")
        page.goto(f"{ZEPHYR_BASE}#!/v2/reports?projectId=10002")
        time.sleep(10)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-reports.png"))
        print("  ✓ Saved")

        # Try to get Test Script view for MEG-T1
        print("4. MEG-T1 Test Script")
        page.goto(f"{ZEPHYR_BASE}#!/v2/testCase/MEG-T1")
        time.sleep(10)
        # Try clicking within frames
        frames = page.frames
        print(f"   Found {len(frames)} frames")
        for i, frame in enumerate(frames):
            try:
                ts = frame.locator('text=Test Script').first
                if ts.count() > 0 and ts.is_visible():
                    print(f"   Found 'Test Script' in frame {i}")
                    ts.click()
                    time.sleep(3)
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc1-testscript.png"))
                    print("   ✓ Saved")
                    break
            except Exception:
                pass
        else:
            # Still save whatever is shown
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "zephyr-tc1-testscript.png"))
            print("   ✓ Saved (current view)")

        browser.close()
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
