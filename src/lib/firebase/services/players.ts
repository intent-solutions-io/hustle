/**
 * Firestore Players Service
 *
 * CRUD operations for player documents (subcollection of users).
 * Subcollection: /users/{userId}/players/{playerId}
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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { PlayerDocument, Player } from '@/types/firestore';

/**
 * Convert Firestore PlayerDocument to client Player type
 */
function toPlayer(id: string, data: PlayerDocument): Player {
  return {
    id,
    ...data,
    birthday: data.birthday.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
}

/**
 * Get all players for a user (ordered by creation date, newest first)
 */
export async function getPlayers(userId: string): Promise<Player[]> {
  const playersRef = collection(db, `users/${userId}/players`);
  const q = query(playersRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => toPlayer(doc.id, doc.data() as PlayerDocument));
}

/**
 * Get single player by ID
 */
export async function getPlayer(userId: string, playerId: string): Promise<Player | null> {
  const docRef = doc(db, `users/${userId}/players`, playerId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return toPlayer(docSnap.id, docSnap.data() as PlayerDocument);
}

/**
 * Create new player
 */
export async function createPlayer(
  userId: string,
  data: {
    name: string;
    birthday: Date;
    position: string;
    teamClub: string;
    photoUrl?: string | null;
  }
): Promise<Player> {
  const now = serverTimestamp();
  const playerDoc: Omit<PlayerDocument, 'createdAt' | 'updatedAt' | 'birthday'> & {
    birthday: Timestamp;
    createdAt: any;
    updatedAt: any;
  } = {
    name: data.name,
    birthday: Timestamp.fromDate(data.birthday),
    position: data.position,
    teamClub: data.teamClub,
    photoUrl: data.photoUrl || null,
    createdAt: now,
    updatedAt: now,
  };

  const playersRef = collection(db, `users/${userId}/players`);
  const docRef = await addDoc(playersRef, playerDoc);

  return {
    id: docRef.id,
    name: data.name,
    birthday: data.birthday,
    position: data.position,
    teamClub: data.teamClub,
    photoUrl: data.photoUrl || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update player
 */
export async function updatePlayer(
  userId: string,
  playerId: string,
  data: Partial<Pick<Player, 'name' | 'position' | 'teamClub' | 'photoUrl'>>
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players`, playerId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete player (cascade deletes games via Firestore rules)
 */
export async function deletePlayer(userId: string, playerId: string): Promise<void> {
  const docRef = doc(db, `users/${userId}/players`, playerId);
  await deleteDoc(docRef);
}
