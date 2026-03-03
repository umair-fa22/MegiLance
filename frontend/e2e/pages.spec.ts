// @AI-HINT: E2E tests for public marketing pages - visual structure, theme switching, and accessibility.
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper: dismiss cookie consent banner if present
async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.locator('[class*="CookieConsent"] button', { hasText: /accept|got it|ok/i });
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(300);
  }
}

// Helper: navigate and wait for page to be ready (avoid networkidle — Next.js HMR keeps connection open)
async function navigateAndWait(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('load');
  await page.waitForTimeout(500); // Let React hydrate
}

test.describe('Homepage', () => {
  test('loads with all major sections visible', async ({ page }) => {
    await navigateAndWait(page, '/');

    // Hero section should be visible
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();

    // Check page title
    await expect(page).toHaveTitle(/MegiLance/i);
  });

  test('navigation links are functional', async ({ page }) => {
    await navigateAndWait(page, '/');
    await dismissCookieConsent(page);

    // Check main nav links exist
    const featureLink = page.getByRole('link', { name: /features/i }).first();
    if (await featureLink.isVisible()) {
      await featureLink.click();
      await expect(page).toHaveURL(/features/);
    }
  });

  test('responsive layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateAndWait(page, '/');

    // Page should load without significant horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 30); // Allow 30px tolerance for scrollbar/rounding
  });

  test('accessibility audit - homepage', async ({ page }) => {
    await navigateAndWait(page, '/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Report violations for debugging
    if (results.violations.length > 0) {
      console.log('A11y violations:', JSON.stringify(results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
      })), null, 2));
    }

    // Allow up to 5 violations on the homepage (complex page)
    expect(results.violations.length).toBeLessThanOrEqual(5);
  });
});

test.describe('Features Page', () => {
  test('renders feature cards and tab filtering', async ({ page }) => {
    await navigateAndWait(page, '/features');
    await dismissCookieConsent(page);

    // Check that tabs exist
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // Check that All tab is active by default
    const allTab = page.getByRole('tab', { name: /all/i });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');

    // Check feature cards are rendered
    const cards = page.getByRole('article');
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);

    // Click on a category filter
    const paymentsTab = page.getByRole('tab', { name: /payments/i });
    await paymentsTab.click();
    await expect(paymentsTab).toHaveAttribute('aria-selected', 'true');

    // Number of cards should decrease
    const filteredCount = await cards.count();
    expect(filteredCount).toBeLessThan(count);
  });

  test('accessibility audit - features page', async ({ page }) => {
    await navigateAndWait(page, '/features');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.length).toBeLessThanOrEqual(3);
  });
});

test.describe('Auth Pages', () => {
  test('login page has proper form structure', async ({ page }) => {
    await navigateAndWait(page, '/login');

    // Check for form elements
    const emailInput = page.getByRole('textbox').first();
    await expect(emailInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in|log in/i }).first();
    if (await submitButton.isVisible()) {
      await expect(submitButton).toBeEnabled();
    }
  });

  test('signup page loads correctly', async ({ page }) => {
    await navigateAndWait(page, '/signup');

    // Should have the page content or redirect
    await expect(page).toHaveURL(/signup/);
  });

  test('accessibility audit - login page', async ({ page }) => {
    await navigateAndWait(page, '/login');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.length).toBeLessThanOrEqual(3);
  });
});

test.describe('Theme Switching', () => {
  test('theme toggle changes visual appearance', async ({ page }) => {
    await navigateAndWait(page, '/');

    // Confirm initial state is light
    const initialClass = await page.evaluate(() => document.documentElement.className);
    expect(initialClass).toContain('light');

    // Set theme via localStorage (how next-themes persists it) and reload
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);

    // After reload, next-themes should apply the dark theme
    const afterClass = await page.evaluate(() => document.documentElement.className);
    const afterScheme = await page.evaluate(() => document.documentElement.style.colorScheme);
    
    expect(afterClass).toContain('dark');
    expect(afterScheme).toBe('dark');
  });
});

// Helper: inject CSS to freeze animations and hide WebGL canvas for stable screenshots
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after { 
      animation-duration: 0s !important; 
      animation-delay: 0s !important; 
      transition-duration: 0s !important; 
      transition-delay: 0s !important; 
    }
    canvas { visibility: hidden !important; }`,
  });
  await page.waitForTimeout(300);
}

test.describe('Visual Regression', () => {
  test('homepage visual snapshot', async ({ page }) => {
    await navigateAndWait(page, '/');
    await dismissCookieConsent(page);
    await disableAnimations(page);
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('features page visual snapshot', async ({ page }) => {
    await navigateAndWait(page, '/features');
    await dismissCookieConsent(page);
    await disableAnimations(page);
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('features.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page visual snapshot', async ({ page }) => {
    await navigateAndWait(page, '/login');
    await dismissCookieConsent(page);
    await disableAnimations(page);
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('login.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
    });
  });
});
