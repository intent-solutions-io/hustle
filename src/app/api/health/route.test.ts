/**
 * GET /api/health Tests
 *
 * Verifies health check endpoint behavior:
 * - Returns 200 with healthy status in non-production with required env vars
 * - Returns 503 when critical environment variables are missing
 * - Skips Firestore check in non-production environments
 * - Runs Firestore check in production and reports pass/fail/degraded
 * - Response shape matches the HealthCheckResult interface
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  firestoreGet: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: mocks.firestoreGet,
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
  })),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from './route';

// ---------------------------------------------------------------------------
// Environment variable helpers
// ---------------------------------------------------------------------------

function setEnv(vars: Record<string, string | undefined>) {
  const originals: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    originals[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return () => {
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

// Minimal env required for a "healthy" non-production response
const HEALTHY_ENV = {
  NODE_ENV: 'test',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_CLIENT_EMAIL: 'sa@test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
  STRIPE_SECRET_KEY: 'sk_test_123',
};

// ---------------------------------------------------------------------------
// Response shape / healthy baseline
// ---------------------------------------------------------------------------

describe('GET /api/health — response shape', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv(HEALTHY_ENV);
  });

  afterEach(() => {
    restore();
  });

  it('returns HTTP 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns JSON with status, timestamp, version, environment, and service fields', async () => {
    const response = await GET();
    const body = await response.json();

    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('service', 'hustle-api');
    expect(body).toHaveProperty('checks');
    expect(body).toHaveProperty('latencyMs');
  });

  it('returns a valid ISO timestamp', async () => {
    const response = await GET();
    const { timestamp } = await response.json();

    expect(() => new Date(timestamp)).not.toThrow();
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });

  it('includes a non-negative latencyMs', async () => {
    const response = await GET();
    const { latencyMs } = await response.json();

    expect(latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('uses APP_VERSION env var when available', async () => {
    const inner = setEnv({ APP_VERSION: '2.3.4' });
    const response = await GET();
    const { version } = await response.json();
    expect(version).toBe('2.3.4');
    inner();
  });

  it('falls back to "1.0.0" when no version env var is set', async () => {
    const inner = setEnv({ APP_VERSION: undefined, NEXT_PUBLIC_APP_VERSION: undefined });
    const response = await GET();
    const { version } = await response.json();
    expect(version).toBe('1.0.0');
    inner();
  });
});

// ---------------------------------------------------------------------------
// Non-production: Firestore check is skipped
// ---------------------------------------------------------------------------

describe('GET /api/health — non-production Firestore check', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ ...HEALTHY_ENV, NODE_ENV: 'test' });
  });

  afterEach(() => {
    restore();
  });

  it('skips the Firestore ping and marks it as "skipped"', async () => {
    const response = await GET();
    const { checks } = await response.json();

    expect(checks.firestore.status).toBe('skipped');
    expect(mocks.firestoreGet).not.toHaveBeenCalled();
  });

  it('includes a reason for the skip', async () => {
    const response = await GET();
    const { checks } = await response.json();

    expect(checks.firestore.reason).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Production: Firestore check runs
// ---------------------------------------------------------------------------

describe('GET /api/health — production Firestore check', () => {
  let restore: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restore = setEnv({ ...HEALTHY_ENV, NODE_ENV: 'production' });
  });

  afterEach(() => {
    restore();
  });

  it('returns healthy when Firestore ping succeeds', async () => {
    mocks.firestoreGet.mockResolvedValue({});

    const response = await GET();
    const body = await response.json();

    expect(body.checks.firestore.status).toBe('pass');
    expect(body.status).not.toBe('unhealthy');
    expect(response.status).toBe(200);
  });

  it('includes responseTime in the Firestore check result', async () => {
    mocks.firestoreGet.mockResolvedValue({});

    const response = await GET();
    const { checks } = await response.json();

    expect(typeof checks.firestore.responseTime).toBe('number');
    expect(checks.firestore.responseTime).toBeGreaterThanOrEqual(0);
  });

  it('returns unhealthy with HTTP 503 when Firestore ping fails', async () => {
    mocks.firestoreGet.mockRejectedValue(new Error('connection refused'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.firestore.status).toBe('fail');
    expect(body.checks.firestore.error).toContain('connection refused');
  });
});

// ---------------------------------------------------------------------------
// Environment variable checks
// ---------------------------------------------------------------------------

describe('GET /api/health — environment checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns healthy when all critical vars are present', async () => {
    const restore = setEnv(HEALTHY_ENV);

    const response = await GET();
    const body = await response.json();

    expect(body.checks.environment.status).toBe('pass');
    expect(response.status).toBe(200);

    restore();
  });

  it('returns unhealthy with 503 when FIREBASE_PROJECT_ID is missing', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      FIREBASE_PROJECT_ID: undefined,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.environment.status).toBe('fail');
    expect(body.checks.environment.missing).toContain('FIREBASE_PROJECT_ID');

    restore();
  });

  it('returns unhealthy when no Firebase auth credentials are present', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      FIREBASE_CLIENT_EMAIL: undefined,
      FIREBASE_PRIVATE_KEY: undefined,
      FIREBASE_SERVICE_ACCOUNT_JSON: undefined,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');

    restore();
  });

  it('accepts FIREBASE_SERVICE_ACCOUNT_JSON as an alternative to key+email', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      FIREBASE_CLIENT_EMAIL: undefined,
      FIREBASE_PRIVATE_KEY: undefined,
      FIREBASE_SERVICE_ACCOUNT_JSON: '{"type":"service_account"}',
    });

    const response = await GET();
    const body = await response.json();

    // Should not be unhealthy due to missing Firebase auth
    expect(body.checks.environment.missing ?? []).not.toContain(
      'FIREBASE_SERVICE_ACCOUNT_JSON or (FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)'
    );

    restore();
  });

  it('checks STRIPE_SECRET_KEY when billing is enabled', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      STRIPE_SECRET_KEY: undefined,
      BILLING_ENABLED: 'true',
    });

    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe('unhealthy');
    expect(body.checks.environment.missing).toContain('STRIPE_SECRET_KEY');

    restore();
  });

  it('skips STRIPE_SECRET_KEY check when BILLING_ENABLED is "false"', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      STRIPE_SECRET_KEY: undefined,
      BILLING_ENABLED: 'false',
    });

    const response = await GET();
    const body = await response.json();

    expect(body.checks.environment.missing ?? []).not.toContain('STRIPE_SECRET_KEY');

    restore();
  });

  it('remains healthy (pass) when only optional email vars are missing', async () => {
    const restore = setEnv({
      ...HEALTHY_ENV,
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
    });

    const response = await GET();
    const body = await response.json();

    // Environment check should still pass — email is optional
    expect(body.checks.environment.status).toBe('pass');
    // Overall status should not be unhealthy solely due to missing email config
    expect(response.status).toBe(200);

    restore();
  });
});
