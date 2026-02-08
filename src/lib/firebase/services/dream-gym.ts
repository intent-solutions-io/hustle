/**
 * Firestore Dream Gym Service
 *
 * CRUD operations for Dream Gym documents (subcollection of players).
 * Subcollection: /users/{userId}/players/{playerId}/dreamGym/{dreamGymId}
 *
 * Note: Each player has ONE Dream Gym document (singleton pattern).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type FieldValue,
} from 'firebase/firestore';
import { db } from '../config';
import type {
  DreamGymDocument,
  DreamGym,
  DreamGymProfile,
  DreamGymSchedule,
  DreamGymEvent,
  DreamGymMentalCheckIn,
  DreamGymEventClient,
  DreamGymMentalCheckInClient,
} from '@/types/firestore';

const DREAM_GYM_DOC_ID = 'profile'; // Singleton document ID

/**
 * Convert Firestore DreamGymDocument to client DreamGym type
 */
function toDreamGym(id: string, data: DreamGymDocument): DreamGym {
  return {
    id,
    playerId: data.playerId,
    profile: data.profile,
    schedule: data.schedule,
    events: (data.events ?? []).map((event: DreamGymEvent): DreamGymEventClient => ({
      ...event,
      date: event.date instanceof Timestamp ? event.date.toDate() : event.date as unknown as Date,
    })),
    mental: {
      checkIns: (data.mental?.checkIns ?? []).map((checkIn: DreamGymMentalCheckIn): DreamGymMentalCheckInClient => ({
        ...checkIn,
        date: checkIn.date instanceof Timestamp ? checkIn.date.toDate() : checkIn.date as unknown as Date,
      })),
      favoriteTips: data.mental?.favoriteTips ?? [],
      lastCheckIn: data.mental?.lastCheckIn instanceof Timestamp
        ? data.mental.lastCheckIn.toDate()
        : data.mental?.lastCheckIn || null,
    },
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt as unknown as Date,
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt as unknown as Date,
  };
}

/**
 * Get Dream Gym profile for a player
 */
export async function getDreamGym(userId: string, playerId: string): Promise<DreamGym | null> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return toDreamGym(docSnap.id, docSnap.data() as DreamGymDocument);
}

/**
 * Create or update Dream Gym profile (upsert)
 */
export async function upsertDreamGym(
  userId: string,
  playerId: string,
  data: {
    profile: DreamGymProfile;
    schedule: DreamGymSchedule;
  }
): Promise<DreamGym> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const now = serverTimestamp();

  // Check if document exists
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // Update existing document
    await updateDoc(docRef, {
      profile: data.profile,
      schedule: data.schedule,
      updatedAt: now,
    });
  } else {
    // Create new document
    // Use type that accepts FieldValue for serverTimestamp()
    type NewDreamGymDoc = Omit<DreamGymDocument, 'createdAt' | 'updatedAt'> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    };
    const dreamGymDoc: NewDreamGymDoc = {
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

    await setDoc(docRef, dreamGymDoc);
  }

  // Return updated document
  const updatedDoc = await getDoc(docRef);
  return toDreamGym(updatedDoc.id, updatedDoc.data() as DreamGymDocument);
}

/**
 * Update Dream Gym profile settings only
 */
export async function updateDreamGymProfile(
  userId: string,
  playerId: string,
  profile: Partial<DreamGymProfile>
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Dream Gym profile not found');
  }

  const existingProfile = docSnap.data().profile;
  await updateDoc(docRef, {
    profile: { ...existingProfile, ...profile },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update Dream Gym schedule
 */
export async function updateDreamGymSchedule(
  userId: string,
  playerId: string,
  schedule: DreamGymSchedule
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  await updateDoc(docRef, {
    schedule,
    updatedAt: serverTimestamp(),
  });
}

/** Input type for adding events - accepts Date or Timestamp for flexibility */
type DreamGymEventInput = Omit<DreamGymEvent, 'id' | 'date'> & {
  date: Date | Timestamp;
};

/**
 * Add an event to Dream Gym
 */
export async function addDreamGymEvent(
  userId: string,
  playerId: string,
  event: DreamGymEventInput
): Promise<string> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Dream Gym profile not found');
  }

  const eventId = `event_${Date.now()}`;
  // Convert date to Timestamp - handle both Date objects and serialized dates
  const eventDate = event.date instanceof Timestamp
    ? event.date
    : Timestamp.fromDate(event.date instanceof Date ? event.date : new Date(String(event.date)));
  const newEvent: DreamGymEvent = {
    ...event,
    id: eventId,
    date: eventDate,
  };

  const existingEvents = docSnap.data().events || [];
  await updateDoc(docRef, {
    events: [...existingEvents, newEvent],
    updatedAt: serverTimestamp(),
  });

  return eventId;
}

/**
 * Remove an event from Dream Gym
 */
export async function removeDreamGymEvent(
  userId: string,
  playerId: string,
  eventId: string
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Dream Gym profile not found');
  }

  const existingEvents = docSnap.data().events || [];
  await updateDoc(docRef, {
    events: existingEvents.filter((e: DreamGymEvent) => e.id !== eventId),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Add a mental check-in
 */
export async function addMentalCheckIn(
  userId: string,
  playerId: string,
  checkIn: Omit<DreamGymMentalCheckIn, 'date'>
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Dream Gym profile not found');
  }

  const now = Timestamp.now();
  const newCheckIn: DreamGymMentalCheckIn = {
    ...checkIn,
    date: now,
  };

  const existingCheckIns = docSnap.data().mental?.checkIns || [];

  // Keep only last 30 check-ins
  const updatedCheckIns = [...existingCheckIns, newCheckIn].slice(-30);

  await updateDoc(docRef, {
    'mental.checkIns': updatedCheckIns,
    'mental.lastCheckIn': now,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggle a favorite mental tip
 */
export async function toggleFavoriteTip(
  userId: string,
  playerId: string,
  tipId: string
): Promise<void> {
  const docRef = doc(db, `users/${userId}/players/${playerId}/dreamGym`, DREAM_GYM_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Dream Gym profile not found');
  }

  const existingTips = docSnap.data().mental?.favoriteTips || [];
  const updatedTips = existingTips.includes(tipId)
    ? existingTips.filter((t: string) => t !== tipId)
    : [...existingTips, tipId];

  await updateDoc(docRef, {
    'mental.favoriteTips': updatedTips,
    updatedAt: serverTimestamp(),
  });
}
