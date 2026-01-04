import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Hustle App
 *
 * Tests authentication, player management, game logging, and dashboard functionality
 *
 * Optimizations:
 * - Extended timeouts for Firebase operations (cold starts, rate limiting)
 * - Retries for flaky network conditions
 * - Global setup for authenticated state reuse
 */
export default defineConfig({
  testDir: './03-Tests/e2e',

  // Exclude setup files from test discovery
  testIgnore: ['**/global-setup.ts', '**/test-helpers.ts'],

  // Maximum time one test can run (2 minutes - Firebase operations can be slow)
  timeout: 120 * 1000,

  // Expect timeout for assertions (10s for slow renders)
  expect: {
    timeout: 10000,
    // Visual regression testing configuration
    toHaveScreenshot: {
      // Allow 0.2% pixel difference (handles anti-aliasing, font rendering)
      maxDiffPixelRatio: 0.002,
      // Threshold for individual pixel color difference (0-1)
      threshold: 0.2,
    },
  },

  // Snapshot directory for visual regression screenshots
  snapshotDir: './03-Tests/snapshots',
  // Snapshot file naming pattern
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-{projectName}/{arg}{ext}',

  // Run tests in files sequentially for stable Firebase operations
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests (helps with flaky Firebase operations)
  retries: process.env.CI ? 2 : 1,

  // Use single worker for more stable Firebase operations
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: '03-Tests/playwright-report' }],
    ['list'], // Console output
    ['json', { outputFile: '03-Tests/test-results.json' }]
  ],

  // Global setup - creates authenticated state before all tests
  globalSetup: require.resolve('./03-Tests/e2e/global-setup.ts'),

  use: {
    // Base URL for testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1280, height: 720 },

    // Extended timeouts for Firebase operations
    actionTimeout: 30 * 1000,
    navigationTimeout: 60 * 1000,

    // Storage state for authenticated tests (created by global setup)
    storageState: './03-Tests/e2e/.auth/user.json',
  },

  // Configure projects for major browsers
  projects: [
    // Main test project - Chromium
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit/Safari
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    // Google Chrome
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'NEXT_PUBLIC_E2E_TEST_MODE=true npm run dev -- -H 0.0.0.0 -p 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI, // Reuse in local dev, start fresh in CI
    timeout: 180 * 1000, // 3 minutes for dev server startup
  },
});
