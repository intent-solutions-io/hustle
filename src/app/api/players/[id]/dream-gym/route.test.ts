/**
 * Tests for GET/POST /api/players/[id]/dream-gym
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
  getDreamGymAdmin: vi.fn(),
  upsertDreamGymAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/dream-gym', () => ({
  getDreamGymAdmin: mocks.getDreamGymAdmin,
  upsertDreamGymAdmin: mocks.upsertDreamGymAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_PROFILE = {
  goals: ['improve_speed', 'build_strength'],
  intensity: 'moderate',
  focusAreas: ['fitness', 'shooting'],
};

const VALID_SCHEDULE = {
  daysPerWeek: 3,
  sessionDurationMinutes: 45,
  preferredTimes: ['morning'],
};

const VALID_POST_BODY = {
  profile: VALID_PROFILE,
  schedule: VALID_SCHEDULE,
};

const CREATED_DREAM_GYM = {
  id: 'dream-gym-player-123',
  playerId: 'player-123',
  profile: VALID_PROFILE,
  schedule: VALID_SCHEDULE,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/dream-gym', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
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
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns dream gym profile on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getDreamGymAdmin.mockResolvedValue(CREATED_DREAM_GYM);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dreamGym.id).toBe('dream-gym-player-123');
    expect(mocks.getDreamGymAdmin).toHaveBeenCalledWith('user-123', 'player-123');
  });

  it('returns null dreamGym when profile has not been created yet', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getDreamGymAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dreamGym).toBeNull();
  });

  it('returns 500 when getDreamGymAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getDreamGymAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch Dream Gym profile');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/dream-gym', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: VALID_POST_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when profile is missing', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: {
        // profile is missing
        schedule: VALID_SCHEDULE,
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing required fields: profile and schedule');
  });

  it('returns 400 when schedule is missing', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: {
        profile: VALID_PROFILE,
        // schedule is missing
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing required fields: profile and schedule');
  });

  it('returns 400 when profile has no goals', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: {
        profile: { ...VALID_PROFILE, goals: [] },
        schedule: VALID_SCHEDULE,
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('At least one goal is required');
  });

  it('returns 400 when profile has no intensity', async () => {
    mocks.auth.mockResolvedValue(createMockSession());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: {
        profile: { goals: ['improve_speed'] }, // no intensity
        schedule: VALID_SCHEDULE,
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Intensity is required');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: VALID_POST_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('creates or updates dream gym and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.upsertDreamGymAdmin.mockResolvedValue(CREATED_DREAM_GYM);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: VALID_POST_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dreamGym.id).toBe('dream-gym-player-123');
    expect(mocks.upsertDreamGymAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      {
        profile: VALID_PROFILE,
        schedule: VALID_SCHEDULE,
      }
    );
  });

  it('returns 500 when upsertDreamGymAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.upsertDreamGymAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/dream-gym',
      body: VALID_POST_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to save Dream Gym profile');
  });
});
