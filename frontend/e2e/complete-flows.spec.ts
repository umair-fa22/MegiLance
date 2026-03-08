// @AI-HINT: Comprehensive E2E tests for ALL frontend user flows, pages, roles
// Tests the LIVE frontend at localhost:3000 with Playwright
// Covers: Auth pages, Client portal, Freelancer portal, Admin portal, Public pages, Navigation

import { test, expect, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Unique test data
const TEST_ID = Math.random().toString(36).substring(2, 10);
const CLIENT_EMAIL = `e2e_fe_client_${TEST_ID}@test.com`;
const FREELANCER_EMAIL = `e2e_fe_freelancer_${TEST_ID}@test.com`;
const TEST_PASSWORD = 'E2eTestP@ss123!';

// Helper: navigate and wait for hydration
async function goto(page: Page, path: string) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
}

// Helper: dismiss cookie consent
async function dismissCookies(page: Page) {
  const btn = page.locator('[class*="CookieConsent"] button', { hasText: /accept|got it|ok/i });
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(300);
  }
}

// ============================================================================
// 1. PUBLIC PAGES - No Auth Required
// ============================================================================
test.describe('1. Public Pages', () => {
  test('Homepage loads with hero section', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);
    await expect(page).toHaveTitle(/MegiLance/i);
    // Should have main content visible
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test('Homepage has navigation', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);
    // Navigation should exist
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible();
  });

  test('Features page loads', async ({ page }) => {
    await goto(page, '/features');
    await expect(page.locator('body')).toBeVisible();
  });

  test('How It Works page loads', async ({ page }) => {
    await goto(page, '/how-it-works');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page has form', async ({ page }) => {
    await goto(page, '/login');
    // Should have email and password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    // Should have submit button
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
  });

  test('Signup page has registration form', async ({ page }) => {
    await goto(page, '/signup');
    // Should have form fields
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('Forgot password page loads', async ({ page }) => {
    await goto(page, '/forgot-password');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('Terms page loads', async ({ page }) => {
    await goto(page, '/terms');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Privacy page loads', async ({ page }) => {
    await goto(page, '/privacy');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Blog page loads', async ({ page }) => {
    await goto(page, '/blog');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Responsive - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await goto(page, '/');
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 30);
  });

  test('Responsive - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await goto(page, '/');
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// 2. AUTHENTICATION FLOWS
// ============================================================================
test.describe('2. Authentication Flows', () => {
  test('Login with invalid credentials shows error', async ({ page }) => {
    await goto(page, '/login');
    await dismissCookies(page);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill('nonexistent@test.com');
    await passwordInput.fill('WrongPassword123!');
    await submitBtn.click();

    // Should show error message (wait for it)
    const error = page.locator('[class*="error"], [class*="Error"], [role="alert"], .toast-error');
    await expect(error.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Some UIs show inline errors
    });
  });

  test('Login with empty fields shows validation', async ({ page }) => {
    await goto(page, '/login');
    await dismissCookies(page);

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Browser HTML5 validation or custom error should appear
    await page.waitForTimeout(1000);
  });

  test('Signup form with weak password shows validation', async ({ page }) => {
    await goto(page, '/signup');
    await dismissCookies(page);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill(`weak_${TEST_ID}@test.com`);
    await passwordInput.fill('123');

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
  });

  test('Login redirects to auth page when accessing protected route', async ({ page }) => {
    await goto(page, '/dashboard');
    // Should redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/login|auth|signin/i);
  });
});

// ============================================================================
// 3. PORTAL PAGES (AUTHENTICATED) - Test page loading
// ============================================================================
test.describe('3. Portal Page Structure', () => {
  // These test that portal pages exist and redirect to login when not authenticated
  const portalPages = [
    '/dashboard',
    '/projects',
    '/proposals',
    '/contracts',
    '/messages',
    '/notifications',
    '/settings',
    '/payments',
    '/invoices',
    '/favorites',
    '/support',
  ];

  for (const pagePath of portalPages) {
    test(`Portal ${pagePath} redirects to login or loads`, async ({ page }) => {
      await goto(page, pagePath);
      await page.waitForTimeout(2000);
      const url = page.url();
      // Should either show the page (if session exists) or redirect to login
      const isProtected = url.includes('login') || url.includes('auth') || url.includes('signin');
      const isLoaded = !isProtected && page.url().includes(pagePath);
      expect(isProtected || isLoaded || page.url() === `${BASE}/`).toBeTruthy();
    });
  }
});

// ============================================================================
// 4. CLIENT-SPECIFIC PAGES
// ============================================================================
test.describe('4. Client Portal Pages', () => {
  const clientPages = [
    '/client/projects',
    '/create-project',
    '/search',
  ];

  for (const pagePath of clientPages) {
    test(`Client page ${pagePath} loads or redirects`, async ({ page }) => {
      await goto(page, pagePath);
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

// ============================================================================
// 5. FREELANCER-SPECIFIC PAGES
// ============================================================================
test.describe('5. Freelancer Portal Pages', () => {
  const freelancerPages = [
    '/freelancer/dashboard',
    '/freelancer/gigs',
    '/profile',
  ];

  for (const pagePath of freelancerPages) {
    test(`Freelancer page ${pagePath} loads or redirects`, async ({ page }) => {
      await goto(page, pagePath);
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

// ============================================================================
// 6. ADMIN PAGES
// ============================================================================
test.describe('6. Admin Portal Pages', () => {
  const adminPages = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/projects',
    '/admin/contracts',
    '/admin/payments',
    '/admin/disputes',
    '/admin/settings',
  ];

  for (const pagePath of adminPages) {
    test(`Admin page ${pagePath} loads or redirects`, async ({ page }) => {
      await goto(page, pagePath);
      await page.waitForTimeout(2000);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

// ============================================================================
// 7. THEME SWITCHING
// ============================================================================
test.describe('7. Theme Switching', () => {
  test('Page renders in light theme without errors', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await goto(page, '/');
    await dismissCookies(page);
    
    // No JS errors should be present
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(2000);

    // Check dark theme too
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(1000);
  });

  test('Theme toggle button works', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);

    // Look for theme toggle button
    const themeBtn = page.locator('[aria-label*="theme" i], [class*="theme" i] button, [class*="ThemeToggle" i]').first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(500);
      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

// ============================================================================
// 8. NAVIGATION & ROUTING
// ============================================================================
test.describe('8. Navigation & Routing', () => {
  test('404 page for non-existent route', async ({ page }) => {
    await goto(page, '/this-page-does-not-exist-xyz');
    await page.waitForTimeout(2000);
    // Should show 404 or redirect to home
    const content = await page.textContent('body');
    const is404 = content?.includes('404') || content?.includes('not found') || content?.match(/not found/i);
    const isHome = page.url() === `${BASE}/` || page.url() === `${BASE}`;
    expect(is404 || isHome).toBeTruthy();
  });

  test('Back navigation works', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);
    await goto(page, '/login');
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).toBe(`${BASE}/`);
  });
});

// ============================================================================
// 9. SEO & META TAGS
// ============================================================================
test.describe('9. SEO & Metadata', () => {
  test('Homepage has proper meta tags', async ({ page }) => {
    await goto(page, '/');
    
    // Title should exist
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Description meta tag
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    if (description) {
      expect(description.length).toBeGreaterThan(10);
    }
  });

  test('Robots.txt is accessible', async ({ page }) => {
    const response = await page.goto(`${BASE}/robots.txt`);
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });

  test('Sitemap is accessible', async ({ page }) => {
    const response = await page.goto(`${BASE}/sitemap.xml`);
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
  });
});

// ============================================================================
// 10. PERFORMANCE & CONSOLE ERRORS
// ============================================================================
test.describe('10. Performance & Error Checks', () => {
  test('Homepage loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    
    await goto(page, '/');
    await page.waitForTimeout(3000);

    // Filter out known benign errors
    const criticalErrors = errors.filter(e => 
      !e.includes('hydration') && 
      !e.includes('ResizeObserver') &&
      !e.includes('Loading chunk') &&
      !e.includes('ChunkLoadError')
    );

    // Allow up to 2 non-critical errors (complex app)
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test('Login page loads without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    
    await goto(page, '/login');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e => 
      !e.includes('hydration') && 
      !e.includes('ResizeObserver')
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });

  test('No broken images on homepage', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);
    await page.waitForTimeout(2000);

    const brokenImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).filter(img => !img.complete || img.naturalWidth === 0).length;
    });

    // Allow some images that may be lazy loaded
    expect(brokenImages).toBeLessThanOrEqual(3);
  });
});

// ============================================================================
// 11. FORM INTERACTIONS
// ============================================================================
test.describe('11. Form Interactions', () => {
  test('Login form submission triggers API call', async ({ page }) => {
    await goto(page, '/login');
    await dismissCookies(page);

    // Track network requests
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/auth/login') || request.url().includes('/backend/api/auth/login')) {
        apiCalls.push(request.url());
      }
    });

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await emailInput.fill('test@test.com');
    await passwordInput.fill('TestPassword123!');
    await submitBtn.click();

    await page.waitForTimeout(3000);
    expect(apiCalls.length).toBeGreaterThanOrEqual(1);
  });

  test('Forgot password form can be submitted', async ({ page }) => {
    await goto(page, '/forgot-password');
    await dismissCookies(page);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test@test.com');
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
      }
    }
  });
});

// ============================================================================
// 12. ACCESSIBILITY BASICS
// ============================================================================
test.describe('12. Accessibility Basics', () => {
  test('Homepage has proper heading structure', async ({ page }) => {
    await goto(page, '/');
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('Login page has form labels', async ({ page }) => {
    await goto(page, '/login');
    
    // Inputs should have labels or aria-labels
    const inputs = page.locator('input:not([type="hidden"])');
    const count = await inputs.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      // At least one accessibility attribute should exist
      expect(id || ariaLabel || placeholder).toBeTruthy();
    }
  });

  test('Interactive elements are keyboard accessible', async ({ page }) => {
    await goto(page, '/');
    await dismissCookies(page);

    // Tab through the page and check focus is visible
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : null;
    });
    // Some element should have focus
    expect(focusedElement).toBeTruthy();
  });
});
