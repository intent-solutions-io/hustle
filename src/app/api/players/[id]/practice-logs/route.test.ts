/**
 * Tests for GET/POST /api/players/[id]/practice-logs
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
  createPracticeLogAdmin: vi.fn(),
  getPracticeLogsAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/practice-logs', () => ({
  createPracticeLogAdmin: mocks.createPracticeLogAdmin,
  getPracticeLogsAdmin: mocks.getPracticeLogsAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_PRACTICE_BODY = {
  date: '2025-06-15',
  practiceType: 'team_practice' as const,
  durationMinutes: 90,
  focusAreas: ['passing', 'positioning'] as const,
  teamName: 'City FC U12',
  intensity: 3,
};

const CREATED_LOG = {
  id: 'practice-001',
  playerId: 'player-123',
  ...VALID_PRACTICE_BODY,
  createdAt: new Date('2025-06-15'),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/practice-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
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
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 for invalid query params (limit out of range)', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs?limit=0',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns practice logs on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getPracticeLogsAdmin.mockResolvedValue({
      logs: [CREATED_LOG],
      nextCursor: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].id).toBe('practice-001');
    expect(body.nextCursor).toBeNull();
  });

  it('passes practiceType and focusArea filters to service', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getPracticeLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs?practiceType=individual&focusArea=shooting&limit=15',
    });
    const response = await GET(request, { params: PARAMS });

    expect(response.status).toBe(200);
    expect(mocks.getPracticeLogsAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        practiceType: 'individual',
        focusArea: 'shooting',
        limit: 15,
      })
    );
  });

  it('passes date range filters to service', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getPracticeLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs?startDate=2025-05-01&endDate=2025-06-30',
    });
    await GET(request, { params: PARAMS });

    expect(mocks.getPracticeLogsAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-06-30'),
      })
    );
  });

  it('returns 500 when getPracticeLogsAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getPracticeLogsAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch practice logs');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/practice-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: VALID_PRACTICE_BODY,
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
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: VALID_PRACTICE_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 when body fails schema validation (missing required fields)', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: {
        // missing practiceType, durationMinutes, focusAreas, date
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid practice log data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when practiceType is invalid', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: {
        ...VALID_PRACTICE_BODY,
        practiceType: 'online_training', // not a valid practiceType
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid practice log data');
  });

  it('returns 400 when focusAreas array is empty', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: {
        ...VALID_PRACTICE_BODY,
        focusAreas: [], // must have at least 1
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid practice log data');
  });

  it('creates practice log and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createPracticeLogAdmin.mockResolvedValue(CREATED_LOG);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: VALID_PRACTICE_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.practiceLog.id).toBe('practice-001');
    expect(mocks.createPracticeLogAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        playerId: 'player-123',
        practiceType: 'team_practice',
        durationMinutes: 90,
      })
    );
  });

  it('returns 500 when createPracticeLogAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createPracticeLogAdmin.mockRejectedValue(new Error('Write failed'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/practice-logs',
      body: VALID_PRACTICE_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create practice log');
  });
});
