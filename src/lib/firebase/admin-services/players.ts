/**
 * Firebase Admin SDK - Players Service (Server-Side)
 *
 * Server-side Firestore operations for player documents.
 * Used in Next.js server components and API routes.
 */

import { adminDb } from '../admin';
import type { Player, PlayerDocument } from '@/types/firestore';

/**
 * Convert Firestore PlayerDocument to Player type
 */
function toPlayer(id: string, doc: PlayerDocument): Player {
  return {
    id,
    ...doc,
  };
}

/**
 * Get all players for a user (Admin SDK)
 * @param userId - User UID
 * @returns Array of Player objects ordered by name ascending
 */
export async function getPlayersAdmin(userId: string): Promise<Player[]> {
  try {
    const playersRef = adminDb.collection(`users/${userId}/players`);
    const snapshot = await playersRef.orderBy('name', 'asc').get();

    return snapshot.docs.map((doc) =>
      toPlayer(doc.id, doc.data() as PlayerDocument)
    );
  } catch (error: any) {
    console.error('Error fetching players (Admin):', error);
    throw new Error(`Failed to fetch players: ${error.message}`);
  }
}

/**
 * Get single player by ID (Admin SDK)
 * @param userId - User UID
 * @param playerId - Player document ID
 * @returns Player object or null if not found
 */
export async function getPlayerAdmin(
  userId: string,
  playerId: string
): Promise<Player | null> {
  try {
    const playerRef = adminDb.collection(`users/${userId}/players`).doc(playerId);
    const doc = await playerRef.get();

    if (!doc.exists) {
      return null;
    }

    return toPlayer(doc.id, doc.data() as PlayerDocument);
  } catch (error: any) {
    console.error('Error fetching player (Admin):', error);
    throw new Error(`Failed to fetch player: ${error.message}`);
  }
}

/**
 * Get players count for a user (Admin SDK)
 * @param userId - User UID
 * @returns Number of players
 */
export async function getPlayersCountAdmin(userId: string): Promise<number> {
  try {
    const playersRef = adminDb.collection(`users/${userId}/players`);
    const snapshot = await playersRef.get();
    return snapshot.size;
  } catch (error: any) {
    console.error('Error counting players (Admin):', error);
    throw new Error(`Failed to count players: ${error.message}`);
  }
}
