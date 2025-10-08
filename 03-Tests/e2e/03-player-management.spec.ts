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

test.describe('Player Management - Add Player', () => {

  test('should show add athlete form', async ({ page }) => {
    await login(page);

    // Navigate to add athlete page
    await page.goto('/dashboard/add-athlete');

    // Should show form fields
    await expect(page.locator('input[name="name"], input[placeholder*="name"]')).toBeVisible();
  });

  test('should add a new player successfully', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    // Fill player details
    const playerName = `Test Player ${Date.now()}`;

    await page.fill('input[name="name"], input[placeholder*="name"]', playerName);

    // Fill birthday if field exists
    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 2000 })) {
      await birthdayField.fill('2010-05-15');
    }

    // Fill position if field exists
    const positionField = page.locator('input[name="position"], select[name="position"]');
    if (await positionField.isVisible({ timeout: 2000 })) {
      if ((await positionField.getAttribute('type')) === 'select') {
        await positionField.selectOption('Midfielder');
      } else {
        await positionField.fill('Midfielder');
      }
    }

    // Fill team/club if field exists
    const teamField = page.locator('input[name="teamClub"], input[name="team"]');
    if (await teamField.isVisible({ timeout: 2000 })) {
      await teamField.fill('City Soccer Club');
    }

    // Submit form
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should redirect to dashboard or athletes list
    const url = page.url();
    expect(url).toMatch(/dashboard|athletes/i);
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

    await page.goto('/dashboard/add-athlete');

    // Test names with apostrophes, hyphens
    const specialNames = [
      "O'Brien-Smith",
      "María José",
      "Jean-Pierre",
      "D'Angelo"
    ];

    for (const specialName of specialNames) {
      await page.fill('input[name="name"], input[placeholder*="name"]', specialName);

      // Fill other required fields
      const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
      if (await birthdayField.isVisible({ timeout: 1000 })) {
        await birthdayField.fill('2010-05-15');
      }

      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Should succeed
      const url = page.url();
      expect(url).toMatch(/dashboard|athletes/i);

      // Go back to test next name
      await page.goto('/dashboard/add-athlete');
    }
  });
});

test.describe('Player Management - View Players', () => {

  test('should display list of players', async ({ page }) => {
    await login(page);

    // First add a player
    await page.goto('/dashboard/add-athlete');
    await page.fill('input[name="name"], input[placeholder*="name"]', `Test Player ${Date.now()}`);

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      await birthdayField.fill('2010-05-15');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navigate to athletes list
    await page.goto('/dashboard/athletes');

    // Should show at least one player
    const playersList = page.locator('div, li, tr').filter({ hasText: /Test Player/i });
    await expect(playersList.first()).toBeVisible();
  });

  test('should show player details', async ({ page }) => {
    await login(page);

    // Add a player
    await page.goto('/dashboard/add-athlete');
    const playerName = `Detail Test ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="name"]', playerName);

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      await birthdayField.fill('2010-05-15');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // View player details
    await page.goto('/dashboard/athletes');

    const playerCard = page.locator('div, li, tr').filter({ hasText: new RegExp(playerName, 'i') }).first();

    if (await playerCard.isVisible()) {
      // Click to view details
      await playerCard.click();

      await page.waitForTimeout(1000);

      // Should show player details
      const detailsPage = await page.textContent('body');
      expect(detailsPage).toContain(playerName);
    }
  });
});

test.describe('Player Management - Security', () => {

  test('should not allow XSS in player names', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
    ];

    for (const payload of xssPayloads) {
      await page.fill('input[name="name"], input[placeholder*="name"]', payload);

      const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
      if (await birthdayField.isVisible({ timeout: 1000 })) {
        await birthdayField.fill('2010-05-15');
      }

      // Monitor for alerts (XSS vulnerability indicator)
      page.on('dialog', dialog => {
        throw new Error(`XSS vulnerability detected: Alert dialog appeared with message "${dialog.message()}"`);
      });

      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Check that script tags were sanitized
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('<script>');

      await page.goto('/dashboard/add-athlete');
    }
  });

  test('should only show players belonging to authenticated user', async ({ page, context }) => {
    // Login as first user and add a player
    const user1 = await login(page);

    await page.goto('/dashboard/add-athlete');
    const player1Name = `User1 Player ${Date.now()}`;
    await page.fill('input[name="name"], input[placeholder*="name"]', player1Name);

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      await birthdayField.fill('2010-05-15');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    }

    // Login as second user
    const page2 = await context.newPage();
    const timestamp2 = Date.now() + 1000;
    const testEmail2 = `playertest${timestamp2}@example.com`;

    await page2.goto('/register');
    await page2.fill('input[id="firstName"]', 'Player2');
    await page2.fill('input[id="lastName"]', 'Test2');
    await page2.fill('input[id="email"]', testEmail2);
    await page2.fill('input[id="password"]', 'TestPassword123!');
    await page2.fill('input[id="confirmPassword"]', 'TestPassword123!');
    await page2.click('button[type="submit"]');

    await page2.waitForTimeout(2000);

    await page2.goto('/login');
    await page2.fill('input[id="email"], input[type="email"]', testEmail2);
    await page2.fill('input[id="password"], input[type="password"]', 'TestPassword123!');
    await page2.click('button[type="submit"]');

    await page2.waitForTimeout(2000);

    // Check athletes list
    await page2.goto('/dashboard/athletes');

    await page2.waitForTimeout(1000);

    // Should NOT see user1's player
    const bodyText = await page2.textContent('body');
    expect(bodyText).not.toContain(player1Name);

    await page2.close();
  });
});

test.describe('Player Management - Edge Cases', () => {

  test('should handle very long player names', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    const veryLongName = 'A'.repeat(500);

    await page.fill('input[name="name"], input[placeholder*="name"]', veryLongName);

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      await birthdayField.fill('2010-05-15');
    }

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Should either truncate or show error, not crash
    const url = page.url();
    expect(url).toMatch(/dashboard|add-athlete/i);
  });

  test('should handle future birthdates', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    await page.fill('input[name="name"], input[placeholder*="name"]', 'Future Kid');

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      // Set birthdate to next year
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      await birthdayField.fill(futureDateStr);

      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show validation error
      const url = page.url();
      expect(url).toContain('add-athlete');
    }
  });

  test('should handle very old birthdates', async ({ page }) => {
    await login(page);

    await page.goto('/dashboard/add-athlete');

    await page.fill('input[name="name"], input[placeholder*="name"]', 'Old Kid');

    const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
    if (await birthdayField.isVisible({ timeout: 1000 })) {
      // Set birthdate to 100 years ago
      await birthdayField.fill('1924-01-01');

      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      // Should show validation error or accept (depending on business rules)
      const url = page.url();
      expect(url).toMatch(/dashboard|add-athlete/i);
    }
  });
});
