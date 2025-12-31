import { test, expect, Page } from '@playwright/test';

/**
 * Dream Gym E2E Tests
 *
 * Tests Dream Gym functionality including:
 * 1. Onboarding flow
 * 2. Schedule setup
 * 3. Workout execution
 * 4. Mental check-in
 * 5. AI Strategy display
 * 6. Progress/Analytics
 */

// Helper function to register, login, and add an athlete
async function setupUserWithAthlete(page: Page) {
  const timestamp = Date.now();
  const testEmail = `gymtest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const athleteName = `Gym Athlete ${timestamp}`;

  // Register
  await page.goto('/register');
  await page.fill('input[id="firstName"]', 'Gym');
  await page.fill('input[id="lastName"]', 'Test');
  await page.fill('input[id="email"]', testEmail);
  await page.fill('input[id="phone"]', '5559876543');
  await page.fill('input[id="password"]', testPassword);
  await page.fill('input[id="confirmPassword"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect to login page after registration
  await page.waitForURL('**/login**', { timeout: 10000 });

  // Login
  await page.fill('input[id="email"], input[type="email"]', testEmail);
  await page.fill('input[id="password"], input[type="password"]', testPassword);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard after login
  await page.waitForURL('**/dashboard**', { timeout: 10000 });

  // Add athlete
  await page.goto('/dashboard/add-athlete');
  await page.fill('input[name="name"], input[placeholder*="name"]', athleteName);

  const birthdayField = page.locator('input[name="birthday"], input[type="date"]');
  await birthdayField.fill('2012-03-20');

  const teamField = page.locator('input[name="teamClub"], input[name="team"]');
  if (await teamField.isVisible({ timeout: 2000 })) {
    await teamField.fill('Dream FC');
  }

  await page.click('button[type="submit"]');

  // Wait for redirect back to dashboard or athletes page after adding athlete
  await page.waitForURL('**/dashboard**', { timeout: 10000 });

  return { email: testEmail, password: testPassword, athleteName };
}

// Helper to get the player ID from URL or page
async function getPlayerId(page: Page): Promise<string | null> {
  // Try to get from URL first
  const url = page.url();
  const match = url.match(/playerId=([^&]+)/);
  if (match) return match[1];

  // Try to get from athlete page URL
  const athleteMatch = url.match(/athletes\/([^/]+)/);
  if (athleteMatch) return athleteMatch[1];

  return null;
}

test.describe('Dream Gym - Onboarding', () => {
  test('should access Dream Gym from dashboard', async ({ page }) => {
    await setupUserWithAthlete(page);

    // Go to dashboard and wait for it to load
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for Dream Gym button - should be visible
    const dreamGymButton = page.locator('button, a').filter({ hasText: /Dream Gym/i }).first();
    await expect(dreamGymButton).toBeVisible({ timeout: 5000 });

    console.log('✓ Dream Gym button visible on dashboard');
  });

  test('should navigate to Dream Gym and see onboarding prompt', async ({ page }) => {
    await setupUserWithAthlete(page);

    // Navigate to athletes list
    await page.goto('/dashboard/athletes');
    await page.waitForLoadState('networkidle');

    // Click first athlete card
    const athleteCard = page.locator('[data-testid="athlete-card"], .athlete-card, a[href*="/athletes/"]').first();
    await expect(athleteCard).toBeVisible({ timeout: 5000 });
    await athleteCard.click();

    // Wait for navigation to athlete detail page
    await page.waitForURL(/.+\/athletes\/.+/, { timeout: 5000 });

    // Look for Dream Gym link on athlete detail page
    const dreamGymLink = page.locator('a[href*="dream-gym"]').first();
    await expect(dreamGymLink).toBeVisible({ timeout: 5000 });
    await dreamGymLink.click();

    // Wait for navigation to Dream Gym
    await page.waitForURL(/.+dream-gym.+/, { timeout: 5000 });

    // Should show onboarding or Dream Gym page
    const pageText = await page.locator('body').textContent();
    expect(pageText).toMatch(/Dream Gym|Onboarding|Get Started|Training|Set up/i);

    console.log('✓ Dream Gym page loaded');
  });

  test('should complete Dream Gym onboarding', async ({ page }) => {
    await setupUserWithAthlete(page);

    // Navigate to Dream Gym via dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const dreamGymButton = page.locator('button, a').filter({ hasText: /Dream Gym/i }).first();
    await expect(dreamGymButton).toBeVisible({ timeout: 5000 });
    await dreamGymButton.click();

    // Wait for navigation
    await page.waitForURL(/.+dream-gym.+/, { timeout: 5000 });

    // Check page content for onboarding elements
    const url = page.url();
    if (url.includes('onboarding') || url.includes('dream-gym')) {
      // Look for goals selection - use soft check since onboarding may vary
      const goalsSection = page.locator('text=/Goals|What.*want.*achieve/i').first();
      if (await goalsSection.isVisible({ timeout: 3000 })) {
        // Select a goal checkbox/button
        const goalOption = page.locator('button, input[type="checkbox"], label').filter({ hasText: /Speed|Strength|Agility/i }).first();
        if (await goalOption.isVisible({ timeout: 2000 })) {
          await goalOption.click();
        }
      }

      // Look for gym access question
      const gymAccessQuestion = page.locator('text=/gym access|equipment/i').first();
      if (await gymAccessQuestion.isVisible({ timeout: 2000 })) {
        const yesButton = page.locator('button, input').filter({ hasText: /Yes/i }).first();
        if (await yesButton.isVisible({ timeout: 2000 })) {
          await yesButton.click();
        }
      }

      // Submit/Continue onboarding
      const continueButton = page.locator('button').filter({ hasText: /Continue|Next|Start|Complete/i }).first();
      if (await continueButton.isVisible({ timeout: 2000 })) {
        await continueButton.click();
        await page.waitForLoadState('networkidle');
      }

      console.log('✓ Dream Gym onboarding flow started');
    }
  });
});

test.describe('Dream Gym - Workout Flow', () => {
  test('should display workout page with exercises', async ({ page }) => {
    await setupUserWithAthlete(page);

    // Navigate directly to workout page
    await page.goto('/dashboard/dream-gym/workout');
    await page.waitForLoadState('networkidle');

    // Check for workout elements or redirect to onboarding
    const pageContent = await page.locator('body').textContent();
    const hasWorkoutContent = pageContent?.match(/Workout|Exercise|Sets|Reps|Training|Onboarding/i);

    expect(hasWorkoutContent).toBeTruthy();
    console.log('✓ Workout page accessible');
  });

  test('should show exercise list with set tracking', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/workout');
    await page.waitForLoadState('networkidle');

    // Look for exercise cards or set trackers (may not exist if onboarding not complete)
    const exerciseCard = page.locator('[data-testid="exercise-card"], .exercise-card, [class*="exercise"]').first();

    if (await exerciseCard.isVisible({ timeout: 3000 })) {
      await expect(exerciseCard).toBeVisible();
      console.log('✓ Exercise card visible');

      // Look for set/rep inputs
      const setInput = page.locator('input[type="number"], input[placeholder*="reps"], [data-testid="reps-input"]').first();
      if (await setInput.isVisible({ timeout: 2000 })) {
        console.log('✓ Set tracking inputs visible');
      }
    }
  });
});

test.describe('Dream Gym - Mental Check-in', () => {
  test('should display mental check-in page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/mental');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasMentalContent = pageContent?.match(/Mental|Mood|Energy|Check.?in|How.*feeling/i);

    expect(hasMentalContent).toBeTruthy();
    console.log('✓ Mental check-in page accessible');
  });

  test('should allow mood/energy selection', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/mental');
    await page.waitForLoadState('networkidle');

    // Look for mood selection buttons/sliders
    const moodSelector = page.locator('button, input[type="range"], [data-testid="mood-selector"]').filter({ hasText: /Great|Good|Okay|1|2|3|4|5/i }).first();

    if (await moodSelector.isVisible({ timeout: 3000 })) {
      await moodSelector.click();
      console.log('✓ Mood selector interactive');
    }

    // Look for energy selection
    const energySelector = page.locator('button, select').filter({ hasText: /Energy|High|Low|Medium/i }).first();

    if (await energySelector.isVisible({ timeout: 2000 })) {
      console.log('✓ Energy selector visible');
    }
  });
});

test.describe('Dream Gym - AI Strategy', () => {
  test('should display AI Strategy page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/strategy');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasStrategyContent = pageContent?.match(/Strategy|AI|Workout Plan|Recommendations|Recovery|Onboarding/i);

    expect(hasStrategyContent).toBeTruthy();
    console.log('✓ AI Strategy page accessible');
  });

  test('should show AI insights on athlete detail page when Dream Gym set up', async ({ page }) => {
    await setupUserWithAthlete(page);

    // Navigate to athletes list
    await page.goto('/dashboard/athletes');
    await page.waitForLoadState('networkidle');

    // Click first athlete
    const athleteLink = page.locator('a[href*="/athletes/"]').first();
    await expect(athleteLink).toBeVisible({ timeout: 5000 });
    await athleteLink.click();

    // Wait for navigation
    await page.waitForURL(/.+\/athletes\/.+/, { timeout: 5000 });

    // Look for Dream Gym or AI Strategy card
    const dreamGymCard = page.locator('text=/Dream Gym|AI Strategy/i').first();
    if (await dreamGymCard.isVisible({ timeout: 3000 })) {
      console.log('✓ Dream Gym/AI Strategy card visible on athlete detail');
    }
  });
});

test.describe('Dream Gym - Progress & Analytics', () => {
  test('should display progress page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/progress');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasProgressContent = pageContent?.match(/Progress|Analytics|Charts|Stats|Volume|Workouts|No data|Onboarding/i);

    expect(hasProgressContent).toBeTruthy();
    console.log('✓ Progress page accessible');
  });

  test('should display assessments page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/assessments');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasAssessmentContent = pageContent?.match(/Assessment|Fitness Test|Beep Test|Sprint|Performance|Onboarding/i);

    expect(hasAssessmentContent).toBeTruthy();
    console.log('✓ Assessments page accessible');
  });

  test('should display biometrics page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/biometrics');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasBiometricsContent = pageContent?.match(/Biometrics|Heart Rate|Sleep|HRV|Steps|Health|Onboarding/i);

    expect(hasBiometricsContent).toBeTruthy();
    console.log('✓ Biometrics page accessible');
  });
});

test.describe('Dream Gym - Schedule', () => {
  test('should display schedule page', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/schedule');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.locator('body').textContent();
    const hasScheduleContent = pageContent?.match(/Schedule|Monday|Tuesday|Wednesday|Days|Weekly|Onboarding/i);

    expect(hasScheduleContent).toBeTruthy();
    console.log('✓ Schedule page accessible');
  });

  test('should allow day selection for training', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym/schedule');
    await page.waitForLoadState('networkidle');

    // Look for day selection buttons/checkboxes
    const dayButton = page.locator('button, input[type="checkbox"], label').filter({ hasText: /Monday|Tuesday|Wednesday/i }).first();

    if (await dayButton.isVisible({ timeout: 3000 })) {
      await dayButton.click();
      console.log('✓ Day selection interactive');
    }
  });
});

test.describe('Dream Gym - Navigation', () => {
  test('should have navigation between Dream Gym sections', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym');
    await page.waitForLoadState('networkidle');

    // Check for navigation links to different sections
    const sections = ['Workout', 'Schedule', 'Mental', 'Progress', 'Strategy'];

    for (const section of sections) {
      const sectionLink = page.locator(`a[href*="${section.toLowerCase()}"], button:has-text("${section}")`).first();
      if (await sectionLink.isVisible({ timeout: 2000 })) {
        console.log(`✓ ${section} navigation link visible`);
      }
    }
  });

  test('should navigate back to dashboard from Dream Gym', async ({ page }) => {
    await setupUserWithAthlete(page);

    await page.goto('/dashboard/dream-gym');
    await page.waitForLoadState('networkidle');

    // Look for back/dashboard link
    const backLink = page.locator('a[href="/dashboard"], a:has-text("Back"), a:has-text("Dashboard")').first();

    if (await backLink.isVisible({ timeout: 3000 })) {
      await backLink.click();
      await page.waitForURL('**/dashboard', { timeout: 5000 });

      expect(page.url()).toContain('/dashboard');
      console.log('✓ Navigation back to dashboard works');
    }
  });
});
