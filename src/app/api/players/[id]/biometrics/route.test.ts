/**
 * Tests for GET/POST /api/players/[id]/biometrics
 *
 * Covers: auth (401), validation (400), not-found (404), happy path (200),
 * and error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession, createMockPlayer } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPlayerAdmin: vi.fn(),
  createBiometricsLogAdmin: vi.fn(),
  getBiometricsLogsAdmin: vi.fn(),
  getBiometricsTrendsAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/biometrics', () => ({
  createBiometricsLogAdmin: mocks.createBiometricsLogAdmin,
  getBiometricsLogsAdmin: mocks.getBiometricsLogsAdmin,
  getBiometricsTrendsAdmin: mocks.getBiometricsTrendsAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_BIOMETRICS_BODY = {
  date: '2025-06-15',
  restingHeartRate: 62,
  sleepScore: 85,
  sleepHours: 8.5,
  steps: 10000,
  source: 'manual' as const,
};

const CREATED_LOG = {
  id: 'bio-001',
  playerId: 'player-123',
  ...VALID_BIOMETRICS_BODY,
  createdAt: new Date('2025-06-15'),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/biometrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 for invalid source parameter', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics?source=invalid_device',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid source parameter');
  });

  it('returns 400 for invalid query params (limit out of range)', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics?limit=200',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns biometrics logs on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getBiometricsLogsAdmin.mockResolvedValue({
      logs: [CREATED_LOG],
      nextCursor: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].id).toBe('bio-001');
    expect(body.nextCursor).toBeNull();
    expect(body.trends).toBeNull();
  });

  it('fetches trends when includeTrends=true', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getBiometricsLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });
    mocks.getBiometricsTrendsAdmin.mockResolvedValue({ avgSleepScore: 80 });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics?includeTrends=true',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.trends).toEqual({ avgSleepScore: 80 });
    expect(mocks.getBiometricsTrendsAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({ limit: 30 })
    );
  });

  it('does not fetch trends when includeTrends is not set', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getBiometricsLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
    });
    await GET(request, { params: PARAMS });

    expect(mocks.getBiometricsTrendsAdmin).not.toHaveBeenCalled();
  });

  it('returns 500 when getBiometricsLogsAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getBiometricsLogsAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch biometrics logs');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/biometrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: VALID_BIOMETRICS_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: VALID_BIOMETRICS_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 when body fails schema validation', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: {
        // missing required: date, source
        restingHeartRate: 62,
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid biometrics data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when source is invalid', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: {
        ...VALID_BIOMETRICS_BODY,
        source: 'unknown_device',
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid biometrics data');
  });

  it('creates biometrics log and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createBiometricsLogAdmin.mockResolvedValue(CREATED_LOG);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: VALID_BIOMETRICS_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.biometricsLog.id).toBe('bio-001');
    expect(mocks.createBiometricsLogAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        playerId: 'player-123',
        source: 'manual',
        restingHeartRate: 62,
      })
    );
  });

  it('returns 500 when createBiometricsLogAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createBiometricsLogAdmin.mockRejectedValue(new Error('Write failed'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/biometrics',
      body: VALID_BIOMETRICS_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create biometrics log');
  });
});
