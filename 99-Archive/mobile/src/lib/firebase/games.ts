/**
 * Game Service
 *
 * CRUD operations for game statistics in Firestore.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Game, GameDocument, GameResult } from '../../types';

export interface CreateGameData {
  date: Date;
  opponent: string;
  result: GameResult;
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocks?: number | null;
  aerialDuelsWon?: number | null;
  saves?: number | null;
  goalsAgainst?: number | null;
  cleanSheet?: boolean | null;
}

export interface UpdateGameData extends Partial<CreateGameData> {
  verified?: boolean;
}

/**
 * Get all games for a player
 */
export async function getGames(userId: string, playerId: string): Promise<Game[]> {
  const gamesRef = collection(db, 'users', userId, 'players', playerId, 'games');
  const q = query(gamesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as GameDocument;
    return {
      id: doc.id,
      ...data,
      date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
      verifiedAt: data.verifiedAt instanceof Timestamp ? data.verifiedAt.toDate() : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Game;
  });
}

/**
 * Get a single game by ID
 */
export async function getGame(
  userId: string,
  playerId: string,
  gameId: string
): Promise<Game | null> {
  const gameRef = doc(db, 'users', userId, 'players', playerId, 'games', gameId);
  const gameSnap = await getDoc(gameRef);

  if (!gameSnap.exists()) {
    return null;
  }

  const data = gameSnap.data() as GameDocument;
  return {
    id: gameSnap.id,
    ...data,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    verifiedAt: data.verifiedAt instanceof Timestamp ? data.verifiedAt.toDate() : null,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as Game;
}

/**
 * Create a new game
 */
export async function createGame(
  userId: string,
  playerId: string,
  data: CreateGameData
): Promise<string> {
  const gamesRef = collection(db, 'users', userId, 'players', playerId, 'games');

  const gameDoc: Omit<GameDocument, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
    ...data,
    date: Timestamp.fromDate(data.date),
    verified: false,
    verifiedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(gamesRef, gameDoc);
  return docRef.id;
}

/**
 * Update an existing game
 */
export async function updateGame(
  userId: string,
  playerId: string,
  gameId: string,
  data: UpdateGameData
): Promise<void> {
  const gameRef = doc(db, 'users', userId, 'players', playerId, 'games', gameId);

  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.date) {
    updateData.date = Timestamp.fromDate(data.date);
  }

  if (data.verified) {
    updateData.verifiedAt = serverTimestamp();
  }

  await updateDoc(gameRef, updateData);
}

/**
 * Delete a game
 */
export async function deleteGame(
  userId: string,
  playerId: string,
  gameId: string
): Promise<void> {
  const gameRef = doc(db, 'users', userId, 'players', playerId, 'games', gameId);
  await deleteDoc(gameRef);
}

/**
 * Calculate aggregate stats for a player
 */
export function calculatePlayerStats(games: Game[]): {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  goalsPerGame: number;
  assistsPerGame: number;
} {
  const stats = games.reduce(
    (acc, game) => ({
      totalGames: acc.totalGames + 1,
      wins: acc.wins + (game.result === 'Win' ? 1 : 0),
      losses: acc.losses + (game.result === 'Loss' ? 1 : 0),
      draws: acc.draws + (game.result === 'Draw' ? 1 : 0),
      goals: acc.goals + game.goals,
      assists: acc.assists + game.assists,
      minutesPlayed: acc.minutesPlayed + game.minutesPlayed,
    }),
    {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      goals: 0,
      assists: 0,
      minutesPlayed: 0,
    }
  );

  return {
    ...stats,
    goalsPerGame: stats.totalGames > 0 ? stats.goals / stats.totalGames : 0,
    assistsPerGame: stats.totalGames > 0 ? stats.assists / stats.totalGames : 0,
  };
}
