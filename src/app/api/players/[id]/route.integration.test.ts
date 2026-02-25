/**
 * Integration Tests: Player [id] API Route (GET/PUT/DELETE /api/players/[id])
 *
 * Tests route handlers with real Firestore data and workspace enforcement.
 * Only mock: next/headers cookies().
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  clearEmulators,
  createTestUser,
  seedUserProfile,
  seedWorkspace,
  seedPlayer,
  type TestUser,
} from '@/test-utils/integration';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';

// Mock next/headers to inject real session cookie
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('/api/players/[id] (Integration)', () => {
  let testUser: TestUser;
  let workspaceId: string;
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    testUser = await createTestUser();
    await seedUserProfile(testUser.uid, { email: testUser.email });
    workspaceId = await seedWorkspace(testUser.uid);
    playerId = await seedPlayer(testUser.uid, {
      name: 'Test Player',
      workspaceId,
    });

    const { cookies } = await import('next/headers');
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => name === '__session' ? { value: testUser.sessionCookie } : undefined,
    } as any);
  });

  describe('GET', () => {
    it('returns player by ID', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId);
      const response = await GET(request, { params: Promise.resolve({ id: playerId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.player.name).toBe('Test Player');
      expect(data.player.id).toBe(playerId);
    });

    it('returns 404 for non-existent player', async () => {
      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/nonexistent');
      const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) });

      expect(response.status).toBe(404);
    });

    it('returns 401 when not authenticated', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: () => undefined,
      } as any);

      const { GET } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId);
      const response = await GET(request, { params: Promise.resolve({ id: playerId }) });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT', () => {
    it('updates player fields', async () => {
      const { PUT } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
          birthday: '2012-06-15',
          position: 'ST',
          teamClub: 'New FC',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: playerId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.player.name).toBe('Updated Name');

      // Verify persisted in Firestore
      const fetched = await getPlayerAdmin(testUser.uid, playerId);
      expect(fetched!.name).toBe('Updated Name');
    });

    it('returns 400 for missing required fields', async () => {
      const { PUT } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId, {
        method: 'PUT',
        body: JSON.stringify({ name: 'Only Name' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: playerId }) });
      expect(response.status).toBe(400);
    });

    it('returns 404 for non-existent player', async () => {
      const { PUT } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'A', birthday: '2012-01-01', position: 'CM', teamClub: 'FC',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });

    it('blocks update when workspace is suspended', async () => {
      // Update workspace to suspended
      const { getAdminDb } = await import('@/lib/firebase/admin');
      await getAdminDb().collection('workspaces').doc(workspaceId).update({ status: 'suspended' });

      const { PUT } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'A', birthday: '2012-01-01', position: 'CM', teamClub: 'FC',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request, { params: Promise.resolve({ id: playerId }) });
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE', () => {
    it('deletes player and returns success', async () => {
      const { DELETE } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/' + playerId, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: playerId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify deleted from Firestore
      const fetched = await getPlayerAdmin(testUser.uid, playerId);
      expect(fetched).toBeNull();
    });

    it('returns 404 for non-existent player', async () => {
      const { DELETE } = await import('./route');
      const request = new NextRequest('http://localhost/api/players/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) });
      expect(response.status).toBe(404);
    });
  });
});
