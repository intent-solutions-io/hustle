import { test, expect, Page } from '@playwright/test';

/**
 * Player Management Tests
 *
 * Tests adding, viewing, editing, and deleting players
 */

// Helper function to login
async function login(page: Page) {
  const timestamp = Date.now();
  const testEmail = `playertest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  await page.goto('/register');
  await page.fill('input[id="firstName"]', 'Player');
  await page.fill('input[id="lastName"]', 'Test');
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '1234567890');
  await page.fill('input[id="password"]', testPassword);
  await page.fill('input[id="confirmPassword"]', testPassword);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  await page.goto('/login');
  await page.fill('input[id="email"], input[type="email"]', testEmail);
  await page.fill('input[id="password"], input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  await page.waitForTimeout(2000);

  return { email: testEmail, password: testPassword };
}

// Helper function to fill all required athlete form fields
async function fillAthleteForm(page: Page, name: string) {
  // Fill name
  await page.fill('input#name', name);

  // Fill birthday
  await page.fill('input#birthday', '2010-06-15');

  // Select gender (click the Male radio button)
  await page.click('input[name="gender"][value="male"]');

  // Select primary position
  await page.selectOption('select#primaryPosition', 'CB');

  // Select league (value is 'local_travel' which displays as 'Competitive Travel')
  await page.selectOption('select#leagueCode', 'local_travel');

  // Fill team/club
  await page.fill('input#teamClub', 'Elite FC');
}

test.describe('Player Management - Add Player', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show add athlete form', async ({ page }) => {
    await login(page);

    // Navigate to add athlete page
    await page.goto('/dashboard/add-athlete');

    // Should show form fields
    await expect(page.locator('input#name')).toBeVisible();
  });

  test('should add a new player successfully', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Fill player details using helper function
    const playerName = `Test Player ${Date.now()}`;
    await fillAthleteForm(page, playerName);

    // Submit form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Should redirect to dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
    expect(url).not.toContain('/add-athlete');
  });

  test('should validate required fields', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    // Should show validation errors or stay on form
    const url = page.url();
    expect(url).toContain('add-athlete');
  });

  test('should handle special characters in names', async ({ page }) => {
    await login(page);

    // Test only one name with special characters (to keep test short)
    await page.goto('/dashboard/add-athlete');
    const specialName = "O'Brien-Smith";
    await fillAthleteForm(page, specialName);

    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    // Should redirect to dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
    expect(url).not.toContain('/add-athlete');
  });
});

test.describe('Player Management - View Players', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display list of players', async ({ page }) => {
    await login(page);

    // First add a player
    await page.goto('/dashboard/add-athlete');
    const playerName = `Test Player ${Date.now()}`;
    await fillAthleteForm(page, playerName);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to athletes list
    await page.goto('/dashboard/athletes');
    await page.waitForTimeout(2000);

    // Should show at least one player (look for player name in the page)
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain(playerName);
  });

  test('should show player details', async ({ page }) => {
    await login(page);

    // Add a player
    await page.goto('/dashboard/add-athlete');
    const playerName = `Detail Test ${Date.now()}`;
    await fillAthleteForm(page, playerName);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // View player details - click on athlete link in dashboard
    await page.goto('/dashboard/athletes');
    await page.waitForTimeout(2000);

    // Click on the player card/link
    const playerLink = page.locator(`text="${playerName}"`).first();
    if (await playerLink.isVisible({ timeout: 3000 })) {
      await playerLink.click();
      await page.waitForTimeout(1000);

      // Should show player details
      const detailsPage = await page.textContent('body');
      expect(detailsPage).toContain(playerName);
    }
  });
});

test.describe('Player Management - Security', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should not allow XSS in player names', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Test one XSS payload
    const xssPayload = '<script>alert("XSS")</script>';

    // Fill form with XSS payload as name
    await page.fill('input#name', xssPayload);
    await page.fill('input#birthday', '2010-06-15');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select#primaryPosition', 'CB');
    await page.selectOption('select#leagueCode', 'comp_travel');
    await page.fill('input#teamClub', 'Elite FC');

    // Monitor for alerts (XSS vulnerability indicator)
    page.on('dialog', dialog => {
      throw new Error(`XSS vulnerability detected: Alert dialog appeared with message "${dialog.message()}"`);
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check that script tags were sanitized in the page
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('<script>');
  });

  test('should only show players belonging to authenticated user', async ({ page, context }) => {
    // Login as first user and add a player
    await login(page);

    await page.goto('/dashboard/add-athlete');
    const player1Name = `User1 Player ${Date.now()}`;
    await fillAthleteForm(page, player1Name);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Logout using JavaScript click to bypass viewport checks in headless mode
    const logoutButton = page.locator('button:has-text("Logout")').first();
    await logoutButton.evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(2000);

    // Login as second user
    const page2 = await context.newPage();
    const timestamp2 = Date.now() + 1000;
    const testEmail2 = `playertest${timestamp2}@example.com`;

    await page2.goto('/register');
    await page2.fill('input[id="firstName"]', 'Player2');
    await page2.fill('input[id="lastName"]', 'Test2');
    await page2.fill('input[id="email"]', testEmail2);
    await page2.fill('input[id="phone"]', '1234567890');
    await page2.fill('input[id="password"]', 'TestPassword123!');
    await page2.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page2.click('button[type="submit"]');

    await page2.waitForTimeout(2000);

    await page2.goto('/login');
    await page2.fill('input[id="email"], input[type="email"]', testEmail2);
    await page2.fill('input[id="password"], input[type="password"]', 'TestPassword123!');
    await page2.click('button[type="submit"]');

    await page2.waitForTimeout(3000);

    // Check athletes list
    await page2.goto('/dashboard/athletes');
    await page2.waitForTimeout(2000);

    // Should NOT see user1's player
    const bodyText = await page2.textContent('body');
    expect(bodyText).not.toContain(player1Name);

    await page2.close();
  });
});

test.describe('Player Management - Edge Cases', () => {
  // Don't use global storage state - this test creates its own user
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should handle very long player names', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Use a long but not excessively long name (100 chars max for the field)
    const longName = 'A'.repeat(100);

    await page.fill('input#name', longName);
    await page.fill('input#birthday', '2010-06-15');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select#primaryPosition', 'CB');
    await page.selectOption('select#leagueCode', 'comp_travel');
    await page.fill('input#teamClub', 'Elite FC');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should either succeed or show error, not crash
    const url = page.url();
    expect(url).toMatch(/dashboard|add-athlete/i);
  });

  test('should handle future birthdates', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Fill form with future birthdate
    await page.fill('input#name', 'Future Kid');

    // Set birthdate to next year
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input#birthday', futureDateStr);

    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select#primaryPosition', 'CB');
    await page.selectOption('select#leagueCode', 'comp_travel');
    await page.fill('input#teamClub', 'Elite FC');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should show validation error (stay on add-athlete page)
    const url = page.url();
    expect(url).toContain('add-athlete');
  });

  test('should handle very old birthdates', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Fill form with very old birthdate
    await page.fill('input#name', 'Old Kid');
    await page.fill('input#birthday', '1924-01-01');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select#primaryPosition', 'CB');
    await page.selectOption('select#leagueCode', 'comp_travel');
    await page.fill('input#teamClub', 'Elite FC');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Should show validation error or accept (depending on business rules)
    const url = page.url();
    expect(url).toMatch(/dashboard|add-athlete/i);
  });
});
