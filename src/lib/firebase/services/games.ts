/**
 * Firestore Games Service
 *
 * CRUD operations for game documents (subcollection of players).
 * Subcollection: /users/{userId}/players/{playerId}/games/{gameId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { GameDocument, Game } from '@/types/firestore';

/**
 * Convert Firestore GameDocument to client Game type
 */
function toGame(id: string, data: GameDocument): Game {
  return {
    id,
    ...data,
    date: data.date.toDate(),
    verifiedAt: data.verifiedAt?.toDate() || null,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

/**
 * Get all games for a player (ordered by date, newest first)
 */
export async function getGames(userId: string, playerId: string): Promise<Game[]> {
  const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
  const q = query(gamesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
}

/**
 * Get verified games only
 */
export async function getVerifiedGames(userId: string, playerId: string): Promise<Game[]> {
  const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
  const q = query(gamesRef, where('verified', '==', true), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
}

/**
 * Get unverified games only
 */
export async function getUnverifiedGames(userId: string, playerId: string): Promise<Game[]> {
  const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
  const q = query(gamesRef, where('verified', '==', false), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
}

/**
 * Get games by result (Win/Loss/Draw)
 */
export async function getGamesByResult(
  userId: string,
  playerId: string,
  result: 'Win' | 'Loss' | 'Draw'
): Promise<Game[]> {
  const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
  const q = query(gamesRef, where('result', '==', result), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => toGame(doc.id, doc.data() as GameDocument));
}

/**
 * Get single game by ID
 */
export async function getGame(userId: string, playerId: string, gameId: string): Promise<Game | null> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return toGame(docSnap.id, docSnap.data() as GameDocument);
}

/**
 * Create new game
 */
export async function createGame(
  userId: string,
  playerId: string,
  data: {
    date: Date;
    opponent: string;
    result: 'Win' | 'Loss' | 'Draw';
    finalScore: string;
    minutesPlayed: number;
    goals?: number;
    assists?: number;
    tackles?: number | null;
    interceptions?: number | null;
    clearances?: number | null;
    blocks?: number | null;
    aerialDuelsWon?: number | null;
    saves?: number | null;
    goalsAgainst?: number | null;
    cleanSheet?: boolean | null;
  }
): Promise<Game> {
  const now = serverTimestamp();
  const gameDoc: Omit<GameDocument, 'createdAt' | 'updatedAt' | 'date' | 'verifiedAt'> & {
    date: Timestamp;
    createdAt: any;
    updatedAt: any;
  } = {
    date: Timestamp.fromDate(data.date),
    opponent: data.opponent,
    result: data.result,
    finalScore: data.finalScore,
    minutesPlayed: data.minutesPlayed,
    goals: data.goals || 0,
    assists: data.assists || 0,
    tackles: data.tackles ?? null,
    interceptions: data.interceptions ?? null,
    clearances: data.clearances ?? null,
    blocks: data.blocks ?? null,
    aerialDuelsWon: data.aerialDuelsWon ?? null,
    saves: data.saves ?? null,
    goalsAgainst: data.goalsAgainst ?? null,
    cleanSheet: data.cleanSheet ?? null,
    verified: false,
    createdAt: now,
    updatedAt: now,
  };

  const gamesRef = collection(db, `users/${userId}/players/${playerId}/games`);
  const docRef = await addDoc(gamesRef, gameDoc);

  return {
    id: docRef.id,
    ...gameDoc,
    date: data.date,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update game
 */
export async function updateGame(
  userId: string,
  playerId: string,
  gameId: string,
  data: Partial<
    Pick<
      Game,
      | 'opponent'
      | 'result'
      | 'finalScore'
      | 'minutesPlayed'
      | 'goals'
      | 'assists'
      | 'tackles'
      | 'interceptions'
      | 'clearances'
      | 'blocks'
      | 'aerialDuelsWon'
      | 'saves'
      | 'goalsAgainst'
      | 'cleanSheet'
    >
  >
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Verify game (with PIN verification)
 */
export async function verifyGame(userId: string, playerId: string, gameId: string): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
  await updateDoc(docRef, {
    verified: true,
    verifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete game
 */
export async function deleteGame(userId: string, playerId: string, gameId: string): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/games`, gameId);
  await deleteDoc(docRef);
}
