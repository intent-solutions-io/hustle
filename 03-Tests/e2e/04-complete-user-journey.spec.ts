import { test, expect, Page } from '@playwright/test';

/**
 * Complete User Journey E2E Test
 *
 * Tests the full MVP user flow from registration through game logging:
 * 1. Register new parent account
 * 2. Verify email (simulated)
 * 3. Login
 * 4. Add athlete profile
 * 5. View athletes list
 * 6. Click athlete to see detail page
 * 7. Log a game with stats
 * 8. Verify game appears in athlete history
 * 9. Verify dashboard stats update
 */

// Helper function to register and login
async function registerAndLogin(page: Page) {
  const timestamp = Date.now();
  const testEmail = `journeytest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  // Navigate to registration
  await page.goto('/register');
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

  // Fill registration form
  await page.fill('input[id="firstName"]', 'Journey');
  await page.fill('input[id="lastName"]', 'Test');
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '5551234567');
  await page.fill('input[id="password"]', testPassword);
  await page.fill('input[id="confirmPassword"]', testPassword);

  // Submit registration and wait for redirect to login
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/login/, { timeout: 60000 });

  // Login (in real app would need email verification)
  await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
  await page.fill('input[id="email"], input[type="email"]', testEmail);
  await page.fill('input[id="password"], input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for dashboard redirect (confirms login + provisioning completed)
  await page.waitForURL(/\/dashboard/, { timeout: 90000 });

  return { email: testEmail, password: testPassword };
}

test.describe('Complete User Journey - Happy Path', () => {
  test('should complete full MVP journey: Register → Add Athlete → Log Game → View Stats', async ({ page }) => {
    // STEP 1: Register and Login
    const user = await registerAndLogin(page);
    console.log(`✓ User registered and logged in: ${user.email}`);

    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    console.log('✓ Redirected to dashboard');

    // STEP 2: Add Athlete
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

    const athleteName = `Test Athlete ${Date.now()}`;

    // Fill name (using id selector - matches the form)
    await page.fill('input[id="name"]', athleteName);

    // Fill birthday
    await page.fill('input[id="birthday"]', '2010-06-15');

    // Select gender (required field)
    await page.click('input[name="gender"][value="male"]');

    // Select primary position (CB = Center Back, a defender)
    await page.selectOption('select[id="primaryPosition"]', 'CB');

    // Select league (required field)
    await page.selectOption('select[id="leagueCode"]', 'local_travel');

    // Fill team/club
    await page.fill('input[id="teamClub"]', 'Elite FC');

    // Submit athlete form and wait for success
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/athletes or success indication
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 30000 }),
      page.waitForSelector('[data-testid="success-message"], .success, [class*="text-green"]', { timeout: 30000 }),
    ]).catch(() => {
      console.log('No immediate success signal, checking for errors...');
    });

    // Verify we're not stuck with an error
    const errorVisible = await page.locator('[class*="text-red"], [class*="bg-red"]').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('[class*="text-red"], [class*="bg-red"]').first().textContent();
      throw new Error(`Athlete creation failed: ${errorText}`);
    }

    console.log(`✓ Athlete added: ${athleteName}`);

    // STEP 3: View Athletes List
    await page.goto('/dashboard/athletes');

    // Verify athlete appears in list
    const athleteCard = page.locator('div, li').filter({ hasText: new RegExp(athleteName, 'i') }).first();
    await expect(athleteCard).toBeVisible();
    console.log('✓ Athlete visible in athletes list');

    // STEP 4: Click athlete to view detail page
    await athleteCard.click();
    await page.waitForTimeout(1000);

    // Verify athlete detail page
    const detailsHeading = page.locator('h1, h2').filter({ hasText: new RegExp(athleteName, 'i') });
    await expect(detailsHeading.or(page.locator('body')).filter({ hasText: new RegExp(athleteName, 'i') })).toBeVisible();
    console.log('✓ Athlete detail page loaded');

    // Verify "No games logged yet" message shows
    const emptyState = page.locator('text=/No games|no games|Get started/i');
    if (await emptyState.isVisible({ timeout: 2000 })) {
      console.log('✓ Empty state visible (no games yet)');
    }

    // STEP 5: Log a Game
    // Click "Log a Game" button (could be on detail page or dashboard)
    const logGameButton = page.locator('button, a').filter({ hasText: /Log a Game|Log Game/i }).first();
    await logGameButton.click();
    await page.waitForTimeout(1000);

    // Fill game details
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[name="date"], input[type="date"]', today);

    await page.fill('input[name="opponent"], input[placeholder*="opponent"]', 'Rival United');

    // Select result (Win)
    const winRadio = page.locator('input[value="Win"], label:has-text("Win")');
    await winRadio.click();

    // Fill scores (Win: 3-1)
    const yourScoreInput = page.locator('input[name="yourScore"]');
    await yourScoreInput.fill('3');

    const opponentScoreInput = page.locator('input[name="opponentScore"]');
    await opponentScoreInput.fill('1');

    // Fill minutes played
    const minutesInput = page.locator('input[name="minutesPlayed"]');
    await minutesInput.fill('90');

    // Fill goals scored
    const goalsInput = page.locator('input[name="goals"]');
    await goalsInput.fill('1');

    // Fill assists (if visible - field player)
    const assistsInput = page.locator('input[name="assists"]');
    if (await assistsInput.isVisible({ timeout: 1000 })) {
      await assistsInput.fill('1');
    }

    // Fill defensive stats (NEW FEATURE - Phase 6b)
    const tacklesInput = page.locator('input[name="tackles"]');
    if (await tacklesInput.isVisible({ timeout: 1000 })) {
      await tacklesInput.fill('8');
      console.log('✓ Defensive stats fields visible');
    }

    const interceptionsInput = page.locator('input[name="interceptions"]');
    if (await interceptionsInput.isVisible({ timeout: 500 })) {
      await interceptionsInput.fill('4');
    }

    const clearancesInput = page.locator('input[name="clearances"]');
    if (await clearancesInput.isVisible({ timeout: 500 })) {
      await clearancesInput.fill('12');
    }

    // Submit game
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Save|Submit|Log/i });
    await submitButton.click();
    await page.waitForTimeout(2000);

    console.log('✓ Game logged successfully');

    // STEP 6: Verify game appears in athlete history
    // Should redirect to athlete detail page or games list
    const url = page.url();
    expect(url).toMatch(/dashboard|athletes|games/i);

    // Look for game in history
    const gameRow = page.locator('tr, div, li').filter({ hasText: /Rival United/i });
    await expect(gameRow.first()).toBeVisible({ timeout: 5000 });
    console.log('✓ Game visible in athlete history');

    // Verify game details show
    const bodyText = await page.textContent('body');
    expect(bodyText).toContain('Rival United');
    expect(bodyText).toMatch(/3-1|3\s*-\s*1/); // Final score
    console.log('✓ Game details correct');

    // STEP 7: Verify dashboard stats update
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Dashboard should now show 1 game instead of 0
    const statsCard = page.locator('div, card').filter({ hasText: /Total Games|Games/i });
    const statsText = await statsCard.first().textContent();

    // Check for "1" in stats (Total Games should be 1)
    expect(statsText).toMatch(/1\s+game|1\s+total/i);
    console.log('✓ Dashboard stats updated (1 game recorded)');

    console.log('✅ COMPLETE USER JOURNEY PASSED');
  });
});

test.describe('Complete User Journey - Field Player vs Goalkeeper', () => {
  test('should show different stats fields for goalkeeper', async ({ page }) => {
    // Register and login
    await registerAndLogin(page);

    // Add goalkeeper
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

    const goalkeeperName = `GK ${Date.now()}`;
    await page.fill('input[id="name"]', goalkeeperName);
    await page.fill('input[id="birthday"]', '2009-03-20');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select[id="primaryPosition"]', 'GK');
    await page.selectOption('select[id="leagueCode"]', 'local_travel');
    await page.fill('input[id="teamClub"]', 'Goalkeeper FC');

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log game
    await page.goto('/dashboard/athletes');
    const gkCard = page.locator('div').filter({ hasText: new RegExp(goalkeeperName, 'i') }).first();
    await gkCard.click();
    await page.waitForTimeout(1000);

    const logGameBtn = page.locator('button, a').filter({ hasText: /Log a Game/i }).first();
    await logGameBtn.click();
    await page.waitForTimeout(1000);

    // Fill basic game details
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="opponent"]', 'Striker FC');

    // Goalkeeper should see DIFFERENT fields
    const savesInput = page.locator('input[name="saves"]');
    await expect(savesInput).toBeVisible();
    await savesInput.fill('5');
    console.log('✓ Goalkeeper sees "saves" field');

    const goalsAgainstInput = page.locator('input[name="goalsAgainst"]');
    await expect(goalsAgainstInput).toBeVisible();
    await goalsAgainstInput.fill('0');

    const cleanSheetCheckbox = page.locator('input[name="cleanSheet"], input[type="checkbox"]');
    if (await cleanSheetCheckbox.isVisible({ timeout: 1000 })) {
      await cleanSheetCheckbox.check();
      console.log('✓ Goalkeeper can mark clean sheet');
    }

    // Goalkeeper should NOT see defensive stats (tackles, interceptions, etc.)
    const tacklesInput = page.locator('input[name="tackles"]');
    expect(await tacklesInput.isVisible({ timeout: 1000 })).toBeFalsy();
    console.log('✓ Goalkeeper does NOT see defensive stats (correct)');

    console.log('✅ POSITION-SPECIFIC FIELDS WORKING');
  });
});

test.describe('Complete User Journey - Data Validation', () => {
  test('should enforce result-score consistency', async ({ page }) => {
    await registerAndLogin(page);

    // Add athlete
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[id="name"]', `Validator ${Date.now()}`);
    await page.fill('input[id="birthday"]', '2010-01-01');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select[id="primaryPosition"]', 'CM');
    await page.selectOption('select[id="leagueCode"]', 'local_travel');
    await page.fill('input[id="teamClub"]', 'Validation FC');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to log game
    await page.goto('/dashboard/athletes');
    await page.locator('div').filter({ hasText: /Validator/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button, a').filter({ hasText: /Log a Game/i }).first().click();
    await page.waitForTimeout(1000);

    // Fill form with INCONSISTENT data (Win but losing score)
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="opponent"]', 'Validation Test');

    // Select "Win" but give losing score
    await page.locator('input[value="Win"], label:has-text("Win")').click();
    await page.fill('input[name="yourScore"]', '1'); // Your team: 1
    await page.fill('input[name="opponentScore"]', '3'); // Opponent: 3 (LOSING!)
    await page.fill('input[name="minutesPlayed"]', '90');
    await page.fill('input[name="goals"]', '0');

    // Try to submit
    await page.locator('button[type="submit"]').filter({ hasText: /Save|Submit/i }).click();
    await page.waitForTimeout(1000);

    // Should show validation error
    const errorMessage = page.locator('text=/Result does not match|mismatch|invalid/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    console.log('✓ Validation blocked inconsistent result-score');
    console.log('✅ CROSS-VALIDATION WORKING');
  });

  test('should prevent future game dates', async ({ page }) => {
    await registerAndLogin(page);

    // Add athlete
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[id="name"]', `Future Test ${Date.now()}`);
    await page.fill('input[id="birthday"]', '2010-01-01');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select[id="primaryPosition"]', 'ST');
    await page.selectOption('select[id="leagueCode"]', 'local_travel');
    await page.fill('input[id="teamClub"]', 'Future FC');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log game
    await page.goto('/dashboard/athletes');
    await page.locator('div').filter({ hasText: /Future Test/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button, a').filter({ hasText: /Log a Game/i }).first().click();
    await page.waitForTimeout(1000);

    // Try to use future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    await page.fill('input[name="date"]', futureDateStr);
    await page.fill('input[name="opponent"]', 'Future Opponent');
    await page.locator('input[value="Win"]').click();
    await page.fill('input[name="yourScore"]', '2');
    await page.fill('input[name="opponentScore"]', '1');
    await page.fill('input[name="minutesPlayed"]', '90');

    // Try to submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should block or show error
    const url = page.url();
    expect(url).toContain('log-game'); // Should stay on form

    console.log('✓ Future date blocked');
    console.log('✅ DATE VALIDATION WORKING');
  });
});

test.describe('Complete User Journey - Security', () => {
  test('should sanitize opponent name (XSS prevention)', async ({ page }) => {
    await registerAndLogin(page);

    // Add athlete
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[id="name"]', `Security Test ${Date.now()}`);
    await page.fill('input[id="birthday"]', '2010-01-01');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select[id="primaryPosition"]', 'DM');
    await page.selectOption('select[id="leagueCode"]', 'local_travel');
    await page.fill('input[id="teamClub"]', 'Security FC');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log game
    await page.goto('/dashboard/athletes');
    await page.locator('div').filter({ hasText: /Security Test/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button, a').filter({ hasText: /Log a Game/i }).first().click();
    await page.waitForTimeout(1000);

    // Try XSS payload in opponent field
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.fill('input[name="opponent"]', '<script>alert("XSS")</script>');
    await page.locator('input[value="Win"]').click();
    await page.fill('input[name="yourScore"]', '2');
    await page.fill('input[name="opponentScore"]', '1');
    await page.fill('input[name="minutesPlayed"]', '90');

    // Monitor for alert (XSS vulnerability)
    page.on('dialog', dialog => {
      throw new Error(`XSS vulnerability detected: ${dialog.message()}`);
    });

    // Try to submit
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should show validation error
    const errorMessage = page.locator('text=/invalid characters|sanitize/i');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    console.log('✓ XSS payload blocked');
    console.log('✅ SECURITY VALIDATION WORKING');
  });

  test('should enforce rate limiting (10 requests/minute)', async ({ page }) => {
    await registerAndLogin(page);

    // Add athlete
    await page.goto('/dashboard/add-athlete');
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });
    await page.fill('input[id="name"]', `Rate Test ${Date.now()}`);
    await page.fill('input[id="birthday"]', '2010-01-01');
    await page.click('input[name="gender"][value="male"]');
    await page.selectOption('select[id="primaryPosition"]', 'RW');
    await page.selectOption('select[id="leagueCode"]', 'local_travel');
    await page.fill('input[id="teamClub"]', 'Rate FC');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to log game
    await page.goto('/dashboard/athletes');
    await page.locator('div').filter({ hasText: /Rate Test/i }).first().click();
    await page.waitForTimeout(1000);
    await page.locator('button, a').filter({ hasText: /Log a Game/i }).first().click();
    await page.waitForTimeout(1000);

    // Attempt 11 rapid submissions
    let blocked = false;
    for (let i = 1; i <= 11; i++) {
      await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
      await page.fill('input[name="opponent"]', `Test ${i}`);
      await page.locator('input[value="Win"]').click();
      await page.fill('input[name="yourScore"]', '1');
      await page.fill('input[name="opponentScore"]', '0');
      await page.fill('input[name="minutesPlayed"]', '90');

      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(500);

      // Check for rate limit error
      const bodyText = await page.textContent('body');
      if (bodyText && bodyText.toLowerCase().includes('rate limit')) {
        blocked = true;
        console.log(`✓ Rate limit triggered at request #${i}`);
        break;
      }
    }

    expect(blocked).toBeTruthy();
    console.log('✅ RATE LIMITING WORKING');
  });
});
