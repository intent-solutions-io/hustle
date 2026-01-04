/**
 * Global Setup for E2E Tests
 *
 * Creates authenticated state that can be reused across all tests.
 * Uses a dedicated E2E test account to avoid Firebase rate limiting.
 */

import { chromium, FullConfig, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Dedicated E2E test account credentials
// Load from environment variables with fallback defaults for local development
export const E2E_TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-hustle-test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'E2ETestPassword123!',
  firstName: 'E2E',
  lastName: 'Tester',
  phone: '5551234567',
};

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:4000';

  console.log('\n🔐 Global Setup: Creating authenticated state...');
  console.log(`   Base URL: ${baseURL}`);
  console.log(`   Test User: ${E2E_TEST_USER.email}\n`);

  // Ensure auth directory exists
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging for debugging
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('[Login]') || msg.text().includes('[signIn]')) {
      console.log(`   [Browser] ${msg.text()}`);
    }
  });

  try {
    // Try to login first (account may already exist)
    console.log('   Attempting login with existing account...');

    const loginSuccess = await attemptLogin(page, baseURL);

    if (loginSuccess) {
      console.log('   ✓ Login successful!\n');
      await context.storageState({ path: AUTH_FILE });
      console.log(`   ✓ Auth state saved to ${AUTH_FILE}\n`);
    } else {
      // Need to create account
      console.log('   Login failed - creating new test account...');
      await createTestAccount(page, baseURL);

      // Wait a bit for Firebase to sync the account
      console.log('   Waiting for account to propagate...');
      await page.waitForTimeout(3000);

      // Try login again after registration
      console.log('   Attempting login after registration...');
      const retrySuccess = await attemptLogin(page, baseURL);

      if (retrySuccess) {
        console.log('   ✓ Login successful after registration!\n');
        await context.storageState({ path: AUTH_FILE });
        console.log(`   ✓ Auth state saved to ${AUTH_FILE}\n`);
      } else {
        // Take screenshot and get page content for debugging
        await page.screenshot({ path: './03-Tests/e2e/.auth/login-failed.png' });
        const pageContent = await page.locator('body').textContent();
        console.error('   ❌ Login still failing after registration');
        console.error('   Page URL:', page.url());
        console.error('   Page content (first 500 chars):', pageContent?.slice(0, 500));
        throw new Error('Could not log in after registration. Check screenshots.');
      }
    }

    // Ensure we have an athlete for testing
    await ensureTestAthlete(page, baseURL);

  } catch (error: any) {
    console.error('\n❌ Global setup failed:', error.message);

    // Take screenshot for debugging
    await page.screenshot({ path: './03-Tests/e2e/.auth/setup-failure.png' });

    // Create empty auth file to prevent crash
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));

    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup complete!\n');
}

/**
 * Attempt login and return true if successful
 */
async function attemptLogin(page: Page, baseURL: string): Promise<boolean> {
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for form to be ready
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

  // Fill login form with robust method
  await fillInputRobust(page, 'input[id="email"]', E2E_TEST_USER.email);
  await fillInputRobust(page, 'input[id="password"]', E2E_TEST_USER.password);

  console.log('   Submitting login form...');

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for dashboard redirect - this is the primary success signal
  // Using a simpler approach: just wait for the URL to change to dashboard
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 90000 });
    console.log('   Login result: dashboard redirect detected');

    // Extra wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');

    // Verify we're actually on dashboard (not redirected to login)
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      console.log('   ✓ Successfully on dashboard:', currentUrl);
      return true;
    } else {
      console.log('   ✗ Unexpected URL after login:', currentUrl);
      return false;
    }
  } catch (e: any) {
    console.log(`   Login wait error: ${e.message}`);

    // Check if we're on the login page with an error
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    // Check for error messages on login page
    if (currentUrl.includes('/login')) {
      const errorElement = page.locator('[class*="bg-red-50"]').first();
      if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorElement.textContent().catch(() => '');
        console.log('   Login error:', errorText);
      }
    }

    return false;
  }
}

/**
 * Robust input filling that handles React controlled inputs
 */
