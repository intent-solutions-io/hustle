/**
 * Firebase Admin SDK - Players Service (Server-Side)
 *
 * Server-side Firestore operations for player documents.
 * Used in Next.js server components and API routes.
 */

import { adminDb } from '../admin';
import type { Player, PlayerDocument, SoccerPositionCode, PlayerGender } from '@/types/firestore';
import type { LeagueCode } from '@/types/league';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Convert Firestore PlayerDocument to Player type
 */
function toPlayer(id: string, doc: PlayerDocument): Player {
  const convertTimestamp = (ts: unknown): Date => {
    if (ts instanceof Date) return ts;
    if (ts && typeof (ts as { toDate?: () => Date }).toDate === 'function') {
      return (ts as { toDate: () => Date }).toDate();
    }
    return new Date();
  };

  return {
    id,
    ...doc,
    birthday: convertTimestamp(doc.birthday),
    createdAt: convertTimestamp(doc.createdAt),
    updatedAt: convertTimestamp(doc.updatedAt),
    // Convert null to undefined for optional string fields
    leagueOtherName: doc.leagueOtherName ?? undefined,
    positionNote: doc.positionNote ?? undefined,
    photoUrl: doc.photoUrl ?? undefined,
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

/**
 * Create a new player (Admin SDK)
 * @param userId - User UID
 * @param data - Player data
 * @returns Created player with ID
 */
export async function createPlayerAdmin(
  userId: string,
  data: {
    workspaceId: string;
    name: string;
    birthday: Date;
    gender: PlayerGender;
    primaryPosition: SoccerPositionCode;
    secondaryPositions?: SoccerPositionCode[];
    positionNote?: string | null;
    leagueCode: LeagueCode;
    leagueOtherName?: string | null;
    teamClub: string;
    photoUrl?: string | null;
  }
): Promise<Player> {
  try {
    const now = new Date();
    // Build player document, excluding undefined fields to satisfy Firestore
    const playerDoc = {
      workspaceId: data.workspaceId,
      name: data.name,
      birthday: Timestamp.fromDate(data.birthday),
      gender: data.gender,
      primaryPosition: data.primaryPosition,
      position: data.primaryPosition, // Legacy field for backward compatibility
      secondaryPositions: data.secondaryPositions ?? [],
      leagueCode: data.leagueCode,
      teamClub: data.teamClub,
      photoUrl: data.photoUrl ?? null,
      createdAt: now,
      updatedAt: now,
      // Only include optional string fields if they have a value
      ...(data.positionNote ? { positionNote: data.positionNote } : {}),
      ...(data.leagueOtherName ? { leagueOtherName: data.leagueOtherName } : {}),
    };

    const playersRef = adminDb.collection(`users/${userId}/players`);
    const docRef = await playersRef.add(playerDoc);

    return {
      id: docRef.id,
      workspaceId: data.workspaceId,
      name: data.name,
      birthday: data.birthday,
      gender: data.gender,
      primaryPosition: data.primaryPosition,
      secondaryPositions: data.secondaryPositions,
      positionNote: data.positionNote ?? undefined,
      leagueCode: data.leagueCode,
      leagueOtherName: data.leagueOtherName ?? undefined,
      teamClub: data.teamClub,
      photoUrl: data.photoUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error: any) {
    console.error('Error creating player (Admin):', error);
    throw new Error(`Failed to create player: ${error.message}`);
  }
}
