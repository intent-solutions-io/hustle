/**
 * Firebase Admin SDK - Biometrics Service (Server-Side)
 *
 * Server-side Firestore operations for biometrics log documents.
 * Collection: /users/{userId}/players/{playerId}/biometrics/{logId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { BiometricsLog, BiometricsLogDocument, BiometricsSource } from '@/types/firestore';
import type { BiometricsLogCreateInput, BiometricsLogUpdateInput } from '@/lib/validations/biometrics-schema';

/**
 * Biometrics trends summary type
 */
export interface BiometricsTrends {
  avgRestingHeartRate: number | null;
  avgHrv: number | null;
  avgSleepScore: number | null;
  avgSleepHours: number | null;
  avgSteps: number | null;
  dataPoints: number;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore BiometricsLogDocument to BiometricsLog type
 */
function toBiometricsLog(id: string, doc: BiometricsLogDocument): BiometricsLog {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    restingHeartRate: doc.restingHeartRate ?? null,
    maxHeartRate: doc.maxHeartRate ?? null,
    avgHeartRate: doc.avgHeartRate ?? null,
    hrv: doc.hrv ?? null,
    sleepScore: doc.sleepScore ?? null,
    sleepHours: doc.sleepHours ?? null,
    steps: doc.steps ?? null,
    activeMinutes: doc.activeMinutes ?? null,
    source: doc.source,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for biometrics logs
 */
function getBiometricsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/biometrics`);
}

/**
 * Create a new biometrics log (Admin SDK)
 */
export async function createBiometricsLogAdmin(
  userId: string,
  playerId: string,
  data: BiometricsLogCreateInput
): Promise<BiometricsLog> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    console.log('[createBiometricsLogAdmin] Collection path:', `users/${userId}/players/${playerId}/biometrics`);
    const now = Timestamp.now();

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      restingHeartRate: data.restingHeartRate ?? null,
      maxHeartRate: data.maxHeartRate ?? null,
      avgHeartRate: data.avgHeartRate ?? null,
      hrv: data.hrv ?? null,
      sleepScore: data.sleepScore ?? null,
      sleepHours: data.sleepHours ?? null,
      steps: data.steps ?? null,
      activeMinutes: data.activeMinutes ?? null,
      source: data.source as BiometricsSource,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await biometricsRef.add(docData);
    console.log('[createBiometricsLogAdmin] Created document with ID:', docRef.id);
    const doc = await docRef.get();
    console.log('[createBiometricsLogAdmin] Document exists:', doc.exists);

    return toBiometricsLog(docRef.id, doc.data() as BiometricsLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating biometrics log (Admin):', error);
    throw new Error(`Failed to create biometrics log: ${message}`);
  }
}

/**
 * Get single biometrics log by ID (Admin SDK)
 */
export async function getBiometricsLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<BiometricsLog | null> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    const doc = await biometricsRef.doc(logId).get();

    if (!doc.exists) {
      return null;
    }

    return toBiometricsLog(doc.id, doc.data() as BiometricsLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching biometrics log (Admin):', error);
    throw new Error(`Failed to fetch biometrics log: ${message}`);
  }
}

/**
 * Get all biometrics logs for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getBiometricsLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    source?: BiometricsSource;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: BiometricsLog[]; nextCursor: string | null }> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    const limit = options?.limit ?? 30;

    console.log('[getBiometricsLogsAdmin] Collection path:', `users/${userId}/players/${playerId}/biometrics`);

    // Fetch all documents and sort in memory (more reliable than Firestore orderBy for subcollections)
    const allDocsSnapshot = await biometricsRef.get();

    console.log('[getBiometricsLogsAdmin] Total documents found:', allDocsSnapshot.size);

    if (allDocsSnapshot.size === 0) {
      return { logs: [], nextCursor: null };
    }

    // Get all documents and convert to BiometricsLog
    const allLogs = allDocsSnapshot.docs.map((doc) => {
      const data = doc.data() as BiometricsLogDocument;
      return toBiometricsLog(doc.id, data);
    });

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply source filter if specified
    let filteredLogs = allLogs;
    if (options?.source) {
      filteredLogs = filteredLogs.filter(log => log.source === options.source);
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
    console.error('Error fetching biometrics logs (Admin):', error);
    throw new Error(`Failed to fetch biometrics logs: ${message}`);
  }
}

/**
 * Update biometrics log (Admin SDK)
 */
export async function updateBiometricsLogAdmin(
  userId: string,
  playerId: string,
  logId: string,
  data: BiometricsLogUpdateInput
): Promise<BiometricsLog> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    const docRef = biometricsRef.doc(logId);

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

    return toBiometricsLog(doc.id, doc.data() as BiometricsLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating biometrics log (Admin):', error);
    throw new Error(`Failed to update biometrics log: ${message}`);
  }
}

/**
 * Delete biometrics log (Admin SDK)
 */
export async function deleteBiometricsLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    await biometricsRef.doc(logId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting biometrics log (Admin):', error);
    throw new Error(`Failed to delete biometrics log: ${message}`);
  }
}

/**
 * Get biometrics trends for a player (Admin SDK)
 * Used for analytics dashboard
 */
export async function getBiometricsTrendsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<BiometricsTrends> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);
    const limit = options?.limit ?? 30;

    // Fetch all documents and filter/sort in memory
    const allDocsSnapshot = await biometricsRef.get();

    if (allDocsSnapshot.size === 0) {
      return {
        avgRestingHeartRate: null,
        avgHrv: null,
        avgSleepScore: null,
        avgSleepHours: null,
        avgSteps: null,
        dataPoints: 0,
      };
    }

    // Get all documents
    let allLogs = allDocsSnapshot.docs.map((doc) => doc.data() as BiometricsLogDocument);

    // Apply date filters
    if (options?.startDate) {
      allLogs = allLogs.filter(log => {
        const logDate = log.date && 'toDate' in log.date ? log.date.toDate() : new Date(String(log.date));
        return logDate >= options.startDate!;
      });
    }
    if (options?.endDate) {
      allLogs = allLogs.filter(log => {
        const logDate = log.date && 'toDate' in log.date ? log.date.toDate() : new Date(String(log.date));
        return logDate <= options.endDate!;
      });
    }

    // Sort by date descending and limit
    allLogs.sort((a, b) => {
      const dateA = a.date && 'toDate' in a.date ? a.date.toDate() : new Date(String(a.date));
      const dateB = b.date && 'toDate' in b.date ? b.date.toDate() : new Date(String(b.date));
      return dateB.getTime() - dateA.getTime();
    });
    const logs = allLogs.slice(0, limit);

    if (logs.length === 0) {
      return {
        avgRestingHeartRate: null,
        avgHrv: null,
        avgSleepScore: null,
        avgSleepHours: null,
        avgSteps: null,
        dataPoints: 0,
      };
    }

    // Calculate averages (only counting non-null values)
    const rhrValues = logs.map(l => l.restingHeartRate).filter((v): v is number => v != null);
    const hrvValues = logs.map(l => l.hrv).filter((v): v is number => v != null);
    const sleepScoreValues = logs.map(l => l.sleepScore).filter((v): v is number => v != null);
    const sleepHoursValues = logs.map(l => l.sleepHours).filter((v): v is number => v != null);
    const stepsValues = logs.map(l => l.steps).filter((v): v is number => v != null);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    // Calculate each average once
    const avgRhr = avg(rhrValues);
    const avgHrvVal = avg(hrvValues);
    const avgSleepScore = avg(sleepScoreValues);
    const avgSleepHours = avg(sleepHoursValues);
    const avgSteps = avg(stepsValues);

    return {
      avgRestingHeartRate: avgRhr !== null ? Math.round(avgRhr) : null,
      avgHrv: avgHrvVal !== null ? Math.round(avgHrvVal) : null,
      avgSleepScore: avgSleepScore !== null ? Math.round(avgSleepScore) : null,
      avgSleepHours: avgSleepHours !== null ? Math.round(avgSleepHours * 10) / 10 : null,
      avgSteps: avgSteps !== null ? Math.round(avgSteps) : null,
      dataPoints: logs.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching biometrics trends (Admin):', error);
    throw new Error(`Failed to fetch biometrics trends: ${message}`);
  }
}

/**
 * Get biometrics log for a specific date (Admin SDK)
 * Useful for daily check-in updates
 */
export async function getBiometricsLogByDateAdmin(
  userId: string,
  playerId: string,
  date: Date
): Promise<BiometricsLog | null> {
  try {
    const biometricsRef = getBiometricsRef(userId, playerId);

    // Get start and end of day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await biometricsRef
      .where('date', '>=', Timestamp.fromDate(startOfDay))
      .where('date', '<=', Timestamp.fromDate(endOfDay))
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return toBiometricsLog(doc.id, doc.data() as BiometricsLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching biometrics by date (Admin):', error);
    throw new Error(`Failed to fetch biometrics by date: ${message}`);
  }
}
