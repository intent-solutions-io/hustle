/**
 * Tests for GET /api/players
 *
 * Covers: auth (401), happy path (200), error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createMockRequest, createMockSession } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPlayersAdmin: vi.fn(),
  getUnverifiedGamesAdmin: vi.fn(),
  getUserProfileAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayersAdmin: mocks.getPlayersAdmin,
}));

vi.mock('@/lib/firebase/admin-services/games', () => ({
  getUnverifiedGamesAdmin: mocks.getUnverifiedGamesAdmin,
}));

vi.mock('@/lib/firebase/admin-services/users', () => ({
  getUserProfileAdmin: mocks.getUserProfileAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PLAYER_1 = {
  id: 'player-001',
  name: 'Alex Smith',
  birthday: new Date('2012-03-10'),
  primaryPosition: 'CM',
  position: 'CM',
  teamClub: 'City FC',
  photoUrl: null,
};

const PLAYER_2 = {
  id: 'player-002',
  name: 'Jordan Lee',
  birthday: new Date('2013-07-22'),
  primaryPosition: 'GK',
  position: 'GK',
  teamClub: 'Town SC',
  photoUrl: 'https://example.com/photo.jpg',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/players', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({ method: 'GET' });
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session has no user id', async () => {
    mocks.auth.mockResolvedValue({ user: {} });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns players list with pending games and parent email', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockResolvedValue([PLAYER_1, PLAYER_2]);
    mocks.getUserProfileAdmin.mockResolvedValue({ email: 'parent@example.com' });
    mocks.getUnverifiedGamesAdmin
      .mockResolvedValueOnce([{ id: 'g1' }, { id: 'g2' }]) // 2 pending for player-001
      .mockResolvedValueOnce([]); // 0 pending for player-002

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players).toHaveLength(2);

    const player1 = body.players.find((p: { id: string }) => p.id === 'player-001');
    expect(player1).toMatchObject({
      id: 'player-001',
      name: 'Alex Smith',
      pendingGames: 2,
      parentEmail: 'parent@example.com',
    });

    const player2 = body.players.find((p: { id: string }) => p.id === 'player-002');
    expect(player2).toMatchObject({
      id: 'player-002',
      pendingGames: 0,
    });
  });

  it('uses primaryPosition when available, falls back to position', async () => {
    const playerWithBothPositions = {
      ...PLAYER_1,
      primaryPosition: 'ST',
      position: 'FW',
    };
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockResolvedValue([playerWithBothPositions]);
    mocks.getUserProfileAdmin.mockResolvedValue({ email: 'parent@example.com' });
    mocks.getUnverifiedGamesAdmin.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body.players[0].position).toBe('ST');
  });

  it('uses position field when primaryPosition is nullish', async () => {
    const playerNoPrimary = { ...PLAYER_1, primaryPosition: undefined, position: 'CB' };
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockResolvedValue([playerNoPrimary]);
    mocks.getUserProfileAdmin.mockResolvedValue(null);
    mocks.getUnverifiedGamesAdmin.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();

    expect(body.players[0].position).toBe('CB');
    expect(body.players[0].parentEmail).toBeNull();
  });

  it('returns empty players array when user has no players', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockResolvedValue([]);
    mocks.getUserProfileAdmin.mockResolvedValue({ email: 'parent@example.com' });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.players).toEqual([]);
  });

  it('returns 500 when getPlayersAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockRejectedValue(new Error('Firestore error'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch players');
  });

  it('returns 500 when getUserProfileAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayersAdmin.mockResolvedValue([PLAYER_1]);
    mocks.getUserProfileAdmin.mockRejectedValue(new Error('Profile fetch failed'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch players');
  });
});
