/**
 * Firebase Admin SDK - Workout Logs Service (Server-Side)
 *
 * Server-side Firestore operations for workout log documents.
 * Collection: /users/{userId}/players/{playerId}/workoutLogs/{logId}
 */

import { adminDb } from '../admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { WorkoutLog, WorkoutLogDocument, WorkoutLogType } from '@/types/firestore';
import type { WorkoutLogCreateInput, WorkoutLogUpdateInput } from '@/lib/validations/workout-log-schema';
import { calculateTotalVolume } from '@/lib/validations/workout-log-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore WorkoutLogDocument to WorkoutLog type
 */
function toWorkoutLog(id: string, doc: WorkoutLogDocument): WorkoutLog {
  return {
    id,
    playerId: doc.playerId,
    workoutId: doc.workoutId ?? null,
    date: toDate(doc.date),
    type: doc.type,
    title: doc.title,
    duration: doc.duration,
    exercises: doc.exercises,
    totalVolume: doc.totalVolume ?? null,
    completedAt: toDate(doc.completedAt),
    journalEntryId: doc.journalEntryId ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for workout logs
 */
function getWorkoutLogsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/workoutLogs`);
}

/**
 * Create a new workout log (Admin SDK)
 */
export async function createWorkoutLogAdmin(
  userId: string,
  playerId: string,
  data: WorkoutLogCreateInput
): Promise<WorkoutLog> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    const now = Timestamp.now();

    // Calculate total volume from exercises
    const totalVolume = calculateTotalVolume(data.exercises);

    // Use 'as unknown as' to bridge admin SDK Timestamp with client SDK type
    const docData = {
      playerId,
      workoutId: data.workoutId ?? null,
      date: Timestamp.fromDate(new Date(data.date)),
      type: data.type as WorkoutLogType,
      title: data.title,
      duration: data.duration,
      exercises: data.exercises,
      totalVolume,
      completedAt: now,
      journalEntryId: data.journalEntryId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await logsRef.add(docData);
    const doc = await docRef.get();

    return toWorkoutLog(docRef.id, doc.data() as WorkoutLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating workout log (Admin):', error);
    throw new Error(`Failed to create workout log: ${message}`);
  }
}

/**
 * Get single workout log by ID (Admin SDK)
 */
export async function getWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<WorkoutLog | null> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    const doc = await logsRef.doc(logId).get();

    if (!doc.exists) {
      return null;
    }

    return toWorkoutLog(doc.id, doc.data() as WorkoutLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching workout log (Admin):', error);
    throw new Error(`Failed to fetch workout log: ${message}`);
  }
}

/**
 * Get all workout logs for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getWorkoutLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    type?: WorkoutLogType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: WorkoutLog[]; nextCursor: string | null }> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    const limit = options?.limit ?? 20;

    console.log('[getWorkoutLogsAdmin] Fetching from:', `users/${userId}/players/${playerId}/workoutLogs`);

    // First, try to get all documents without orderBy to check if data exists
    const allDocsSnapshot = await logsRef.get();
    console.log('[getWorkoutLogsAdmin] Total documents in collection:', allDocsSnapshot.size);

    if (allDocsSnapshot.size === 0) {
      return { logs: [], nextCursor: null };
    }

    // Get all documents and sort in memory (more reliable than Firestore orderBy for subcollections)
    const allLogs = allDocsSnapshot.docs.map((doc) => {
      const data = doc.data() as WorkoutLogDocument;
      return toWorkoutLog(doc.id, data);
    });

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply type filter if specified
    let filteredLogs = allLogs;
    if (options?.type) {
      filteredLogs = filteredLogs.filter(log => log.type === options.type);
    }

    // Apply date range filters
    if (options?.startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.date) >= options.startDate!);
    }
    if (options?.endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.date) <= options.endDate!);
    }

    // Apply pagination
    let startIndex = 0;
    if (options?.cursor) {
      const cursorIndex = filteredLogs.findIndex(log => log.id === options.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + limit + 1);
    const hasNextPage = paginatedLogs.length > limit;
    const resultLogs = paginatedLogs.slice(0, limit);

    console.log('[getWorkoutLogsAdmin] Returning logs:', resultLogs.length);

    return {
      logs: resultLogs,
      nextCursor: hasNextPage ? resultLogs[resultLogs.length - 1]?.id ?? null : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching workout logs (Admin):', error);
    throw new Error(`Failed to fetch workout logs: ${message}`);
  }
}

/**
 * Update workout log (Admin SDK)
 */
export async function updateWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: WorkoutLogUpdateInput
): Promise<WorkoutLog> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    const docRef = logsRef.doc(logId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert date string to timestamp if provided
    if (data.date) {
      updateData.date = Timestamp.fromDate(new Date(data.date));
    }

    // Recalculate total volume if exercises updated
    if (data.exercises) {
      updateData.totalVolume = calculateTotalVolume(data.exercises);
    }

    await docRef.update(updateData);
    const doc = await docRef.get();

    return toWorkoutLog(doc.id, doc.data() as WorkoutLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating workout log (Admin):', error);
    throw new Error(`Failed to update workout log: ${message}`);
  }
}

/**
 * Delete workout log (Admin SDK)
 */
export async function deleteWorkoutLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    await logsRef.doc(logId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting workout log (Admin):', error);
    throw new Error(`Failed to delete workout log: ${message}`);
  }
}

/**
 * Get workout statistics for a player (Admin SDK)
 * Used for analytics dashboard
 */
export async function getWorkoutStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalWorkouts: number;
  totalDuration: number;
  totalVolume: number;
  workoutsByType: Record<WorkoutLogType, number>;
  averageDuration: number;
}> {
  try {
    const logsRef = getWorkoutLogsRef(userId, playerId);
    let query = logsRef.orderBy('date', 'desc');

    if (options?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(options.startDate));
    }
    if (options?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(options.endDate));
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => doc.data() as WorkoutLogDocument);

    const stats = {
      totalWorkouts: logs.length,
      totalDuration: 0,
      totalVolume: 0,
      workoutsByType: {} as Record<WorkoutLogType, number>,
      averageDuration: 0,
    };

    for (const log of logs) {
      stats.totalDuration += log.duration;
      stats.totalVolume += log.totalVolume ?? 0;
      stats.workoutsByType[log.type] = (stats.workoutsByType[log.type] ?? 0) + 1;
    }

    stats.averageDuration = logs.length > 0 ? stats.totalDuration / logs.length : 0;

    return stats;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching workout stats (Admin):', error);
    throw new Error(`Failed to fetch workout stats: ${message}`);
  }
}
