const { chromium } = require('E:/MegiLance/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  
  const pages = [
    { url: 'http://localhost:3000', name: 'homepage' },
    { url: 'http://localhost:3000/login', name: 'login' },
    { url: 'http://localhost:3000/signup', name: 'signup' },
    { url: 'http://localhost:3000/forgot-password', name: 'forgot-password' },
    { url: 'http://localhost:3000/features', name: 'features' },
    { url: 'http://localhost:3000/about', name: 'about' },
    { url: 'http://localhost:3000/pricing', name: 'pricing' },
    { url: 'http://localhost:3000/contact', name: 'contact' },
    { url: 'http://localhost:3000/how-it-works', name: 'how-it-works' },
    { url: 'http://localhost:3000/blog', name: 'blog' },
  ];

  for (const { url, name } of pages) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(3000); // Wait for animations/hydration
      // Dismiss cookie consent if present
      try {
        const acceptBtn = page.locator('button:has-text("Accept")');
        if (await acceptBtn.isVisible({ timeout: 1000 })) {
          await acceptBtn.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {}
      await page.screenshot({ path: `screenshots/${name}-dark.png`, fullPage: true });
      console.log(`✓ ${name} (dark) captured`);
      
      // Switch to light theme
      await page.evaluate(() => {
        localStorage.setItem('megilance-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `screenshots/${name}-light.png`, fullPage: true });
      console.log(`✓ ${name} (light) captured`);
    } catch (e) {
      console.log(`✗ ${name} failed: ${e.message}`);
    }
    await page.close();
  }

  await browser.close();
  console.log('Done!');
})();
