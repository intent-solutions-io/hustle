/**
 * Firebase Admin SDK - Games Service (Server-Side)
 *
 * Server-side Firestore operations for game documents.
 * Used in Next.js server components and API routes.
 *
 * Games are nested subcollections: users/{userId}/players/{playerId}/games/{gameId}
 * Aggregation queries must iterate over all players.
 */

import { adminDb } from '../admin';
import type { Game, GameDocument } from '@/types/firestore';

/**
 * Convert Firestore GameDocument to Game type
 */
function toGame(id: string, doc: GameDocument): Game {
  return {
    id,
    ...doc,
    date: doc.date instanceof Date ? doc.date : (doc.date as any).toDate(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt : (doc.createdAt as any).toDate(),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt : (doc.updatedAt as any).toDate(),
  };
}

/**
 * Count verified games across all players for a user (Admin SDK)
 * @param userId - User UID
 * @returns Number of verified games
 */
export async function getVerifiedGamesCountAdmin(userId: string): Promise<number> {
  try {
    // Get all players for this user
    const playersSnapshot = await adminDb.collection(`users/${userId}/players`).get();

    let totalCount = 0;

    // For each player, count verified games
    for (const playerDoc of playersSnapshot.docs) {
      const gamesSnapshot = await adminDb
        .collection(`users/${userId}/players/${playerDoc.id}/games`)
        .where('verified', '==', true)
        .get();

      totalCount += gamesSnapshot.size;
    }

    return totalCount;
  } catch (error: any) {
    console.error('Error counting verified games (Admin):', error);
    throw new Error(`Failed to count verified games: ${error.message}`);
  }
}

/**
 * Count unverified games across all players for a user (Admin SDK)
 * @param userId - User UID
 * @returns Number of unverified games
 */
export async function getUnverifiedGamesCountAdmin(userId: string): Promise<number> {
  try {
    // Get all players for this user
    const playersSnapshot = await adminDb.collection(`users/${userId}/players`).get();

    let totalCount = 0;

    // For each player, count unverified games
    for (const playerDoc of playersSnapshot.docs) {
      const gamesSnapshot = await adminDb
        .collection(`users/${userId}/players/${playerDoc.id}/games`)
        .where('verified', '==', false)
        .get();

      totalCount += gamesSnapshot.size;
    }

    return totalCount;
  } catch (error: any) {
    console.error('Error counting unverified games (Admin):', error);
    throw new Error(`Failed to count unverified games: ${error.message}`);
  }
}

/**
 * Count verified games within a date range across all players (Admin SDK)
 * Used for season stats (e.g., Aug 1 - Jul 31)
 *
 * @param userId - User UID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of verified games in date range
 */
export async function getSeasonGamesCountAdmin(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Get all players for this user
    const playersSnapshot = await adminDb.collection(`users/${userId}/players`).get();

    let totalCount = 0;

    // For each player, count verified games in date range
    for (const playerDoc of playersSnapshot.docs) {
      const gamesSnapshot = await adminDb
        .collection(`users/${userId}/players/${playerDoc.id}/games`)
        .where('verified', '==', true)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();

      totalCount += gamesSnapshot.size;
    }

    return totalCount;
  } catch (error: any) {
    console.error('Error counting season games (Admin):', error);
    throw new Error(`Failed to count season games: ${error.message}`);
  }
}

/**
 * Find the first unverified game (earliest by date) across all players (Admin SDK)
 * @param userId - User UID
 * @returns Object with playerId or null if no unverified games
 */
