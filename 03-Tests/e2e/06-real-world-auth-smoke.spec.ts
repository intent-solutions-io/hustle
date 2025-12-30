import { test, expect } from '@playwright/test';

const email = process.env.SMOKE_TEST_EMAIL;
const password = process.env.SMOKE_TEST_PASSWORD;

test.describe('Real-World Auth Smoke', () => {
  test.skip(!email || !password, 'Set SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD to run.');

  test('should login, create athlete, reach Dream Gym, delete athlete, and logout', async ({ page }) => {
    const athleteName = `Smoke Athlete ${Date.now()}`;

    await page.goto('/login');

    await page.fill('input[id="email"], input[type="email"]', email!);
    await page.fill('input[id="password"], input[type="password"]', password!);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // Session should persist across refresh (server session cookie)
    await page.reload();
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // Create an athlete (exercises /api/players/create + Firestore writes)
    await page.goto('/dashboard/add-athlete');
    await page.fill('input#name', athleteName);
    await page.fill('input#birthday', '2012-01-01');
    await page.check('input[name="gender"][value="male"]');
    await page.selectOption('select#primaryPosition', 'GK');
    await page.selectOption('select#leagueCode', 'ecnl_boys');
    await page.fill('input#teamClub', 'Hustle FC');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });

    // Athlete should appear in Athletes list (server-rendered)
    await page.goto('/dashboard/athletes');
    await expect(page.getByText(athleteName)).toBeVisible();
    await page.locator('a', { hasText: athleteName }).first().click();
    await page.waitForURL(/\/dashboard\/athletes\/[^/]+$/, { timeout: 30_000 });
    const athleteId = page.url().split('/').pop()!;

    // Dream Gym should be reachable (implementation sanity check)
    await page.goto(`/dashboard/dream-gym?playerId=${encodeURIComponent(athleteId)}`);
    await expect(page.getByText('Dream Gym')).toBeVisible();
    await expect(page.getByText(`Set Up ${athleteName}`)).toBeVisible();

    // Clean up: delete the athlete we created
    await page.goto(`/dashboard/athletes/${encodeURIComponent(athleteId)}`);
    await expect(page.getByText(athleteName)).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: /delete permanently/i }).click();
    await page.waitForURL(/\/dashboard\/athletes/, { timeout: 30_000 });
    await expect(page.getByText(athleteName)).toHaveCount(0);

    // Logout should clear session and return user to home
    await page.getByRole('button', { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
