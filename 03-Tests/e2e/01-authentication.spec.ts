import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 *
 * Tests user registration, login, logout, and session management
 */

test.describe('Authentication Flow', () => {

  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title contains "Hustle"
    await expect(page).toHaveTitle(/Hustle/i);

    // Check landing page has main heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    // Check for email and password fields
    await expect(page.locator('input[id="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"], input[type="password"]')).toBeVisible();

    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for empty login form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors or stay on login page
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.fill('input[id="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[id="password"], input[type="password"]', 'wrongpassword');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should show error or stay on login page
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should allow user registration', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for testing
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    // Fill registration form
    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');

    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForTimeout(3000);

    // Should redirect to login or dashboard
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)/);
  });

  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // First, create a test account
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';

    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for registration to complete
    await page.waitForTimeout(2000);

    // Now test login
    await page.goto('/login');

    await page.fill('input[id="email"], input[type="email"]', testEmail);
    await page.fill('input[id="password"], input[type="password"]', testPassword);

    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    // Should be on dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should allow logout', async ({ page, context }) => {
    // First login
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `logouttest${timestamp}@example.com`;

    await page.fill('input[id="firstName"]', 'Logout');
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    await page.goto('/login');
    await page.fill('input[id="email"], input[type="email"]', testEmail);
    await page.fill('input[id="password"], input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should be logged in
    expect(page.url()).toContain('/dashboard');

    // Find and click logout button (might be in user menu)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Wait for redirect
      await page.waitForTimeout(2000);

      // Should redirect to home or login
      const url = page.url();
      expect(url).toMatch(/\/(login|^\/.*$)/);
    }
  });

  test('should maintain session after page refresh', async ({ page }) => {
    // Login
    await page.goto('/register');

    const timestamp = Date.now();
    const testEmail = `sessiontest${timestamp}@example.com`;

    await page.fill('input[id="firstName"]', 'Session');
    await page.fill('input[id="lastName"]', 'Test');
    await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    await page.goto('/login');
    await page.fill('input[id="email"], input[type="email"]', testEmail);
    await page.fill('input[id="password"], input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Refresh page
    await page.reload();

    await page.waitForTimeout(1000);

    // Should still be on dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });
});

test.describe('Registration Validation', () => {

  test('should reject weak passwords', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[id="firstName"]', 'Test');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="phone"]', '1234567890');

    const weakPasswords = ['123', 'password', 'abc', '12345678'];

    for (const weakPassword of weakPasswords) {
      await page.fill('input[id="password"]', weakPassword);
      await page.fill('input[id="confirmPassword"]', weakPassword);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show error or stay on registration page
      const url = page.url();
      expect(url).toContain('/register');
    }
  });

  test('should reject invalid email formats', async ({ page }) => {
    await page.goto('/register');

    const invalidEmails = [
      'notanemail',
      '@example.com',
      'test@',
      'test..test@example.com'
    ];

    for (const invalidEmail of invalidEmails) {
      await page.fill('input[id="firstName"]', 'Test');
      await page.fill('input[id="lastName"]', 'User');
      await page.fill('input[id="email"]', invalidEmail);
  await page.fill('input[id="phone"]', '1234567890');
      await page.fill('input[id="password"]', 'TestPassword123!');
      await page.fill('input[id="confirmPassword"]', 'TestPassword123!');

      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show validation error or stay on page
      const url = page.url();
      expect(url).toContain('/register');
    }
  });

  test('should reject duplicate email registration', async ({ page }) => {
    const timestamp = Date.now();
    const duplicateEmail = `duplicate${timestamp}@example.com`;

    // Register first time
    await page.goto('/register');
    await page.fill('input[id="firstName"]', 'First');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', duplicateEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Try to register again with same email
    await page.goto('/register');
    await page.fill('input[id="firstName"]', 'Second');
    await page.fill('input[id="lastName"]', 'User');
    await page.fill('input[id="email"]', duplicateEmail);
  await page.fill('input[id="phone"]', '1234567890');
    await page.fill('input[id="password"]', 'TestPassword123!');
    await page.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should show error or stay on registration page
    const url = page.url();
    expect(url).toContain('/register');
  });
});
