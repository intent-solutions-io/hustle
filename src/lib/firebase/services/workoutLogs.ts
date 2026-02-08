/**
 * Firestore Service for Workouts
 *
 * Manages CRUD operations for user-logged workouts.
 */
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config';
import type { WorkoutLog, WorkoutLogDocument } from '@/types/firestore';

const WORKOUTS_COLLECTION = 'workoutLogs';

/**
 * Create a new workout log document in Firestore
 *
 * @param userId The ID of the user logging the workout
 * @param playerId The ID of the player the workout is for
 * @param data The workout log data to save
 * @returns The ID of the newly created workout log document
 */
export async function createWorkoutLog(
  userId: string,
  playerId: string,
  data: Omit<WorkoutLogDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'playerId'>
): Promise<string> {
  const workoutData = {
    ...data,
    userId,
    playerId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const docRef = await addDoc(collection(db, `users/${userId}/players/${playerId}/${WORKOUTS_COLLECTION}`), workoutData);
  return docRef.id;
}

/**
 * Get all workout logs for a specific player
 *
 * @param userId The ID of the user
 * @param playerId The ID of the player to fetch workout logs for
 * @returns An array of workout log documents
 */
export async function getWorkoutLogs(userId: string, playerId: string): Promise<WorkoutLog[]> {
  const q = query(
    collection(db, `users/${userId}/players/${playerId}/${WORKOUTS_COLLECTION}`),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const workouts: WorkoutLog[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    workouts.push({
      id: doc.id,
      ...data,
      date: (data.date as Timestamp).toDate(),
      completedAt: (data.completedAt as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
    } as WorkoutLog);
  });

  return workouts;
}
