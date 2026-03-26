/**
 * Tests for GET/POST /api/players/[id]/dream-gym/workout-logs
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
  createWorkoutLogAdmin: vi.fn(),
  getWorkoutLogsAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/workout-logs', () => ({
  createWorkoutLogAdmin: mocks.createWorkoutLogAdmin,
  getWorkoutLogsAdmin: mocks.getWorkoutLogsAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_EXERCISE = {
  exerciseId: 'ex-001',
  exerciseName: 'Squat',
  targetSets: 3,
  targetReps: '10',
  sets: [
    { setNumber: 1, reps: 10, weight: 45, completed: true },
    { setNumber: 2, reps: 10, weight: 45, completed: true },
    { setNumber: 3, reps: 8, weight: 45, completed: true },
  ],
};

const VALID_WORKOUT_BODY = {
  date: '2025-06-15',
  type: 'strength' as const,
  title: 'Lower Body Strength',
  duration: 45,
  exercises: [VALID_EXERCISE],
  totalVolume: 1260,
};

const CREATED_LOG = {
  id: 'workout-001',
  playerId: 'player-123',
  ...VALID_WORKOUT_BODY,
  createdAt: new Date('2025-06-15'),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/dream-gym/workout-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
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
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
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
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs?limit=0',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns workout logs on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getWorkoutLogsAdmin.mockResolvedValue({
      logs: [CREATED_LOG],
      nextCursor: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].id).toBe('workout-001');
    expect(body.nextCursor).toBeNull();
  });

  it('passes type filter to service', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getWorkoutLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs?type=conditioning&limit=10',
    });
    const response = await GET(request, { params: PARAMS });

    expect(response.status).toBe(200);
    expect(mocks.getWorkoutLogsAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        type: 'conditioning',
        limit: 10,
      })
    );
  });

  it('passes date range filters to service', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getWorkoutLogsAdmin.mockResolvedValue({ logs: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs?startDate=2025-01-01&endDate=2025-12-31',
    });
    await GET(request, { params: PARAMS });

    expect(mocks.getWorkoutLogsAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      })
    );
  });

  it('returns 500 when getWorkoutLogsAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getWorkoutLogsAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch workout logs');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/dream-gym/workout-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: VALID_WORKOUT_BODY,
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
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: VALID_WORKOUT_BODY,
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
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: {
        // missing type, title, duration, exercises, date
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid workout log data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when type is invalid', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: {
        ...VALID_WORKOUT_BODY,
        type: 'yoga', // not a valid workoutLogType
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid workout log data');
  });

  it('returns 400 when exercises array is empty', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: {
        ...VALID_WORKOUT_BODY,
        exercises: [], // must have at least 1
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid workout log data');
  });

  it('creates workout log and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createWorkoutLogAdmin.mockResolvedValue(CREATED_LOG);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: VALID_WORKOUT_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.workoutLog.id).toBe('workout-001');
    expect(mocks.createWorkoutLogAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        playerId: 'player-123',
        type: 'strength',
        title: 'Lower Body Strength',
        duration: 45,
      })
    );
  });

  it('returns 500 when createWorkoutLogAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createWorkoutLogAdmin.mockRejectedValue(new Error('Write failed'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym/workout-logs',
      body: VALID_WORKOUT_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create workout log');
  });
});
