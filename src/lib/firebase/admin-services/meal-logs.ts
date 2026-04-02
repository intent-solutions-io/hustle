/**
 * Firebase Admin SDK - Meal Logs Service (Server-Side)
 *
 * Server-side Firestore operations for meal log documents.
 * Collection: /users/{userId}/players/{playerId}/mealLogs/{logId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { MealLog, MealLogDocument, MealType } from '@/types/firestore';
import type { MealLogCreateInput } from '@/lib/validations/meal-log-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

function toMealLog(id: string, doc: MealLogDocument): MealLog {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    mealType: doc.mealType,
    description: doc.description,
    calories: doc.calories ?? null,
    protein: doc.protein ?? null,
    carbs: doc.carbs ?? null,
    fat: doc.fat ?? null,
    notes: doc.notes ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

function getMealLogsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/mealLogs`);
}

export async function createMealLogAdmin(
  userId: string,
  playerId: string,
  data: MealLogCreateInput
): Promise<MealLog> {
  try {
    const logsRef = getMealLogsRef(userId, playerId);
    const now = Timestamp.now();

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      mealType: data.mealType as MealType,
      description: data.description,
      calories: data.calories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await logsRef.add(docData);
    const doc = await docRef.get();

    return toMealLog(docRef.id, doc.data() as MealLogDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating meal log (Admin):', error);
    throw new Error(`Failed to create meal log: ${message}`);
  }
}

export async function getMealLogsAdmin(
  userId: string,
  playerId: string,
  options?: {
    mealType?: MealType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ logs: MealLog[]; nextCursor: string | null }> {
  try {
    const logsRef = getMealLogsRef(userId, playerId);
    const limit = options?.limit ?? 20;

    const snapshot = await logsRef.get();

    if (snapshot.size === 0) {
      return { logs: [], nextCursor: null };
    }

    let allLogs = snapshot.docs.map((doc) =>
      toMealLog(doc.id, doc.data() as MealLogDocument)
    );

    // Sort by date descending
    allLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (options?.mealType) {
      allLogs = allLogs.filter((log) => log.mealType === options.mealType);
    }
    if (options?.startDate) {
      allLogs = allLogs.filter((log) => new Date(log.date) >= options.startDate!);
    }
    if (options?.endDate) {
      allLogs = allLogs.filter((log) => new Date(log.date) <= options.endDate!);
    }

    let startIndex = 0;
    if (options?.cursor) {
      const cursorIndex = allLogs.findIndex((log) => log.id === options.cursor);
      if (cursorIndex !== -1) startIndex = cursorIndex + 1;
    }

    const paginated = allLogs.slice(startIndex, startIndex + limit + 1);
    const hasNextPage = paginated.length > limit;
    const resultLogs = paginated.slice(0, limit);

    return {
      logs: resultLogs,
      nextCursor: hasNextPage ? resultLogs[resultLogs.length - 1]?.id ?? null : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching meal logs (Admin):', error);
    throw new Error(`Failed to fetch meal logs: ${message}`);
  }
}

export async function deleteMealLogAdmin(
  userId: string,
  playerId: string,
  logId: string
): Promise<void> {
  try {
    const logsRef = getMealLogsRef(userId, playerId);
    await logsRef.doc(logId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting meal log (Admin):', error);
    throw new Error(`Failed to delete meal log: ${message}`);
  }
}