async function fillInputRobust(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);

  // Wait for input to be visible
  await input.waitFor({ state: 'visible', timeout: 10000 });

  // Clear and focus
  await input.click();
  await input.clear();

  // Try fill() first (works for most inputs)
  await input.fill(value);

  // Verify the value was set
  const actualValue = await input.inputValue();
  if (actualValue !== value) {
    // Fallback to pressSequentially for stubborn React inputs
    await input.clear();
    await input.pressSequentially(value, { delay: 30 });
  }

  // Small delay for React state
  await page.waitForTimeout(100);
}

/**
 * Create a new test account via registration
 */
async function createTestAccount(page: Page, baseURL: string): Promise<void> {
  console.log('   Creating new test account...');

  await page.goto(`${baseURL}/register`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

  // Wait for form to stabilize
  await page.waitForTimeout(1000);

  // Fill registration form
  await fillInputRobust(page, 'input[id="firstName"]', E2E_TEST_USER.firstName);
  await fillInputRobust(page, 'input[id="lastName"]', E2E_TEST_USER.lastName);
  await fillInputRobust(page, 'input[id="email"]', E2E_TEST_USER.email);
  await fillInputRobust(page, 'input[id="phone"]', E2E_TEST_USER.phone);
  await fillInputRobust(page, 'input[id="password"]', E2E_TEST_USER.password);
  await fillInputRobust(page, 'input[id="confirmPassword"]', E2E_TEST_USER.password);

  // Check required checkboxes
  const termsCheckbox = page.locator('input[name="agreedToTerms"], input[id="agreedToTerms"]');
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check();
  }

  const privacyCheckbox = page.locator('input[name="agreedToPrivacy"], input[id="agreedToPrivacy"]');
  if (await privacyCheckbox.isVisible()) {
    await privacyCheckbox.check();
  }

  const parentCheckbox = page.locator('input[name="isParentGuardian"], input[id="isParentGuardian"]');
  if (await parentCheckbox.isVisible()) {
    await parentCheckbox.check();
  }

  // Small delay before submit
  await page.waitForTimeout(500);

  console.log('   Submitting registration form...');

  // Submit registration
  await page.click('button[type="submit"]');

  // Wait for redirect to login (registration success) or stay on page (error)
  try {
    await page.waitForURL(/\/login/, { timeout: 90000 });
    console.log('   ✓ Test account created\n');
  } catch {
    // Check if there's an error on the page
    const errorText = await page.locator('[class*="bg-red"], [class*="text-red"]').textContent().catch(() => '');
    console.log('   Registration may have failed. Error:', errorText || 'none visible');
    console.log('   Current URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: './03-Tests/e2e/.auth/registration-issue.png' });

    // If we're still on register page but account might exist (email already in use)
    const errorLower = (errorText || '').toLowerCase();
    if (errorLower.includes('already') || errorLower.includes('exists')) {
      console.log('   Account may already exist, proceeding to login...');
      return;
    }

    throw new Error(`Registration failed: ${errorText || 'timeout'}`);
  }
}

/**
 * Ensure test athlete exists for Dream Gym tests
 */
async function ensureTestAthlete(page: Page, baseURL: string): Promise<void> {
  console.log('   Checking for test athlete...');

  // Navigate to athletes page
  await page.goto(`${baseURL}/dashboard/athletes`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  // Check if any athlete exists
  const athleteCard = page.locator('a[href*="/athletes/"], [data-testid="athlete-card"]').first();

  if (await athleteCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('   ✓ Test athlete already exists\n');
    return;
  }

  // Create test athlete
  console.log('   Creating test athlete...');

  await page.goto(`${baseURL}/dashboard/add-athlete`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

  // Fill athlete form
  await fillInputRobust(page, 'input[id="name"]', 'E2E Test Athlete');

  // Date input works with fill()
  await page.locator('input[id="birthday"]').fill('2012-06-15');

  // Select gender
  await page.locator('input[name="gender"][value="male"]').click();

  // Select position
  await page.locator('select[id="primaryPosition"]').selectOption('CM');

  // Select league (local_travel is a valid LeagueCode option)
  await page.locator('select[id="leagueCode"]').selectOption('local_travel');

  // Fill team
  await fillInputRobust(page, 'input[id="teamClub"]', 'E2E Test FC');

  await page.waitForTimeout(500);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  console.log('   ✓ Test athlete created\n');
}

export default globalSetup;
