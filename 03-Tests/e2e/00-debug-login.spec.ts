import { test, expect } from '@playwright/test';

/**
 * Debug test to understand login flow failures
 */
test.describe('Debug Login Flow', () => {
  test('should debug registration and login', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `debug${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    // Capture console logs
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR]:`, error.message);
    });

    // Capture network responses with body for API calls
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const headers = response.headers();
          console.log(`[API] ${response.status()} ${response.request().method()} ${url}`);
          if (headers['set-cookie']) {
            console.log(`[API SET-COOKIE]:`, headers['set-cookie']);
          }
          const body = await response.text();
          console.log(`[API BODY]:`, body.substring(0, 300));
        } catch { }
      }
    });

    // STEP 1: Register
    console.log('=== STEP 1: REGISTER ===');
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    console.log('✓ On register page');

    await page.fill('input[id="firstName"]', 'Debug');
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="phone"]', '5551234567');
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    console.log('✓ Form filled');

    await page.click('button[type="submit"]');
    console.log('✓ Submit clicked');

    // Wait and check where we end up
    await page.waitForTimeout(3000);
    console.log(`After registration URL: ${page.url()}`);

    // STEP 2: Login
    console.log('=== STEP 2: LOGIN ===');
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    console.log('✓ On login page');

    await page.fill('input[id="email"], input[type="email"]', testEmail);
    await page.fill('input[id="password"], input[type="password"]', testPassword);
    console.log('✓ Credentials filled');

    // Take screenshot before submit
    await page.screenshot({ path: 'test-results/debug-before-login.png' });

    await page.click('button[type="submit"]');
    console.log('✓ Login submit clicked');

    // Wait for any response
    await page.waitForTimeout(5000);

    // Take screenshot after
    await page.screenshot({ path: 'test-results/debug-after-login.png' });

    const finalUrl = page.url();
    console.log(`Final URL after login: ${finalUrl}`);

    // Check for error messages on page
    const bodyText = await page.textContent('body');
    if (bodyText?.includes('verify your email')) {
      console.log('❌ ERROR: Email verification required');
    }
    if (bodyText?.includes('error') || bodyText?.includes('Error')) {
      console.log('❌ ERROR found on page');
    }

    // This will fail but give us info
    if (!finalUrl.includes('dashboard')) {
      console.log('❌ FAILED: Not on dashboard');
      console.log('Page content preview:', bodyText?.substring(0, 500));
    }

    await expect(page).toHaveURL(/dashboard/);
  });
});
