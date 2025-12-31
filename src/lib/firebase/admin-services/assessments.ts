/**
 * Firebase Admin SDK - Fitness Assessments Service (Server-Side)
 *
 * Server-side Firestore operations for fitness assessment documents.
 * Collection: /users/{userId}/players/{playerId}/assessments/{assessmentId}
 */

import { adminDb } from '../admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { FitnessAssessment, FitnessAssessmentDocument, FitnessTestType, FitnessTestUnit } from '@/types/firestore';
import type { FitnessAssessmentCreateInput, FitnessAssessmentUpdateInput } from '@/lib/validations/assessment-schema';
import { fitnessTestMetadata, calculateImprovement } from '@/lib/validations/assessment-schema';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(String(value));
}

/**
 * Convert Firestore FitnessAssessmentDocument to FitnessAssessment type
 */
function toFitnessAssessment(id: string, doc: FitnessAssessmentDocument): FitnessAssessment {
  return {
    id,
    playerId: doc.playerId,
    date: toDate(doc.date),
    testType: doc.testType,
    value: doc.value,
    unit: doc.unit,
    percentile: doc.percentile ?? null,
    notes: doc.notes ?? null,
    createdAt: toDate(doc.createdAt),
    updatedAt: toDate(doc.updatedAt),
  };
}

/**
 * Get collection reference for assessments
 */
function getAssessmentsRef(userId: string, playerId: string) {
  return adminDb.collection(`users/${userId}/players/${playerId}/assessments`);
}

/**
 * Create a new fitness assessment (Admin SDK)
 */
export async function createAssessmentAdmin(
  userId: string,
  playerId: string,
  data: FitnessAssessmentCreateInput
): Promise<FitnessAssessment> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    const now = Timestamp.now();

    const docData = {
      playerId,
      date: Timestamp.fromDate(new Date(data.date)),
      testType: data.testType as FitnessTestType,
      value: data.value,
      unit: data.unit as FitnessTestUnit,
      percentile: data.percentile ?? null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await assessmentsRef.add(docData);
    const doc = await docRef.get();

    return toFitnessAssessment(docRef.id, doc.data() as FitnessAssessmentDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating assessment (Admin):', error);
    throw new Error(`Failed to create assessment: ${message}`);
  }
}

/**
 * Get single assessment by ID (Admin SDK)
 */
export async function getAssessmentAdmin(
  userId: string,
  playerId: string,
  assessmentId: string
): Promise<FitnessAssessment | null> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    const doc = await assessmentsRef.doc(assessmentId).get();

    if (!doc.exists) {
      return null;
    }

    return toFitnessAssessment(doc.id, doc.data() as FitnessAssessmentDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching assessment (Admin):', error);
    throw new Error(`Failed to fetch assessment: ${message}`);
  }
}

/**
 * Get all assessments for a player (Admin SDK)
 * Returns most recent first, with optional filtering and pagination
 */
export async function getAssessmentsAdmin(
  userId: string,
  playerId: string,
  options?: {
    testType?: FitnessTestType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: string;
  }
): Promise<{ assessments: FitnessAssessment[]; nextCursor: string | null }> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    let query = assessmentsRef.orderBy('date', 'desc');

    // Apply test type filter
    if (options?.testType) {
      query = query.where('testType', '==', options.testType);
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
      const cursorDoc = await assessmentsRef.doc(options.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Apply limit (default 50)
    const limit = options?.limit ?? 50;
    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const docs = snapshot.docs;

    const hasNextPage = docs.length > limit;
    const assessments = docs.slice(0, limit).map((doc) =>
      toFitnessAssessment(doc.id, doc.data() as FitnessAssessmentDocument)
    );

    return {
      assessments,
      nextCursor: hasNextPage ? docs[limit - 1].id : null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching assessments (Admin):', error);
    throw new Error(`Failed to fetch assessments: ${message}`);
  }
}

/**
 * Update assessment (Admin SDK)
 */
export async function updateAssessmentAdmin(
  userId: string,
  playerId: string,
  assessmentId: string,
  data: FitnessAssessmentUpdateInput
): Promise<FitnessAssessment> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    const docRef = assessmentsRef.doc(assessmentId);

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

    return toFitnessAssessment(doc.id, doc.data() as FitnessAssessmentDocument);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating assessment (Admin):', error);
    throw new Error(`Failed to update assessment: ${message}`);
  }
}

/**
 * Delete assessment (Admin SDK)
 */
