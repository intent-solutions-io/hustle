import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Hustle App
 *
 * Tests authentication, player management, game logging, and dashboard functionality
 */
export default defineConfig({
  testDir: './03-Tests/e2e',

  // Maximum time one test can run (30 seconds)
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5000,
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

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI (more stable)
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: '03-Tests/playwright-report' }],
    ['list'], // Console output
    ['json', { outputFile: '03-Tests/test-results.json' }]
  ],

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

    // Maximum time for navigation and actions
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
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
    timeout: 120 * 1000,
  },
});
