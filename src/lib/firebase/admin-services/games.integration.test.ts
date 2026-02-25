/**
 * Integration Tests: Games Admin Service
 *
 * Tests real Firestore operations for deeply nested game subcollections.
 * Validates: subcollection paths, verified/unverified queries, date range queries,
 * cross-player aggregation, and timestamp conversions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
  seedGame,
} from '@/test-utils/integration';
import {
  getVerifiedGamesCountAdmin,
  getUnverifiedGamesCountAdmin,
  getSeasonGamesCountAdmin,
  getFirstPendingGameAdmin,
  getVerifiedGamesAdmin,
  getUnverifiedGamesAdmin,
  getAllGamesForPlayerAdmin,
  getAllGamesAdmin,
  createGameAdmin,
  getGameAdmin,
  verifyGameAdmin,
} from './games';

const TEST_USER_ID = 'test-user-games';

describe('Games Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createGameAdmin', () => {
    it('creates a game in the correct nested subcollection', async () => {
      const game = await createGameAdmin(TEST_USER_ID, playerId, {
        workspaceId: 'ws-1',
        date: new Date('2025-09-20'),
        opponent: 'Eagles FC',
        result: 'Win',
        finalScore: '2-0',
        minutesPlayed: 70,
        goals: 1,
        assists: 1,
      });

      expect(game.id).toBeTruthy();
      expect(game.opponent).toBe('Eagles FC');
      expect(game.result).toBe('Win');
      expect(game.goals).toBe(1);
      expect(game.assists).toBe(1);
      expect(game.verified).toBe(false); // Not E2E mode
      expect(game.verifiedAt).toBeNull();
      expect(game.date).toBeInstanceOf(Date);
      expect(game.createdAt).toBeInstanceOf(Date);
    });

    it('defaults nullable stats to null', async () => {
      const game = await createGameAdmin(TEST_USER_ID, playerId, {
        workspaceId: 'ws-1',
        date: new Date('2025-09-20'),
        opponent: 'Test',
        result: 'Draw',
        finalScore: '1-1',
        minutesPlayed: 45,
      });

      expect(game.tackles).toBeNull();
      expect(game.interceptions).toBeNull();
      expect(game.saves).toBeNull();
      expect(game.cleanSheet).toBeNull();
    });
  });

  describe('getGameAdmin', () => {
    it('returns null for non-existent game', async () => {
      const game = await getGameAdmin(TEST_USER_ID, playerId, 'nonexistent');
      expect(game).toBeNull();
    });

    it('retrieves game with timestamp conversion', async () => {
      const gameId = await seedGame(TEST_USER_ID, playerId, {
        opponent: 'Fetch Test FC',
      });

      const game = await getGameAdmin(TEST_USER_ID, playerId, gameId);
      expect(game).not.toBeNull();
      expect(game!.opponent).toBe('Fetch Test FC');
      expect(game!.date).toBeInstanceOf(Date);
      expect(game!.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('verifyGameAdmin', () => {
    it('marks a game as verified with timestamp', async () => {
      const gameId = await seedGame(TEST_USER_ID, playerId, { verified: false });

      await verifyGameAdmin(TEST_USER_ID, playerId, gameId);

      const game = await getGameAdmin(TEST_USER_ID, playerId, gameId);
      expect(game!.verified).toBe(true);
      expect(game!.verifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('getVerifiedGamesAdmin / getUnverifiedGamesAdmin', () => {
    it('separates verified and unverified games correctly', async () => {
      await seedGame(TEST_USER_ID, playerId, { verified: true, opponent: 'V1' });
      await seedGame(TEST_USER_ID, playerId, { verified: true, opponent: 'V2' });
      await seedGame(TEST_USER_ID, playerId, { verified: false, opponent: 'U1' });

      const verified = await getVerifiedGamesAdmin(TEST_USER_ID, playerId);
      const unverified = await getUnverifiedGamesAdmin(TEST_USER_ID, playerId);

      expect(verified).toHaveLength(2);
      expect(unverified).toHaveLength(1);
      expect(unverified[0].opponent).toBe('U1');
    });
  });

  describe('getVerifiedGamesCountAdmin', () => {
    it('counts verified games across all players', async () => {
      const player2 = await seedPlayer(TEST_USER_ID, { name: 'Player 2' });

      await seedGame(TEST_USER_ID, playerId, { verified: true });
      await seedGame(TEST_USER_ID, playerId, { verified: false });
      await seedGame(TEST_USER_ID, player2, { verified: true });

      const count = await getVerifiedGamesCountAdmin(TEST_USER_ID);
      expect(count).toBe(2);
    });

    it('returns 0 when no verified games exist', async () => {
      await seedGame(TEST_USER_ID, playerId, { verified: false });
      const count = await getVerifiedGamesCountAdmin(TEST_USER_ID);
      expect(count).toBe(0);
    });
  });

  describe('getUnverifiedGamesCountAdmin', () => {
    it('counts unverified games across all players', async () => {
      const player2 = await seedPlayer(TEST_USER_ID, { name: 'Player 2' });

      await seedGame(TEST_USER_ID, playerId, { verified: false });
      await seedGame(TEST_USER_ID, player2, { verified: false });
      await seedGame(TEST_USER_ID, player2, { verified: true });

      const count = await getUnverifiedGamesCountAdmin(TEST_USER_ID);
      expect(count).toBe(2);
    });
  });

  describe('getSeasonGamesCountAdmin', () => {
    it('counts verified games within date range', async () => {
      await seedGame(TEST_USER_ID, playerId, {
        verified: true,
        date: new Date('2025-09-01'),
      });
      await seedGame(TEST_USER_ID, playerId, {
        verified: true,
        date: new Date('2025-10-15'),
      });
      await seedGame(TEST_USER_ID, playerId, {
        verified: true,
        date: new Date('2025-08-01'), // outside range
      });
      await seedGame(TEST_USER_ID, playerId, {
        verified: false,
        date: new Date('2025-09-15'), // unverified
      });

      const count = await getSeasonGamesCountAdmin(
        TEST_USER_ID,
        new Date('2025-09-01'),
        new Date('2025-10-31')
      );
      expect(count).toBe(2);
    });
  });

  describe('getFirstPendingGameAdmin', () => {
    it('returns null when no unverified games exist', async () => {
      await seedGame(TEST_USER_ID, playerId, { verified: true });
      const result = await getFirstPendingGameAdmin(TEST_USER_ID);
      expect(result).toBeNull();
    });

    it('returns the player ID of the earliest unverified game', async () => {
      const player2 = await seedPlayer(TEST_USER_ID, { name: 'P2' });

      await seedGame(TEST_USER_ID, playerId, {
        verified: false,
        date: new Date('2025-10-01'),
      });
      await seedGame(TEST_USER_ID, player2, {
        verified: false,
        date: new Date('2025-09-01'), // earlier
      });

      const result = await getFirstPendingGameAdmin(TEST_USER_ID);
      expect(result).not.toBeNull();
      expect(result!.playerId).toBe(player2);
    });
  });

  describe('getAllGamesForPlayerAdmin', () => {
    it('returns all games for a player regardless of verified status', async () => {
      await seedGame(TEST_USER_ID, playerId, { verified: true });
      await seedGame(TEST_USER_ID, playerId, { verified: false });

      const games = await getAllGamesForPlayerAdmin(TEST_USER_ID, playerId);
      expect(games).toHaveLength(2);
    });
  });

  describe('getAllGamesAdmin', () => {
    it('returns games with player info attached', async () => {
      const player2 = await seedPlayer(TEST_USER_ID, {
        name: 'Star Player',
        primaryPosition: 'ST',
        position: 'ST',
      });

      await seedGame(TEST_USER_ID, playerId, { opponent: 'Team A' });
      await seedGame(TEST_USER_ID, player2, { opponent: 'Team B' });

      const allGames = await getAllGamesAdmin(TEST_USER_ID);
      expect(allGames).toHaveLength(2);

      const starPlayerGame = allGames.find(g => g.opponent === 'Team B');
      expect(starPlayerGame!.player.name).toBe('Star Player');
      expect(starPlayerGame!.player.id).toBe(player2);
    });
  });
});