export async function deleteAssessmentAdmin(
  userId: string,
  playerId: string,
  assessmentId: string
): Promise<void> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    await assessmentsRef.doc(assessmentId).delete();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting assessment (Admin):', error);
    throw new Error(`Failed to delete assessment: ${message}`);
  }
}

/**
 * Get latest assessment for each test type (Admin SDK)
 * Used for player profile summary
 */
export async function getLatestAssessmentsByTypeAdmin(
  userId: string,
  playerId: string
): Promise<Record<FitnessTestType, FitnessAssessment | null>> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);

    // Get all test types
    const testTypes: FitnessTestType[] = [
      'beep_test', '40_yard_dash', 'pro_agility', 'vertical_jump',
      'plank_hold', 'pushups_1min', 'situps_1min', 'mile_run'
    ];

    const result: Record<FitnessTestType, FitnessAssessment | null> = {} as Record<FitnessTestType, FitnessAssessment | null>;

    // Query each type separately (Firestore limitation)
    for (const testType of testTypes) {
      const snapshot = await assessmentsRef
        .where('testType', '==', testType)
        .orderBy('date', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        result[testType] = null;
      } else {
        const doc = snapshot.docs[0];
        result[testType] = toFitnessAssessment(doc.id, doc.data() as FitnessAssessmentDocument);
      }
    }

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching latest assessments (Admin):', error);
    throw new Error(`Failed to fetch latest assessments: ${message}`);
  }
}

/**
 * Get assessment progress for a specific test type (Admin SDK)
 * Returns historical data with improvement calculations
 */
export async function getAssessmentProgressAdmin(
  userId: string,
  playerId: string,
  testType: FitnessTestType,
  options?: {
    limit?: number;
  }
): Promise<{
  assessments: FitnessAssessment[];
  improvement: { improved: boolean; percentage: number } | null;
  metadata: (typeof fitnessTestMetadata)[FitnessTestType];
}> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);
    const limit = options?.limit ?? 10;

    const snapshot = await assessmentsRef
      .where('testType', '==', testType)
      .orderBy('date', 'desc')
      .limit(limit)
      .get();

    const assessments = snapshot.docs.map((doc) =>
      toFitnessAssessment(doc.id, doc.data() as FitnessAssessmentDocument)
    );

    // Calculate improvement between first and last assessment
    let improvement = null;
    if (assessments.length >= 2) {
      const latest = assessments[0];
      const earliest = assessments[assessments.length - 1];
      improvement = calculateImprovement(testType, earliest.value, latest.value);
    }

    return {
      assessments,
      improvement,
      metadata: fitnessTestMetadata[testType],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching assessment progress (Admin):', error);
    throw new Error(`Failed to fetch assessment progress: ${message}`);
  }
}

/**
 * Get assessment summary stats (Admin SDK)
 * Overview of all test types with latest results
 */
export async function getAssessmentSummaryAdmin(
  userId: string,
  playerId: string
): Promise<{
  totalAssessments: number;
  testsTaken: FitnessTestType[];
  latestByType: Record<FitnessTestType, { value: number; date: Date; percentile: number | null } | null>;
}> {
  try {
    const assessmentsRef = getAssessmentsRef(userId, playerId);

    // Get count of all assessments
    const countSnapshot = await assessmentsRef.get();
    const totalAssessments = countSnapshot.size;

    // Get latest for each type
    const latestByType = await getLatestAssessmentsByTypeAdmin(userId, playerId);

    // Determine which tests have been taken
    const testsTaken = Object.entries(latestByType)
      .filter(([, assessment]) => assessment !== null)
      .map(([testType]) => testType as FitnessTestType);

    // Simplify latest results
    const simplifiedLatest: Record<FitnessTestType, { value: number; date: Date; percentile: number | null } | null> = {} as Record<FitnessTestType, { value: number; date: Date; percentile: number | null } | null>;

    for (const [testType, assessment] of Object.entries(latestByType)) {
      if (assessment) {
        simplifiedLatest[testType as FitnessTestType] = {
          value: assessment.value,
          date: assessment.date,
          percentile: assessment.percentile ?? null,
        };
      } else {
        simplifiedLatest[testType as FitnessTestType] = null;
      }
    }

    return {
      totalAssessments,
      testsTaken,
      latestByType: simplifiedLatest,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching assessment summary (Admin):', error);
    throw new Error(`Failed to fetch assessment summary: ${message}`);
  }
}
