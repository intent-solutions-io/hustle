/**
 * Player Service
 *
 * CRUD operations for player profiles in Firestore.
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
import type { Player, PlayerDocument, SoccerPositionCode, LeagueCode, PlayerGender } from '../../types';

export interface CreatePlayerData {
  name: string;
  birthday: Date;
  gender: PlayerGender;
  primaryPosition: SoccerPositionCode;
  secondaryPositions?: SoccerPositionCode[];
  positionNote?: string;
  leagueCode: LeagueCode;
  leagueOtherName?: string;
  teamClub: string;
  photoUrl?: string | null;
}

export interface UpdatePlayerData extends Partial<CreatePlayerData> {}

/**
 * Get all players for a user
 */
export async function getPlayers(userId: string): Promise<Player[]> {
  const playersRef = collection(db, 'users', userId, 'players');
  const q = query(playersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as PlayerDocument;
    return {
      id: doc.id,
      ...data,
      birthday: data.birthday instanceof Timestamp ? data.birthday.toDate() : new Date(data.birthday),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Player;
  });
}

/**
 * Get a single player by ID
 */
export async function getPlayer(userId: string, playerId: string): Promise<Player | null> {
  const playerRef = doc(db, 'users', userId, 'players', playerId);
  const playerSnap = await getDoc(playerRef);

  if (!playerSnap.exists()) {
    return null;
  }

  const data = playerSnap.data() as PlayerDocument;
  return {
    id: playerSnap.id,
    ...data,
    birthday: data.birthday instanceof Timestamp ? data.birthday.toDate() : new Date(data.birthday),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as Player;
}

/**
 * Create a new player
 */
export async function createPlayer(userId: string, data: CreatePlayerData): Promise<string> {
  const playersRef = collection(db, 'users', userId, 'players');

  const playerDoc: Omit<PlayerDocument, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
    ...data,
    birthday: Timestamp.fromDate(data.birthday),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(playersRef, playerDoc);
  return docRef.id;
}

/**
 * Update an existing player
 */
export async function updatePlayer(
  userId: string,
  playerId: string,
  data: UpdatePlayerData
): Promise<void> {
  const playerRef = doc(db, 'users', userId, 'players', playerId);

  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  if (data.birthday) {
    updateData.birthday = Timestamp.fromDate(data.birthday);
  }

  await updateDoc(playerRef, updateData);
}

/**
 * Delete a player
 */
export async function deletePlayer(userId: string, playerId: string): Promise<void> {
  const playerRef = doc(db, 'users', userId, 'players', playerId);
  await deleteDoc(playerRef);
}
