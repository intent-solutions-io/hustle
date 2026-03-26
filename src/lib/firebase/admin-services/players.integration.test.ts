/**
 * Integration Tests: Players Admin Service
 *
 * Tests real Firestore CRUD operations against the Firebase Emulator.
 * No mocks — validates collection paths, timestamp conversions, and query behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
  readDoc,
  readCollection,
} from '@/test-utils/integration';
import {
  getPlayersAdmin,
  getPlayerAdmin,
  getPlayersCountAdmin,
  createPlayerAdmin,
  updatePlayerAdmin,
  deletePlayerAdmin,
} from './players';

const TEST_USER_ID = 'test-user-players';

describe('Players Admin Service (Integration)', () => {
  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
  });

  describe('createPlayerAdmin', () => {
    it('creates a player in the correct subcollection path', async () => {
      const player = await createPlayerAdmin(TEST_USER_ID, {
        workspaceId: 'ws-1',
        name: 'Alex Johnson',
        birthday: new Date('2012-03-15'),
        gender: 'male',
        primaryPosition: 'CM',
        secondaryPositions: ['AM', 'DM'],
        leagueCode: 'REC',
        teamClub: 'Thunder FC',
      });

      expect(player.id).toBeTruthy();
      expect(player.name).toBe('Alex Johnson');
      expect(player.primaryPosition).toBe('CM');
      expect(player.secondaryPositions).toEqual(['AM', 'DM']);
      expect(player.birthday).toBeInstanceOf(Date);
      expect(player.createdAt).toBeInstanceOf(Date);

      // Verify it's actually in Firestore
      const raw = await readDoc(`users/${TEST_USER_ID}/players/${player.id}`);
      expect(raw).not.toBeNull();
      expect(raw!.name).toBe('Alex Johnson');
    });

    it('sets optional fields to null when not provided', async () => {
      const player = await createPlayerAdmin(TEST_USER_ID, {
        workspaceId: 'ws-1',
        name: 'Min Player',
        birthday: new Date('2013-01-01'),
        gender: 'female',
        primaryPosition: 'GK',
        leagueCode: 'REC',
        teamClub: 'Stars',
      });

      expect(player.photoUrl).toBeUndefined();
      expect(player.positionNote).toBeUndefined();
      expect(player.leagueOtherName).toBeUndefined();
    });

    it('stores birthday as a Firestore Timestamp', async () => {
      const birthday = new Date('2012-06-15');
      const player = await createPlayerAdmin(TEST_USER_ID, {
        workspaceId: 'ws-1',
        name: 'Timestamp Test',
        birthday,
        gender: 'male',
        primaryPosition: 'ST',
        leagueCode: 'REC',
        teamClub: 'FC',
      });

      // Read back and verify timestamp conversion
      const fetched = await getPlayerAdmin(TEST_USER_ID, player.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.birthday).toBeInstanceOf(Date);
      expect(fetched!.birthday.getFullYear()).toBe(2012);
      expect(fetched!.birthday.getMonth()).toBe(5); // June = 5
    });
  });

  describe('getPlayersAdmin', () => {
    it('returns empty array when user has no players', async () => {
      const players = await getPlayersAdmin(TEST_USER_ID);
      expect(players).toEqual([]);
    });

    it('returns players ordered by name ascending', async () => {
      await seedPlayer(TEST_USER_ID, { name: 'Charlie' });
      await seedPlayer(TEST_USER_ID, { name: 'Alice' });
      await seedPlayer(TEST_USER_ID, { name: 'Bob' });

      const players = await getPlayersAdmin(TEST_USER_ID);
      expect(players).toHaveLength(3);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[2].name).toBe('Charlie');
    });

    it('converts all Timestamp fields to Date', async () => {
      await seedPlayer(TEST_USER_ID);
      const players = await getPlayersAdmin(TEST_USER_ID);

      expect(players[0].birthday).toBeInstanceOf(Date);
      expect(players[0].createdAt).toBeInstanceOf(Date);
      expect(players[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPlayerAdmin', () => {
    it('returns null for non-existent player', async () => {
      const player = await getPlayerAdmin(TEST_USER_ID, 'nonexistent');
      expect(player).toBeNull();
    });

    it('returns the correct player by ID', async () => {
      const playerId = await seedPlayer(TEST_USER_ID, { name: 'Specific Player' });
      const player = await getPlayerAdmin(TEST_USER_ID, playerId);

      expect(player).not.toBeNull();
      expect(player!.id).toBe(playerId);
      expect(player!.name).toBe('Specific Player');
    });
  });

  describe('getPlayersCountAdmin', () => {
    it('returns 0 when no players exist', async () => {
      const count = await getPlayersCountAdmin(TEST_USER_ID);
      expect(count).toBe(0);
    });

    it('returns correct count', async () => {
      await seedPlayer(TEST_USER_ID, { name: 'P1' });
      await seedPlayer(TEST_USER_ID, { name: 'P2' });
      await seedPlayer(TEST_USER_ID, { name: 'P3' });

      const count = await getPlayersCountAdmin(TEST_USER_ID);
      expect(count).toBe(3);
    });
  });

  describe('updatePlayerAdmin', () => {
    it('updates specific fields without affecting others', async () => {
      const playerId = await seedPlayer(TEST_USER_ID, {
        name: 'Original Name',
        teamClub: 'Original FC',
      });

      await updatePlayerAdmin(TEST_USER_ID, playerId, { name: 'Updated Name' });

      const player = await getPlayerAdmin(TEST_USER_ID, playerId);
      expect(player!.name).toBe('Updated Name');
      expect(player!.teamClub).toBe('Original FC'); // unchanged
    });

    it('updates the updatedAt timestamp', async () => {
      const playerId = await seedPlayer(TEST_USER_ID);
      const before = await getPlayerAdmin(TEST_USER_ID, playerId);

      // Small delay to ensure timestamp difference
      await new Promise(r => setTimeout(r, 50));
      await updatePlayerAdmin(TEST_USER_ID, playerId, { name: 'Updated' });

      const after = await getPlayerAdmin(TEST_USER_ID, playerId);
      expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
    });
  });

  describe('deletePlayerAdmin', () => {
    it('removes the player document from Firestore', async () => {
      const playerId = await seedPlayer(TEST_USER_ID);
      expect(await getPlayerAdmin(TEST_USER_ID, playerId)).not.toBeNull();

      await deletePlayerAdmin(TEST_USER_ID, playerId);
      expect(await getPlayerAdmin(TEST_USER_ID, playerId)).toBeNull();
    });

    it('does not affect other players', async () => {
      const id1 = await seedPlayer(TEST_USER_ID, { name: 'Keep' });
      const id2 = await seedPlayer(TEST_USER_ID, { name: 'Delete' });

      await deletePlayerAdmin(TEST_USER_ID, id2);

      expect(await getPlayerAdmin(TEST_USER_ID, id1)).not.toBeNull();
      expect(await getPlayersCountAdmin(TEST_USER_ID)).toBe(1);
    });
  });
});
