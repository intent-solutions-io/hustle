/**
 * Firebase Admin SDK - Dream Gym Service (Server-Side)
 *
 * Server-side Firestore operations for Dream Gym documents.
 * Collection: /users/{userId}/players/{playerId}/dreamGym/{profile}
 *
 * Note: Each player has ONE Dream Gym document (singleton pattern).
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  DreamGym,
  DreamGymDocument,
  DreamGymProfile,
  DreamGymSchedule,
  DreamGymEvent,
  DreamGymMentalCheckIn,
  DreamGymEventClient,
  DreamGymMentalCheckInClient,
} from '@/types/firestore';

const DREAM_GYM_DOC_ID = 'profile'; // Singleton document ID

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore DreamGymDocument to client DreamGym type
 */
function toDreamGym(id: string, data: DreamGymDocument): DreamGym {
  return {
    id,
    playerId: data.playerId,
    profile: data.profile,
    schedule: data.schedule,
    events: data.events.map((event: DreamGymEvent): DreamGymEventClient => ({
      ...event,
      date: toDate(event.date),
    })),
    mental: {
      checkIns: data.mental.checkIns.map((checkIn: DreamGymMentalCheckIn): DreamGymMentalCheckInClient => ({
        ...checkIn,
        date: toDate(checkIn.date),
      })),
      favoriteTips: data.mental.favoriteTips,
      lastCheckIn: data.mental.lastCheckIn ? toDate(data.mental.lastCheckIn) : null,
    },
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/**
 * Get Dream Gym profile for a player (Admin SDK)
 */
export async function getDreamGymAdmin(userId: string, playerId: string): Promise<DreamGym | null> {
  const docRef = adminDb.doc(`users/${userId}/players/${playerId}/dreamGym/${DREAM_GYM_DOC_ID}`);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  return toDreamGym(docSnap.id, docSnap.data() as DreamGymDocument);
}

/**
 * Create or update Dream Gym profile (upsert) - Admin SDK
 */
export async function upsertDreamGymAdmin(
  userId: string,
  playerId: string,
  data: {
    profile: DreamGymProfile;
    schedule: DreamGymSchedule;
  }
): Promise<DreamGym> {
  const docRef = adminDb.doc(`users/${userId}/players/${playerId}/dreamGym/${DREAM_GYM_DOC_ID}`);
  const now = new Date();

  // Check if document exists
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    // Update existing document
    await docRef.update({
      profile: data.profile,
      schedule: data.schedule,
      updatedAt: now,
    });
  } else {
    // Create new document - use Date objects, Admin SDK handles conversion
    const dreamGymDoc = {
      playerId,
      profile: data.profile,
      schedule: data.schedule,
      events: [],
      mental: {
        checkIns: [],
        favoriteTips: [],
        lastCheckIn: null,
      },
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(dreamGymDoc);
  }

  // Return updated document
  const updatedDoc = await docRef.get();
  return toDreamGym(updatedDoc.id, updatedDoc.data() as DreamGymDocument);
}

/**
 * Get mental check-ins for a player (Admin SDK)
 * Returns the last N check-ins
 */
export async function getMentalCheckInsAdmin(
  userId: string,
  playerId: string,
  limit: number = 30
): Promise<DreamGymMentalCheckInClient[]> {
  const dreamGym = await getDreamGymAdmin(userId, playerId);
  if (!dreamGym) {
    return [];
  }

  return dreamGym.mental.checkIns.slice(-limit);
}

/**
 * Get Dream Gym events for a player (Admin SDK)
 * Optionally filter by date range
 */
export async function getDreamGymEventsAdmin(
  userId: string,
  playerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<DreamGymEventClient[]> {
  const dreamGym = await getDreamGymAdmin(userId, playerId);
  if (!dreamGym) {
    return [];
  }

  let events = dreamGym.events;

  if (options?.startDate) {
    events = events.filter(e => e.date >= options.startDate!);
  }
  if (options?.endDate) {
    events = events.filter(e => e.date <= options.endDate!);
  }

  return events;
}

/**
 * Add a mental check-in (Admin SDK)
 */
export async function addMentalCheckInAdmin(
  userId: string,
  playerId: string,
  checkIn: Omit<DreamGymMentalCheckIn, 'date'>
): Promise<void> {
  const docRef = adminDb.doc(`users/${userId}/players/${playerId}/dreamGym/${DREAM_GYM_DOC_ID}`);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('Dream Gym profile not found');
  }

  const now = new Date();
  const newCheckIn = {
    ...checkIn,
    date: now,
  };

  const existingCheckIns = docSnap.data()?.mental?.checkIns || [];

  // Keep only last 30 check-ins
  const updatedCheckIns = [...existingCheckIns, newCheckIn].slice(-30);

  await docRef.update({
    'mental.checkIns': updatedCheckIns,
    'mental.lastCheckIn': now,
    updatedAt: now,
  });
}

/** Input type for adding events - accepts Date for flexibility */
type DreamGymEventInputAdmin = Omit<DreamGymEvent, 'id' | 'date'> & {
  date: Date;
};

/**
 * Add an event to Dream Gym (Admin SDK)
 */
export async function addDreamGymEventAdmin(
  userId: string,
  playerId: string,
  event: DreamGymEventInputAdmin
): Promise<string> {
  const docRef = adminDb.doc(`users/${userId}/players/${playerId}/dreamGym/${DREAM_GYM_DOC_ID}`);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('Dream Gym profile not found');
  }

  const eventId = `event_${Date.now()}`;
  const newEvent = {
    ...event,
    id: eventId,
    date: event.date,
  };

  const existingEvents = docSnap.data()?.events || [];
  await docRef.update({
    events: [...existingEvents, newEvent],
    updatedAt: new Date(),
  });

  return eventId;
}

/**
 * Remove an event from Dream Gym (Admin SDK)
 */
export async function removeDreamGymEventAdmin(
  userId: string,
  playerId: string,
  eventId: string
): Promise<void> {
  const docRef = adminDb.doc(`users/${userId}/players/${playerId}/dreamGym/${DREAM_GYM_DOC_ID}`);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    throw new Error('Dream Gym profile not found');
  }

  const existingEvents = docSnap.data()?.events || [];
  await docRef.update({
    events: existingEvents.filter((e: DreamGymEvent) => e.id !== eventId),
    updatedAt: new Date(),
  });
}
