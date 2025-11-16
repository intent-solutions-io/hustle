/**
 * End-to-End Smoke Test
 *
 * Validates critical customer journeys for go-live readiness.
 * Runs against staging environment before production deployment.
 *
 * Phase 5 Task 5: Go-Live Guardrails
 *
 * Usage:
 *   npm run smoke-test
 *   SMOKE_TEST_URL=https://staging.hustle.app npm run smoke-test
 */

import crypto from 'crypto';

// Configuration
const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:3000';
const TEST_EMAIL_PREFIX = process.env.SMOKE_TEST_EMAIL_PREFIX || 'smoke-test';
const TEST_EMAIL_DOMAIN = process.env.SMOKE_TEST_EMAIL_DOMAIN || 'example.com';

// Generate unique test email (time-based to avoid conflicts)
const timestamp = Date.now();
const randomSuffix = crypto.randomBytes(4).toString('hex');
const TEST_EMAIL = `${TEST_EMAIL_PREFIX}+${timestamp}-${randomSuffix}@${TEST_EMAIL_DOMAIN}`;
const TEST_PASSWORD = `SmokeTest123!${randomSuffix}`;

// Test state
let authCookie: string | null = null;
let playerId: string | null = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

/**
 * Logger utilities
 */
function log(message: string) {
  console.log(`${colors.blue}[SMOKE]${colors.reset} ${message}`);
}

function logSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`${colors.red}✗${colors.reset} ${message}`);
  if (error) {
    console.error(`${colors.gray}${error.stack || error}${colors.reset}`);
  }
}

function logWarning(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * HTTP request helper
 */
async function makeRequest(
  method: string,
  path: string,
  options: {
    body?: any;
    headers?: Record<string, string>;
    expectStatus?: number;
  } = {}
) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authCookie) {
    headers['Cookie'] = authCookie;
  }

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, requestOptions);

  // Store auth cookie if present
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('next-auth.session-token')) {
    authCookie = setCookie;
  }

  // Check expected status
  if (options.expectStatus && response.status !== options.expectStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${options.expectStatus}, got ${response.status}. Body: ${body}`
    );
  }

  return response;
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  log('Testing health check endpoint...');

  const response = await makeRequest('GET', '/api/health', {
    expectStatus: 200,
  });

  const data = await response.json();

  if (data.status !== 'healthy' && data.status !== 'degraded') {
    throw new Error(`Unexpected health status: ${data.status}`);
  }

  logSuccess(`Health check passed (status: ${data.status}, env: ${data.environment})`);
}

/**
 * Test 2: User Registration
 */
async function testUserRegistration() {
  log(`Registering test user: ${TEST_EMAIL}`);

  const response = await makeRequest('POST', '/api/auth/register', {
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      firstName: 'Smoke',
      lastName: 'Test',
      agreedToTerms: true,
      agreedToPrivacy: true,
      isParentGuardian: true,
    },
    expectStatus: 201,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error('Registration failed: success=false');
  }

  logSuccess('User registered successfully');
}

/**
 * Test 3: Email Verification (Skip)
 *
 * In smoke test, we'll skip email verification and directly mark user as verified
 * using admin API or database access (if available).
 *
 * For production readiness, this would require:
 * - Test email service integration
 * - Email verification token extraction
 * - Verification endpoint call
 */
async function testEmailVerification() {
  logWarning('Email verification skipped (requires test email service)');
}

/**
 * Test 4: User Login
 */
async function testUserLogin() {
  log('Logging in test user...');

  const response = await makeRequest('POST', '/api/auth/callback/credentials', {
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
    expectStatus: 200,
  });

  if (!authCookie) {
    throw new Error('No auth cookie received after login');
  }

  logSuccess('User logged in successfully');
}

/**
 * Test 5: Create Player
 */
async function testCreatePlayer() {
  log('Creating test player...');

  const response = await makeRequest('POST', '/api/players/create', {
    body: {
      name: 'Test Player',
      birthday: '2010-01-01',
      position: 'Forward',
      teamClub: 'Test FC',
    },
    expectStatus: 200,
  });

  const data = await response.json();

  if (!data.success || !data.player?.id) {
    throw new Error('Player creation failed: no player ID returned');
  }

  playerId = data.player.id;

  logSuccess(`Player created successfully (ID: ${playerId})`);
}

/**
 * Test 6: Create Game
 */
async function testCreateGame() {
  if (!playerId) {
    throw new Error('Cannot create game: no player ID available');
  }

  log('Creating test game...');

  const response = await makeRequest('POST', '/api/games', {
    body: {
      playerId,
      date: new Date().toISOString(),
      opponent: 'Test Opponent FC',
      result: 'win',
      yourScore: 3,
      opponentScore: 1,
      minutesPlayed: 90,
      goals: 1,
      assists: 2,
      tackles: 5,
      interceptions: 3,
      clearances: 2,
    },
    expectStatus: 201,
  });

  const data = await response.json();

  if (!data.success || !data.game?.id) {
    throw new Error('Game creation failed: no game ID returned');
  }

  logSuccess(`Game created successfully (ID: ${data.game.id})`);
}

/**
 * Test 7: Plan Limit Enforcement (Optional)
 *
 * Tests that plan limits are enforced correctly.
 * For free plan (2 players max), attempt to create 3rd player.
 */
async function testPlanLimits() {
  log('Testing plan limit enforcement...');

  // Create 2nd player (should succeed on free plan)
  const response2 = await makeRequest('POST', '/api/players/create', {
    body: {
      name: 'Test Player 2',
      birthday: '2011-01-01',
      position: 'Midfielder',
      teamClub: 'Test FC',
    },
    expectStatus: 200,
  });

  const data2 = await response2.json();
  if (!data2.success) {
    throw new Error('Second player creation failed (should succeed on free plan)');
  }

  logSuccess('Second player created (free plan allows 2 players)');

  // Attempt 3rd player (should fail on free plan)
  const response3 = await makeRequest('POST', '/api/players/create', {
    body: {
      name: 'Test Player 3',
      birthday: '2012-01-01',
      position: 'Defender',
      teamClub: 'Test FC',
    },
    expectStatus: 403,
  });

  const data3 = await response3.json();
  if (data3.error !== 'PLAN_LIMIT_EXCEEDED') {
    throw new Error(
      `Expected PLAN_LIMIT_EXCEEDED error, got: ${data3.error}`
    );
  }

  logSuccess('Plan limit enforced correctly (3rd player blocked)');
}

/**
 * Test 8: Cleanup (Optional)
 *
 * Clean up test data to avoid polluting database.
 * In smoke test environment, cleanup may not be critical.
 */
async function testCleanup() {
  logWarning('Test data cleanup not implemented (manual cleanup required)');
  log(`Test user email: ${TEST_EMAIL}`);
}

/**
 * Main test runner
 */
async function runSmokeTests() {
  const startTime = Date.now();

  console.log('\n='.repeat(60));
  console.log(`${colors.blue}HUSTLE SMOKE TEST${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'Email Verification', fn: testEmailVerification },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Create Player', fn: testCreatePlayer },
    { name: 'Create Game', fn: testCreateGame },
    { name: 'Plan Limit Enforcement', fn: testPlanLimits },
    { name: 'Cleanup', fn: testCleanup },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      logError(`Test failed: ${test.name}`, error);
      failed++;
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const duration = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}SMOKE TEST RESULTS${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runSmokeTests().catch((error) => {
  logError('Smoke test runner failed', error);
  process.exit(1);
});
