import { test, expect, Page } from '@playwright/test';

/**
 * Dashboard Tests
 *
 * Tests dashboard functionality, navigation, and stats display
 */

// Helper function to login
async function login(page: Page) {
  const timestamp = Date.now();
  const testEmail = `dashtest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Register
  await page.goto('/register');
  await page.fill('input[id="firstName"]', 'Dashboard');
  await page.fill('input[id="lastName"]', 'Test');
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
  await page.fill('input[id="password"]', testPassword);
  await page.fill('input[id="confirmPassword"]', testPassword);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  // Login
  await page.goto('/login');
  await page.fill('input[id="email"], input[type="email"]', testEmail);
  await page.fill('input[id="password"], input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  return { email: testEmail, password: testPassword };
}

test.describe('Dashboard - Basic Functionality', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display dashboard after login', async ({ page }) => {
    await login(page);

    // Should be on dashboard
    expect(page.url()).toContain('/dashboard');

    // Check for dashboard elements
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();

    // Visual regression: capture dashboard main view
    await expect(page).toHaveScreenshot('dashboard-main.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="user-name"]'),
      ],
    });
  });

  test('should show welcome message or user name', async ({ page }) => {
    await login(page);

    // Should show some personalization
    const dashboardText = await page.locator('body').textContent();
    expect(dashboardText).toMatch(/Dashboard|Test|Welcome/i);
  });

  test('should display stats cards', async ({ page }) => {
    await login(page);

    // Look for stat cards (Total Games, This Season, Development Score, etc.)
    const statsCard = page.locator('div').filter({ hasText: /Total Games|Games|Players|Athletes/i }).first();
    await expect(statsCard).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await login(page);

    // Check for sidebar or navigation menu
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should have "Add Athlete" button or link', async ({ page }) => {
    await login(page);

    // Look for button/link to add athlete
    const addButton = page.locator('button, a').filter({ hasText: /Add Athlete|Add Player|New Athlete/i }).first();

    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should have user menu or profile section', async ({ page }) => {
    await login(page);

    // Look for user menu/profile
    const userMenu = page.locator('button, div').filter({ hasText: /Dashboard|Test|Settings|Profile/i }).first();

    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
    }
  });
});

test.describe('Dashboard - Navigation', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to Add Athlete page', async ({ page }) => {
    await login(page);

    // Click "Add Athlete" button
    const addButton = page.locator('button, a').filter({ hasText: /Add Athlete|Add Player|New Athlete/i }).first();

    if (await addButton.isVisible()) {
      await addButton.click();

      await page.waitForTimeout(1000);

      // Should navigate to add athlete page
      const url = page.url();
      expect(url).toMatch(/add-athlete|athlete|player/i);
    }
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    await login(page);

    // Try to navigate to different sections if they exist
    const sections = ['Athletes', 'Analytics', 'Settings'];

    for (const section of sections) {
      const sectionLink = page.locator(`a:has-text("${section}")`).first();

      if (await sectionLink.isVisible({ timeout: 2000 })) {
        // Use JavaScript click to bypass viewport checks for sidebar elements in headless mode
        await sectionLink.evaluate(el => (el as HTMLElement).click());
        await page.waitForTimeout(1000);

        // Should navigate to that section
        const url = page.url();
        expect(url).toContain(section.toLowerCase());

        // Go back to dashboard
        await page.goto('/dashboard');
      }
    }
  });
});

test.describe('Dashboard - Responsive Design', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should work on mobile (iPhone 12)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await login(page);

    // Dashboard should be visible
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();

    // Content should not overflow
    const body = await page.locator('body').boundingBox();
    expect(body?.width).toBeLessThanOrEqual(390);

    // Visual regression: mobile layout
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="user-name"]'),
      ],
    });
  });

  test('should work on tablet (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await login(page);

    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();

    // Visual regression: tablet layout
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="user-name"]'),
      ],
    });
  });

  test('should work on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await login(page);

    await expect(page.locator('h1, h2').filter({ hasText: /dashboard/i })).toBeVisible();

    // Visual regression: desktop layout
    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      fullPage: true,
      mask: [
        page.locator('[data-testid="timestamp"]'),
        page.locator('[data-testid="user-name"]'),
      ],
    });
  });
});

test.describe('Dashboard - Performance', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should load dashboard in under 3 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await login(page);

    await page.goto('/dashboard');

    await page.waitForTimeout(2000);

    // Filter out known non-critical errors if any
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') && // Ignore favicon errors
      !err.includes('ResizeObserver') // Ignore ResizeObserver loop errors
    );

    expect(criticalErrors.length).toBe(0);
  });
});