export async function getFirstPendingGameAdmin(
  userId: string
): Promise<{ playerId: string } | null> {
  try {
    // Get all players for this user
    const playersSnapshot = await adminDb.collection(`users/${userId}/players`).get();

    let earliestGame: { playerId: string; date: Date } | null = null;

    // For each player, find earliest unverified game
    for (const playerDoc of playersSnapshot.docs) {
      const gamesSnapshot = await adminDb
        .collection(`users/${userId}/players/${playerDoc.id}/games`)
        .where('verified', '==', false)
        .orderBy('date', 'asc')
        .limit(1)
        .get();

      if (!gamesSnapshot.empty) {
        const gameDoc = gamesSnapshot.docs[0];
        const gameData = gameDoc.data() as GameDocument;
        const gameDate = gameData.date instanceof Date ? gameData.date : (gameData.date as any).toDate();

        // Keep track of earliest game across all players
        if (!earliestGame || gameDate < earliestGame.date) {
          earliestGame = {
            playerId: playerDoc.id,
            date: gameDate,
          };
        }
      }
    }

    return earliestGame ? { playerId: earliestGame.playerId } : null;
  } catch (error: any) {
    console.error('Error finding first pending game (Admin):', error);
    throw new Error(`Failed to find first pending game: ${error.message}`);
  }
}

/**
 * Get all verified games for a specific player (Admin SDK)
 * @param userId - User UID
 * @param playerId - Player document ID
 * @returns Array of Game objects ordered by date descending
 */
export async function getVerifiedGamesAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  try {
    const gamesRef = adminDb.collection(`users/${userId}/players/${playerId}/games`);
    const snapshot = await gamesRef
      .where('verified', '==', true)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
  } catch (error: any) {
    console.error('Error fetching verified games (Admin):', error);
    throw new Error(`Failed to fetch verified games: ${error.message}`);
  }
}

/**
 * Get all unverified games for a specific player (Admin SDK)
 * @param userId - User UID
 * @param playerId - Player document ID
 * @returns Array of Game objects ordered by date descending
 */
export async function getUnverifiedGamesAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  try {
    const gamesRef = adminDb.collection(`users/${userId}/players/${playerId}/games`);
    const snapshot = await gamesRef
      .where('verified', '==', false)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
  } catch (error: any) {
    console.error('Error fetching unverified games (Admin):', error);
    throw new Error(`Failed to fetch unverified games: ${error.message}`);
  }
}

/**
 * Get all games for a specific player (Admin SDK)
 * Both verified and unverified games ordered by date descending
 *
 * @param userId - User UID
 * @param playerId - Player document ID
 * @returns Array of all Game objects for this player
 */
export async function getAllGamesForPlayerAdmin(
  userId: string,
  playerId: string
): Promise<Game[]> {
  try {
    const gamesRef = adminDb.collection(`users/${userId}/players/${playerId}/games`);
    const snapshot = await gamesRef.orderBy('date', 'desc').get();

    return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
  } catch (error: any) {
    console.error('Error fetching all games for player (Admin):', error);
    throw new Error(`Failed to fetch games for player: ${error.message}`);
  }
}

/**
 * Get ALL games across all players for a user (Admin SDK)
 * Used for analytics aggregation
 *
 * @param userId - User UID
 * @returns Array of all Game objects with player info attached
 */
export async function getAllGamesAdmin(
  userId: string
): Promise<Array<Game & { player: { id: string; name: string; position: string } }>> {
  try {
    // Get all players for this user
    const playersSnapshot = await adminDb.collection(`users/${userId}/players`).get();

    const allGames: Array<Game & { player: { id: string; name: string; position: string } }> = [];

    // For each player, fetch all games
    for (const playerDoc of playersSnapshot.docs) {
      const playerData = playerDoc.data();
      const gamesSnapshot = await adminDb
        .collection(`users/${userId}/players/${playerDoc.id}/games`)
        .orderBy('date', 'desc')
        .get();

      // Add player info to each game
      const gamesWithPlayer = gamesSnapshot.docs.map((gameDoc) => ({
        ...toGame(gameDoc.id, gameDoc.data() as GameDocument),
        player: {
          id: playerDoc.id,
          name: playerData.name,
          position: playerData.position,
        },
      }));

      allGames.push(...gamesWithPlayer);
    }

    return allGames;
  } catch (error: any) {
    console.error('Error fetching all games (Admin):', error);
    throw new Error(`Failed to fetch all games: ${error.message}`);
  }
}
