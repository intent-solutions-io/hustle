/**
 * Firebase Admin SDK - Journal Service (Server-Side)
 *
 * Server-side Firestore operations for journal entry documents.
 * Collection: /users/{userId}/players/{playerId}/journal/{entryId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { JournalEntry, JournalEntryDocument, JournalContext, JournalMoodTag } from '@/types/firestore';
import type { JournalEntryCreateInput, JournalEntryUpdateInput } from '@/lib/validations/journal-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore JournalEntryDocument to JournalEntry type
 */
function toJournalEntry(id: string, doc: JournalEntryDocument): JournalEntry {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    content: doc.content,
    context: doc.context,
    moodTag: doc.moodTag ?? null,
    energyTag: doc.energyTag ?? null,
    linkedWorkoutId: doc.linkedWorkoutId ?? null,
    linkedGameId: doc.linkedGameId ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for journal entries
 */
function getJournalRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/journal`);
}

/**
 * Create a new journal entry (Admin SDK)
 */
export async function createJournalEntryAdmin(
  userId: string,
  playerId: string,
  data: JournalEntryCreateInput
): Promise<JournalEntry> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const now = Timestamp.now();

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      content: data.content,
      context: data.context as JournalContext,
      moodTag: data.moodTag ?? null,
      energyTag: data.energyTag ?? null,
      linkedWorkoutId: data.linkedWorkoutId ?? null,
      linkedGameId: data.linkedGameId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await journalRef.add(docData);
    const doc = await docRef.get();

    return toJournalEntry(docRef.id, doc.data() as JournalEntryDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating journal entry (Admin):', error);
    throw new Error(`Failed to create journal entry: ${message}`);
  }
}

/**
 * Get single journal entry by ID (Admin SDK)
 */
export async function getJournalEntryAdmin(
  userId: string,
  playerId: string,
  entryId: string
): Promise<JournalEntry | null> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const doc = await journalRef.doc(entryId).get();

    if (!doc.exists) {
      return null;
    }

    return toJournalEntry(doc.id, doc.data() as JournalEntryDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching journal entry (Admin):', error);
    throw new Error(`Failed to fetch journal entry: ${message}`);
  }
}

/**
 * Get all journal entries for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getJournalEntriesAdmin(
  userId: string,
  playerId: string,
  options?: {
    context?: JournalContext;
    moodTag?: JournalMoodTag;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ entries: JournalEntry[]; nextCursor: string | null }> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    let query = journalRef.orderBy('date', 'desc');

    // Apply context filter
    if (options?.context) {
      query = query.where('context', '==', options.context);
    }

    // Apply mood filter
    if (options?.moodTag) {
      query = query.where('moodTag', '==', options.moodTag);
    }

    // Apply date range filter
    if (options?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(options.startDate));
    }
    if (options?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(options.endDate));
    }

    // Apply pagination cursor
    if (options?.cursor) {
      const cursorDoc = await journalRef.doc(options.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Apply limit (default 20)
    const limit = options?.limit ?? 20;
    query = query.limit(limit + 1); // Fetch one extra to check for next page

    const snapshot = await query.get();
    const docs = snapshot.docs;

    // Check if there's a next page
    const hasNextPage = docs.length > limit;
    const entries = docs.slice(0, limit).map((doc) =>
      toJournalEntry(doc.id, doc.data() as JournalEntryDocument)
    );

    return {
      entries,
      nextCursor: hasNextPage ? docs[limit - 1].id : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching journal entries (Admin):', error);
    throw new Error(`Failed to fetch journal entries: ${message}`);
  }
}

/**
 * Get recent journal entries for widgets (Admin SDK)
 */
export async function getRecentJournalEntriesAdmin(
  userId: string,
  playerId: string,
  limit: number = 5
): Promise<JournalEntry[]> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const snapshot = await journalRef
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) =>
      toJournalEntry(doc.id, doc.data() as JournalEntryDocument)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching recent journal entries (Admin):', error);
    throw new Error(`Failed to fetch recent journal entries: ${message}`);
  }
}

/**
 * Update journal entry (Admin SDK)
 */
export async function updateJournalEntryAdmin(
  userId: string,
  playerId: string,
  entryId: string,
  data: JournalEntryUpdateInput
): Promise<JournalEntry> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const docRef = journalRef.doc(entryId);

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

    return toJournalEntry(doc.id, doc.data() as JournalEntryDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating journal entry (Admin):', error);
    throw new Error(`Failed to update journal entry: ${message}`);
  }
}

/**
 * Delete journal entry (Admin SDK)
 */
export async function deleteJournalEntryAdmin(
  userId: string,
  playerId: string,
  entryId: string
): Promise<void> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    await journalRef.doc(entryId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting journal entry (Admin):', error);
    throw new Error(`Failed to delete journal entry: ${message}`);
  }
}

/**
 * Get journal entries linked to a workout (Admin SDK)
 */
export async function getJournalEntriesByWorkoutAdmin(
  userId: string,
  playerId: string,
  workoutId: string
): Promise<JournalEntry[]> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const snapshot = await journalRef
      .where('linkedWorkoutId', '==', workoutId)
      .get();

    return snapshot.docs.map((doc) =>
      toJournalEntry(doc.id, doc.data() as JournalEntryDocument)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching journal entries by workout (Admin):', error);
    throw new Error(`Failed to fetch journal entries by workout: ${message}`);
  }
}

/**
 * Get journal entries linked to a game (Admin SDK)
 */
export async function getJournalEntriesByGameAdmin(
  userId: string,
  playerId: string,
  gameId: string
): Promise<JournalEntry[]> {
  try {
    const journalRef = getJournalRef(userId, playerId);
    const snapshot = await journalRef
      .where('linkedGameId', '==', gameId)
      .get();

    return snapshot.docs.map((doc) =>
      toJournalEntry(doc.id, doc.data() as JournalEntryDocument)
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching journal entries by game (Admin):', error);
    throw new Error(`Failed to fetch journal entries by game: ${message}`);
  }
}
