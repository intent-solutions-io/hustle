/**
 * POST /api/waitlist Tests
 *
 * Tests for the waitlist signup endpoint:
 * - Validates email format (Zod schema)
 * - Rejects duplicate email addresses (409)
 * - Creates waitlist entry on first signup (201)
 * - Handles Firestore failures gracefully (500)
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  isOnWaitlistAdmin: vi.fn(),
  addToWaitlistAdmin: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/firebase/admin-services/waitlist', () => ({
  isOnWaitlistAdmin: mocks.isOnWaitlistAdmin,
  addToWaitlistAdmin: mocks.addToWaitlistAdmin,
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { POST } from './route';
import { createMockRequest } from '@/test-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>) {
  return createMockRequest({
    method: 'POST',
    body,
    url: 'http://localhost:3000/api/waitlist',
  });
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('POST /api/waitlist — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOnWaitlistAdmin.mockResolvedValue(false);
    mocks.addToWaitlistAdmin.mockResolvedValue(undefined);
  });

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ firstName: 'Alex' });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when email is not a valid address', async () => {
    const req = makeRequest({ email: 'not-an-email' });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/valid email/i);
  });

  it('returns 400 when email is an empty string', async () => {
    const req = makeRequest({ email: '' });
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('returns 400 when request body is completely empty', async () => {
    const req = makeRequest({});
    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('accepts request with only email (firstName/lastName are optional)', async () => {
    const req = makeRequest({ email: 'solo@example.com' });
    const response = await POST(req);

    // Should not be 400
    expect(response.status).not.toBe(400);
  });

  it('accepts request with all optional fields provided', async () => {
    const req = makeRequest({
      email: 'full@example.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      source: 'twitter',
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// Duplicate email
// ---------------------------------------------------------------------------

describe('POST /api/waitlist — duplicate email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 409 when email is already on the waitlist', async () => {
    mocks.isOnWaitlistAdmin.mockResolvedValue(true);

    const req = makeRequest({ email: 'existing@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toMatch(/already on the waitlist/i);
  });

  it('does not call addToWaitlistAdmin for duplicate emails', async () => {
    mocks.isOnWaitlistAdmin.mockResolvedValue(true);

    const req = makeRequest({ email: 'dupe@example.com' });
    await POST(req);

    expect(mocks.addToWaitlistAdmin).not.toHaveBeenCalled();
  });

  it('checks the waitlist with the exact submitted email', async () => {
    mocks.isOnWaitlistAdmin.mockResolvedValue(false);
    mocks.addToWaitlistAdmin.mockResolvedValue(undefined);

    const req = makeRequest({ email: 'check@example.com' });
    await POST(req);

    expect(mocks.isOnWaitlistAdmin).toHaveBeenCalledWith('check@example.com');
  });
});

// ---------------------------------------------------------------------------
// Successful signup
// ---------------------------------------------------------------------------

describe('POST /api/waitlist — successful signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isOnWaitlistAdmin.mockResolvedValue(false);
    mocks.addToWaitlistAdmin.mockResolvedValue(undefined);
  });

  it('returns 201 with success message', async () => {
    const req = makeRequest({ email: 'new@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.message).toMatch(/waitlist/i);
  });

  it('returns the email as the ID in the response', async () => {
    const req = makeRequest({ email: 'new@example.com' });
    const response = await POST(req);

    const body = await response.json();
    expect(body.id).toBe('new@example.com');
  });

  it('calls addToWaitlistAdmin with correct data', async () => {
    const req = makeRequest({
      email: 'player@example.com',
      firstName: 'Jordan',
      lastName: 'Lee',
      source: 'instagram',
    });
    await POST(req);

    expect(mocks.addToWaitlistAdmin).toHaveBeenCalledWith({
      email: 'player@example.com',
      firstName: 'Jordan',
      lastName: 'Lee',
      source: 'instagram',
    });
  });

  it('defaults source to "landing_page" when not provided', async () => {
    const req = makeRequest({ email: 'nosource@example.com' });
    await POST(req);

    const callArg = mocks.addToWaitlistAdmin.mock.calls[0][0];
    expect(callArg.source).toBe('landing_page');
  });

  it('passes undefined firstName and lastName when not provided', async () => {
    const req = makeRequest({ email: 'minimal@example.com' });
    await POST(req);

    const callArg = mocks.addToWaitlistAdmin.mock.calls[0][0];
    expect(callArg.firstName).toBeUndefined();
    expect(callArg.lastName).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Server errors
// ---------------------------------------------------------------------------

describe('POST /api/waitlist — server errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when isOnWaitlistAdmin throws', async () => {
    mocks.isOnWaitlistAdmin.mockRejectedValue(new Error('Firestore unavailable'));

    const req = makeRequest({ email: 'error@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 500 when addToWaitlistAdmin throws', async () => {
    mocks.isOnWaitlistAdmin.mockResolvedValue(false);
    mocks.addToWaitlistAdmin.mockRejectedValue(new Error('write failed'));

    const req = makeRequest({ email: 'fail@example.com' });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/failed to join waitlist/i);
  });
});
