/**
 * Firebase Admin SDK - Cardio Logs Service (Server-Side)
 *
 * Server-side Firestore operations for cardio log documents.
 * Collection: /users/{userId}/players/{playerId}/cardioLogs/{logId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { CardioLog, CardioLogDocument, CardioActivityType } from '@/types/firestore';
import type { CardioLogCreateInput, CardioLogUpdateInput } from '@/lib/validations/cardio-log-schema';
import { calculatePace } from '@/lib/validations/cardio-log-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore CardioLogDocument to CardioLog type
 */
function toCardioLog(id: string, doc: CardioLogDocument): CardioLog {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    activityType: doc.activityType,
    distanceMiles: doc.distanceMiles,
    durationMinutes: doc.durationMinutes,
    avgPacePerMile: doc.avgPacePerMile ?? null,
    calories: doc.calories ?? null,
    avgHeartRate: doc.avgHeartRate ?? null,
    maxHeartRate: doc.maxHeartRate ?? null,
    location: doc.location ?? null,
    weather: doc.weather ?? null,
    notes: doc.notes ?? null,
    perceivedEffort: doc.perceivedEffort ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for cardio logs
 */
function getCardioLogsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/cardioLogs`);
}

/**
 * Create a new cardio log (Admin SDK)
 */
export async function createCardioLogAdmin(
  userId: string,
  playerId: string,
  data: CardioLogCreateInput
): Promise<CardioLog> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    const now = Timestamp.now();

    // Auto-calculate pace if not provided
    const avgPacePerMile = data.avgPacePerMile ?? calculatePace(data.distanceMiles, data.durationMinutes);

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      activityType: data.activityType as CardioActivityType,
      distanceMiles: data.distanceMiles,
      durationMinutes: data.durationMinutes,
      avgPacePerMile,
      calories: data.calories ?? null,
      avgHeartRate: data.avgHeartRate ?? null,
      maxHeartRate: data.maxHeartRate ?? null,
      location: data.location ?? null,
      weather: data.weather ?? null,
      notes: data.notes ?? null,
      perceivedEffort: data.perceivedEffort ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await logsRef.add(docData);
    const doc = await docRef.get();

    return toCardioLog(docRef.id, doc.data() as CardioLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating cardio log (Admin):', error);
    throw new Error(`Failed to create cardio log: ${message}`);
  }
}

/**
 * Get single cardio log by ID (Admin SDK)
 */
export async function getCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<CardioLog | null> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    const doc = await logsRef.doc(logId).get();

    if (!doc.exists) {
      return null;
    }

    return toCardioLog(doc.id, doc.data() as CardioLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching cardio log (Admin):', error);
    throw new Error(`Failed to fetch cardio log: ${message}`);
  }
}

/**
 * Get all cardio logs for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getCardioLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    activityType?: CardioActivityType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: CardioLog[]; nextCursor: string | null }> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    const limit = options?.limit ?? 20;

    // Fetch all documents and sort in memory (more reliable than Firestore orderBy for subcollections)
    const allDocsSnapshot = await logsRef.get();

    if (allDocsSnapshot.size === 0) {
      return { logs: [], nextCursor: null };
    }

    // Get all documents and convert to CardioLog
    const allLogs = allDocsSnapshot.docs.map((doc) => {
      const data = doc.data() as CardioLogDocument;
      return toCardioLog(doc.id, data);
    });

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply activity type filter if specified
    let filteredLogs = allLogs;
    if (options?.activityType) {
      filteredLogs = filteredLogs.filter(log => log.activityType === options.activityType);
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

    return {
      logs: resultLogs,
      nextCursor: hasNextPage ? resultLogs[resultLogs.length - 1]?.id ?? null : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching cardio logs (Admin):', error);
    throw new Error(`Failed to fetch cardio logs: ${message}`);
  }
}

/**
 * Update cardio log (Admin SDK)
 */
export async function updateCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: CardioLogUpdateInput
): Promise<CardioLog> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    const docRef = logsRef.doc(logId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert date string to timestamp if provided
    if (data.date) {
      updateData.date = Timestamp.fromDate(new Date(data.date));
    }

    // Recalculate pace if distance or duration changed
    if (data.distanceMiles !== undefined || data.durationMinutes !== undefined) {
      const existing = await docRef.get();
      const existingData = existing.data() as CardioLogDocument;
      const distance = data.distanceMiles ?? existingData.distanceMiles;
      const duration = data.durationMinutes ?? existingData.durationMinutes;
      updateData.avgPacePerMile = calculatePace(distance, duration);
    }

    await docRef.update(updateData);
    const doc = await docRef.get();

    return toCardioLog(doc.id, doc.data() as CardioLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating cardio log (Admin):', error);
    throw new Error(`Failed to update cardio log: ${message}`);
  }
}

/**
 * Delete cardio log (Admin SDK)
 */
export async function deleteCardioLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    await logsRef.doc(logId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting cardio log (Admin):', error);
    throw new Error(`Failed to delete cardio log: ${message}`);
  }
}

/**
 * Get cardio statistics for a player (Admin SDK)
 * Used for analytics dashboard
 */
export async function getCardioStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalRuns: number;
  totalMiles: number;
  totalDuration: number;
  avgPacePerMile: string;
  runsByType: Record<CardioActivityType, number>;
  longestRun: number;
  fastestPace: string;
}> {
  try {
    const logsRef = getCardioLogsRef(userId, playerId);
    let query = logsRef.orderBy('date', 'desc');

    if (options?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(options.startDate));
    }
    if (options?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(options.endDate));
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => doc.data() as CardioLogDocument);

    const stats = {
      totalRuns: logs.length,
      totalMiles: 0,
      totalDuration: 0,
      avgPacePerMile: '0:00',
      runsByType: {} as Record<CardioActivityType, number>,
      longestRun: 0,
      fastestPace: '99:99',
    };

    let fastestPaceMinutes = Infinity;

    for (const log of logs) {
      stats.totalMiles += log.distanceMiles;
      stats.totalDuration += log.durationMinutes;
      stats.runsByType[log.activityType] = (stats.runsByType[log.activityType] ?? 0) + 1;

      if (log.distanceMiles > stats.longestRun) {
        stats.longestRun = log.distanceMiles;
      }

      // Calculate pace for this run and track fastest
      const paceMinutes = log.durationMinutes / log.distanceMiles;
      if (paceMinutes < fastestPaceMinutes) {
        fastestPaceMinutes = paceMinutes;
      }
    }

    // Calculate overall average pace
    if (stats.totalMiles > 0) {
      stats.avgPacePerMile = calculatePace(stats.totalMiles, stats.totalDuration);
    }

    // Format fastest pace
    if (fastestPaceMinutes < Infinity) {
      const mins = Math.floor(fastestPaceMinutes);
      const secs = Math.round((fastestPaceMinutes - mins) * 60);
      stats.fastestPace = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    return stats;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching cardio stats (Admin):', error);
    throw new Error(`Failed to fetch cardio stats: ${message}`);
  }
}
