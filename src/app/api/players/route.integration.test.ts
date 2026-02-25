/**
 * Integration Tests: Players API Route (GET /api/players)
 *
 * Tests the full route handler with real Firestore data.
 * Only mock: next/headers cookies() to inject a real session cookie.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearEmulators,
  createTestUser,
  seedUserProfile,
  seedWorkspace,
  seedPlayer,
  seedGame,
  type TestUser,
} from '@/test-utils/integration';

// Mock next/headers to inject real session cookie
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('GET /api/players (Integration)', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    await clearEmulators();
    testUser = await createTestUser();
    await seedUserProfile(testUser.uid, { email: testUser.email });

    // Mock cookies to return real session cookie
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => name === '__session' ? { value: testUser.sessionCookie } : undefined,
    } as any);
  });

  it('returns empty players array when user has no players', async () => {
    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toEqual([]);
  });

  it('returns players with pending game counts', async () => {
    const playerId = await seedPlayer(testUser.uid, { name: 'Alex' });
    await seedGame(testUser.uid, playerId, { verified: false });
    await seedGame(testUser.uid, playerId, { verified: false });
    await seedGame(testUser.uid, playerId, { verified: true });

    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.players).toHaveLength(1);
    expect(data.players[0].name).toBe('Alex');
    expect(data.players[0].pendingGames).toBe(2);
  });

  it('includes parent email from user profile', async () => {
    await seedPlayer(testUser.uid, { name: 'Player 1' });

    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    expect(data.players[0].parentEmail).toBe(testUser.email);
  });

  it('returns 401 when no session cookie', async () => {
    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as any);

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it('returns multiple players ordered by name', async () => {
    await seedPlayer(testUser.uid, { name: 'Zara' });
    await seedPlayer(testUser.uid, { name: 'Alex' });

    const { GET } = await import('./route');
    const response = await GET();
    const data = await response.json();

    expect(data.players).toHaveLength(2);
    expect(data.players[0].name).toBe('Alex');
    expect(data.players[1].name).toBe('Zara');
  });
});
