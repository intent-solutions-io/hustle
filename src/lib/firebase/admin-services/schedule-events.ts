/**
 * Firebase Admin SDK - Schedule Events Service (Server-Side)
 *
 * Server-side Firestore operations for season schedule events.
 * Collection: /users/{userId}/scheduleEvents/{eventId}
 *
 * Events are stored at the user level because one family's athletes
 * share a team schedule.
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  ScheduleEvent,
  ScheduleEventDocument,
  ScheduleEventType,
} from '@/types/firestore';
import type {
  ScheduleEventCreateInput,
  ScheduleEventUpdateInput,
} from '@/lib/validations/schedule-event-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return toDate(value);
}

/**
 * Convert Firestore ScheduleEventDocument to ScheduleEvent type
 */
function toScheduleEvent(id: string, doc: ScheduleEventDocument): ScheduleEvent {
  return {
    id,
    playerIds: doc.playerIds,
    type: doc.type,
    title: doc.title,
    date: toDate(doc.date),
    endDate: toNullableDate(doc.endDate),
    location: doc.location ?? null,
    opponent: doc.opponent ?? null,
    notes: doc.notes ?? null,
    linkedGameId: doc.linkedGameId ?? null,
    linkedGamePlayerId: doc.linkedGamePlayerId ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for schedule events
 */
function getScheduleEventsRef(userId: string) {
  return adminDb.collection(`users/${userId}/scheduleEvents`);
}

/**
 * Create a new schedule event (Admin SDK)
 */
export async function createScheduleEventAdmin(
  userId: string,
  data: ScheduleEventCreateInput
): Promise<ScheduleEvent> {
  const ref = getScheduleEventsRef(userId);
  const now = Timestamp.now();

  const docData = {
    playerIds: data.playerIds,
    type: data.type as ScheduleEventType,
    title: data.title,
    date: Timestamp.fromDate(new Date(data.date)),
    endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
    location: data.location ?? null,
    opponent: data.opponent ?? null,
    notes: data.notes ?? null,
    linkedGameId: null,
    linkedGamePlayerId: null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await ref.add(docData);
  const doc = await docRef.get();
  return toScheduleEvent(docRef.id, doc.data() as ScheduleEventDocument);
}

/**
 * Get a single schedule event by ID (Admin SDK)
 */
export async function getScheduleEventAdmin(
  userId: string,
  eventId: string
): Promise<ScheduleEvent | null> {
  const doc = await getScheduleEventsRef(userId).doc(eventId).get();
  if (!doc.exists) return null;
  return toScheduleEvent(doc.id, doc.data() as ScheduleEventDocument);
}

/**
 * List schedule events for a user (Admin SDK)
 * Returns events ordered by date ascending, with optional date range filter.
 */
export async function getScheduleEventsAdmin(
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    playerId?: string;
    type?: ScheduleEventType;
    limit?: number;
  }
): Promise<ScheduleEvent[]> {
  const ref = getScheduleEventsRef(userId);
  const snapshot = await ref.get();

  if (snapshot.empty) return [];

  let events = snapshot.docs.map((doc) =>
    toScheduleEvent(doc.id, doc.data() as ScheduleEventDocument)
  );

  // Sort ascending by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Filter by date range
  if (options?.startDate) {
    events = events.filter((e) => e.date >= options.startDate!);
  }
  if (options?.endDate) {
    events = events.filter((e) => e.date <= options.endDate!);
  }

  // Filter by player
  if (options?.playerId) {
    events = events.filter((e) => e.playerIds.includes(options.playerId!));
  }

  // Filter by type
  if (options?.type) {
    events = events.filter((e) => e.type === options.type);
  }

  // Limit
  if (options?.limit) {
    events = events.slice(0, options.limit);
  }

  return events;
}

/**
 * Update a schedule event (Admin SDK)
 */
export async function updateScheduleEventAdmin(
  userId: string,
  eventId: string,
  data: ScheduleEventUpdateInput
): Promise<ScheduleEvent> {
  const docRef = getScheduleEventsRef(userId).doc(eventId);

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  if (data.date) {
    updateData.date = Timestamp.fromDate(new Date(data.date));
  }
  if (data.endDate !== undefined) {
    updateData.endDate = data.endDate
      ? Timestamp.fromDate(new Date(data.endDate))
      : null;
  }

  await docRef.update(updateData);
  const doc = await docRef.get();
  return toScheduleEvent(doc.id, doc.data() as ScheduleEventDocument);
}

/**
 * Delete a schedule event (Admin SDK)
 */
export async function deleteScheduleEventAdmin(
  userId: string,
  eventId: string
): Promise<void> {
  await getScheduleEventsRef(userId).doc(eventId).delete();
}

/**
 * Link a game log to a schedule event (Admin SDK)
 */
export async function linkGameToScheduleEventAdmin(
  userId: string,
  eventId: string,
  gameId: string,
  playerId: string
): Promise<void> {
  await getScheduleEventsRef(userId).doc(eventId).update({
    linkedGameId: gameId,
    linkedGamePlayerId: playerId,
    updatedAt: Timestamp.now(),
  });
}
