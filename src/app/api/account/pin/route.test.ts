/**
 * PATCH /api/account/pin Tests
 *
 * Tests for the verification PIN set/update endpoint:
 * - Requires authenticated session (401 when unauthenticated)
 * - Validates PIN and confirmPin presence (400)
 * - Validates that PIN and confirmPin match (400)
 * - Validates PIN format (4-6 digits, numeric only) (400)
 * - Hashes the PIN with bcrypt and stores it via updateUserProfileAdmin
 * - Returns success message on save
 * - Handles unexpected errors gracefully (500)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  bcryptHash: vi.fn(),
  updateUserProfileAdmin: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: mocks.bcryptHash,
  },
}));

vi.mock('@/lib/firebase/admin-services/users', () => ({
  updateUserProfileAdmin: mocks.updateUserProfileAdmin,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { PATCH } from './route';
import { createMockRequest, createMockSession } from '@/test-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>) {
  return createMockRequest({
    method: 'PATCH',
    body,
    url: 'http://localhost:3000/api/account/pin',
  });
}

// ---------------------------------------------------------------------------
// Authentication guard
// ---------------------------------------------------------------------------

describe('PATCH /api/account/pin — auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when there is no active session', async () => {
    mocks.auth.mockResolvedValue(null);

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/log in/i);
  });

  it('returns 401 when session has no user id', async () => {
    mocks.auth.mockResolvedValue({ user: { id: null, email: 'x@y.com', emailVerified: true } });

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(401);
  });

  it('does not call bcrypt or Firestore when unauthenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    await PATCH(req);

    expect(mocks.bcryptHash).not.toHaveBeenCalled();
    expect(mocks.updateUserProfileAdmin).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('PATCH /api/account/pin — input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(createMockSession());
  });

  it('returns 400 when pin is missing', async () => {
    const req = makeRequest({ confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 when confirmPin is missing', async () => {
    const req = makeRequest({ pin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/required/i);
  });

  it('returns 400 when both pin and confirmPin are missing', async () => {
    const req = makeRequest({});
    const response = await PATCH(req);

    expect(response.status).toBe(400);
  });

  it('returns 400 when pin and confirmPin do not match', async () => {
    const req = makeRequest({ pin: '1234', confirmPin: '5678' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/do not match/i);
  });

  it('returns 400 when PIN is shorter than 4 digits', async () => {
    const req = makeRequest({ pin: '123', confirmPin: '123' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/4-6 digits/i);
  });

  it('returns 400 when PIN is longer than 6 digits', async () => {
    const req = makeRequest({ pin: '1234567', confirmPin: '1234567' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/4-6 digits/i);
  });

  it('returns 400 when PIN contains non-numeric characters', async () => {
    const req = makeRequest({ pin: '12ab', confirmPin: '12ab' });
    const response = await PATCH(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/4-6 digits/i);
  });

  it('accepts a 4-digit numeric PIN', async () => {
    mocks.bcryptHash.mockResolvedValue('$2b$10$hashedpin');
    mocks.updateUserProfileAdmin.mockResolvedValue({} as any);

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(200);
  });

  it('accepts a 6-digit numeric PIN', async () => {
    mocks.bcryptHash.mockResolvedValue('$2b$10$hashedpin');
    mocks.updateUserProfileAdmin.mockResolvedValue({} as any);

    const req = makeRequest({ pin: '123456', confirmPin: '123456' });
    const response = await PATCH(req);

    expect(response.status).toBe(200);
  });

  it('accepts a 5-digit numeric PIN', async () => {
    mocks.bcryptHash.mockResolvedValue('$2b$10$hashedpin');
    mocks.updateUserProfileAdmin.mockResolvedValue({} as any);

    const req = makeRequest({ pin: '12345', confirmPin: '12345' });
    const response = await PATCH(req);

    expect(response.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Successful PIN save
// ---------------------------------------------------------------------------

describe('PATCH /api/account/pin — successful save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(createMockSession({ id: 'user-123' }));
    mocks.bcryptHash.mockResolvedValue('$2b$10$hashed_pin_value');
    mocks.updateUserProfileAdmin.mockResolvedValue({} as any);
  });

  it('returns 200 with success: true', async () => {
    const req = makeRequest({ pin: '4321', confirmPin: '4321' });
    const response = await PATCH(req);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('returns a success message', async () => {
    const req = makeRequest({ pin: '4321', confirmPin: '4321' });
    const response = await PATCH(req);

    const body = await response.json();
    expect(body.message).toMatch(/saved/i);
  });

  it('hashes the PIN with bcrypt using 10 salt rounds', async () => {
    const req = makeRequest({ pin: '9876', confirmPin: '9876' });
    await PATCH(req);

    expect(mocks.bcryptHash).toHaveBeenCalledWith('9876', 10);
  });

  it('saves the hashed PIN via updateUserProfileAdmin for the authenticated user', async () => {
    const req = makeRequest({ pin: '5555', confirmPin: '5555' });
    await PATCH(req);

    expect(mocks.updateUserProfileAdmin).toHaveBeenCalledWith('user-123', {
      verificationPinHash: '$2b$10$hashed_pin_value',
    });
  });

  it('does not store the raw PIN', async () => {
    const req = makeRequest({ pin: '4321', confirmPin: '4321' });
    await PATCH(req);

    const updateArg = mocks.updateUserProfileAdmin.mock.calls[0][1];
    expect(updateArg.verificationPinHash).not.toBe('4321');
  });
});

// ---------------------------------------------------------------------------
// Server errors
// ---------------------------------------------------------------------------

describe('PATCH /api/account/pin — server errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(createMockSession());
  });

  it('returns 500 when bcrypt.hash throws', async () => {
    mocks.bcryptHash.mockRejectedValue(new Error('bcrypt failure'));

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/unable to save pin/i);
  });

  it('returns 500 when updateUserProfileAdmin throws', async () => {
    mocks.bcryptHash.mockResolvedValue('$2b$10$hash');
    mocks.updateUserProfileAdmin.mockRejectedValue(new Error('Firestore error'));

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('does not expose internal error details in the response', async () => {
    mocks.bcryptHash.mockRejectedValue(new Error('internal secret'));

    const req = makeRequest({ pin: '1234', confirmPin: '1234' });
    const response = await PATCH(req);

    const body = await response.json();
    expect(body.error).not.toContain('internal secret');
  });
});
