import { test, expect } from '@playwright/test';

test.describe('Login and Health Check', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Hustle|Login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Visual regression: capture login page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      mask: [page.locator('[data-testid="timestamp"]')], // Mask dynamic content if any
    });
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // HTML5 validation will prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should access healthcheck endpoint', async ({ request }) => {
    const response = await request.get('/api/healthcheck');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });
});
