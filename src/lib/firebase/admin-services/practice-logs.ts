/**
 * Firebase Admin SDK - Practice Logs Service (Server-Side)
 *
 * Server-side Firestore operations for practice log documents.
 * Collection: /users/{userId}/players/{playerId}/practiceLogs/{logId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { PracticeLog, PracticeLogDocument, PracticeType, PracticeFocusArea } from '@/types/firestore';
import type { PracticeLogCreateInput, PracticeLogUpdateInput } from '@/lib/validations/practice-log-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore PracticeLogDocument to PracticeLog type
 */
function toPracticeLog(id: string, doc: PracticeLogDocument): PracticeLog {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    practiceType: doc.practiceType,
    durationMinutes: doc.durationMinutes,
    focusAreas: doc.focusAreas,
    teamName: doc.teamName ?? null,
    location: doc.location ?? null,
    drillsCompleted: doc.drillsCompleted ?? null,
    intensity: doc.intensity ?? null,
    enjoyment: doc.enjoyment ?? null,
    improvement: doc.improvement ?? null,
    notes: doc.notes ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for practice logs
 */
function getPracticeLogsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/practiceLogs`);
}

/**
 * Create a new practice log (Admin SDK)
 */
export async function createPracticeLogAdmin(
  userId: string,
  playerId: string,
  data: PracticeLogCreateInput
): Promise<PracticeLog> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    const now = Timestamp.now();

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      practiceType: data.practiceType as PracticeType,
      durationMinutes: data.durationMinutes,
      focusAreas: data.focusAreas as PracticeFocusArea[],
      teamName: data.teamName ?? null,
      location: data.location ?? null,
      drillsCompleted: data.drillsCompleted ?? null,
      intensity: data.intensity ?? null,
      enjoyment: data.enjoyment ?? null,
      improvement: data.improvement ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await logsRef.add(docData);
    const doc = await docRef.get();

    return toPracticeLog(docRef.id, doc.data() as PracticeLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating practice log (Admin):', error);
    throw new Error(`Failed to create practice log: ${message}`);
  }
}

/**
 * Get single practice log by ID (Admin SDK)
 */
export async function getPracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<PracticeLog | null> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    const doc = await logsRef.doc(logId).get();

    if (!doc.exists) {
      return null;
    }

    return toPracticeLog(doc.id, doc.data() as PracticeLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching practice log (Admin):', error);
    throw new Error(`Failed to fetch practice log: ${message}`);
  }
}

/**
 * Get all practice logs for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getPracticeLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    practiceType?: PracticeType;
    focusArea?: PracticeFocusArea;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: PracticeLog[]; nextCursor: string | null }> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    const limit = options?.limit ?? 20;

    // Fetch all documents and sort in memory (more reliable than Firestore orderBy for subcollections)
    const allDocsSnapshot = await logsRef.get();

    if (allDocsSnapshot.size === 0) {
      return { logs: [], nextCursor: null };
    }

    // Get all documents and convert to PracticeLog
    const allLogs = allDocsSnapshot.docs.map((doc) => {
      const data = doc.data() as PracticeLogDocument;
      return toPracticeLog(doc.id, data);
    });

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply practice type filter if specified
    let filteredLogs = allLogs;
    if (options?.practiceType) {
      filteredLogs = filteredLogs.filter(log => log.practiceType === options.practiceType);
    }

    // Apply focus area filter (array-contains equivalent)
    if (options?.focusArea) {
      filteredLogs = filteredLogs.filter(log => log.focusAreas.includes(options.focusArea!));
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
    console.error('Error fetching practice logs (Admin):', error);
    throw new Error(`Failed to fetch practice logs: ${message}`);
  }
}

/**
 * Update practice log (Admin SDK)
 */
export async function updatePracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: PracticeLogUpdateInput
): Promise<PracticeLog> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    const docRef = logsRef.doc(logId);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convert date string to timestamp if provided
    if (data.date) {
      updateData.date = Timestamp.fromDate(new Date(data.date));
    }

    await docRef.update(updateData);
    const doc = await docRef.get();

    return toPracticeLog(doc.id, doc.data() as PracticeLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating practice log (Admin):', error);
    throw new Error(`Failed to update practice log: ${message}`);
  }
}

/**
 * Delete practice log (Admin SDK)
 */
export async function deletePracticeLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    await logsRef.doc(logId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting practice log (Admin):', error);
    throw new Error(`Failed to delete practice log: ${message}`);
  }
}

/**
 * Get practice statistics for a player (Admin SDK)
 * Used for analytics dashboard
 */
export async function getPracticeStatsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  totalPractices: number;
  totalDuration: number;
  avgDuration: number;
  practicesByType: Record<PracticeType, number>;
  focusAreaFrequency: Record<PracticeFocusArea, number>;
  avgIntensity: number;
  avgEnjoyment: number;
}> {
  try {
    const logsRef = getPracticeLogsRef(userId, playerId);
    let query = logsRef.orderBy('date', 'desc');

    if (options?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(options.startDate));
    }
    if (options?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(options.endDate));
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc) => doc.data() as PracticeLogDocument);

    const stats = {
      totalPractices: logs.length,
      totalDuration: 0,
      avgDuration: 0,
      practicesByType: {} as Record<PracticeType, number>,
      focusAreaFrequency: {} as Record<PracticeFocusArea, number>,
      avgIntensity: 0,
      avgEnjoyment: 0,
    };

    let intensitySum = 0;
    let intensityCount = 0;
    let enjoymentSum = 0;
    let enjoymentCount = 0;

    for (const log of logs) {
      stats.totalDuration += log.durationMinutes;
      stats.practicesByType[log.practiceType] = (stats.practicesByType[log.practiceType] ?? 0) + 1;

      // Count focus area frequency
      for (const area of log.focusAreas) {
        stats.focusAreaFrequency[area] = (stats.focusAreaFrequency[area] ?? 0) + 1;
      }

      // Track intensity and enjoyment averages
      if (log.intensity) {
        intensitySum += log.intensity;
        intensityCount++;
      }
      if (log.enjoyment) {
        enjoymentSum += log.enjoyment;
        enjoymentCount++;
      }
    }

    stats.avgDuration = logs.length > 0 ? Math.round(stats.totalDuration / logs.length) : 0;
    stats.avgIntensity = intensityCount > 0 ? Number((intensitySum / intensityCount).toFixed(1)) : 0;
    stats.avgEnjoyment = enjoymentCount > 0 ? Number((enjoymentSum / enjoymentCount).toFixed(1)) : 0;

    return stats;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching practice stats (Admin):', error);
    throw new Error(`Failed to fetch practice stats: ${message}`);
  }
}
