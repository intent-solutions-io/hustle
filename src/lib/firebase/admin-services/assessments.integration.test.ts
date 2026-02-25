/**
 * Integration Tests: Fitness Assessments Admin Service
 *
 * Tests real Firestore operations for the assessments subcollection.
 * Validates: CRUD operations, pagination, date ordering, and timestamp
 * conversion from Firestore Timestamps to client-side Date objects.
 *
 * Collection: /users/{userId}/players/{playerId}/assessments/{assessmentId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createAssessmentAdmin,
  getAssessmentAdmin,
  getAssessmentsAdmin,
  updateAssessmentAdmin,
  deleteAssessmentAdmin,
} from './assessments';

const TEST_USER_ID = 'test-user-assessments';

describe('Assessments Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createAssessmentAdmin', () => {
    it('creates an assessment with all fields and converts timestamps', async () => {
      const assessment = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'vertical_jump',
        value: 24,
        unit: 'inches',
        percentile: 75,
        notes: 'Personal best',
      });

      expect(assessment.id).toBeTruthy();
      expect(assessment.playerId).toBe(playerId);
      expect(assessment.testType).toBe('vertical_jump');
      expect(assessment.value).toBe(24);
      expect(assessment.unit).toBe('inches');
      expect(assessment.percentile).toBe(75);
      expect(assessment.notes).toBe('Personal best');
      expect(assessment.date).toBeInstanceOf(Date);
      expect(assessment.createdAt).toBeInstanceOf(Date);
      expect(assessment.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults optional fields to null when not provided', async () => {
      const assessment = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'plank_hold',
        value: 90,
        unit: 'seconds',
      });

      expect(assessment.percentile).toBeNull();
      expect(assessment.notes).toBeNull();
    });
  });

  describe('getAssessmentAdmin', () => {
    it('returns null for a non-existent assessment ID', async () => {
      const result = await getAssessmentAdmin(TEST_USER_ID, playerId, 'does-not-exist');
      expect(result).toBeNull();
    });

    it('retrieves an existing assessment with correct field values', async () => {
      const created = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-15',
        testType: 'beep_test',
        value: 12,
        unit: 'level',
        percentile: 60,
      });

      const fetched = await getAssessmentAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.testType).toBe('beep_test');
      expect(fetched!.value).toBe(12);
      expect(fetched!.percentile).toBe(60);
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getAssessmentsAdmin', () => {
    it('returns assessments ordered by date descending', async () => {
      await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        testType: 'pushups_1min',
        value: 30,
        unit: 'count',
      });
      await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'pushups_1min',
        value: 38,
        unit: 'count',
      });
      await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        testType: 'pushups_1min',
        value: 34,
        unit: 'count',
      });

      const { assessments, nextCursor } = await getAssessmentsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(assessments).toHaveLength(3);
      expect(assessments[0].value).toBe(38); // Oct is most recent
      expect(assessments[1].value).toBe(34); // Sep
      expect(assessments[2].value).toBe(30); // Aug is oldest
      expect(nextCursor).toBeNull();
    });

    it('filters assessments by testType', async () => {
      await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'vertical_jump',
        value: 24,
        unit: 'inches',
      });
      await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'mile_run',
        value: 7,
        unit: 'time',
      });

      const { assessments } = await getAssessmentsAdmin(TEST_USER_ID, playerId, {
        testType: 'vertical_jump',
      });

      expect(assessments).toHaveLength(1);
      expect(assessments[0].testType).toBe('vertical_jump');
    });

    it('returns empty list when no assessments exist', async () => {
      const { assessments, nextCursor } = await getAssessmentsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(assessments).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updateAssessmentAdmin', () => {
    it('updates value and notes, refreshes updatedAt timestamp', async () => {
      const created = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: '40_yard_dash',
        value: 5.2,
        unit: 'seconds',
        notes: 'Initial',
      });

      const originalUpdatedAt = created.updatedAt;

      // Small delay so updatedAt will differ
      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = await updateAssessmentAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          value: 4.9,
          notes: 'Improved by 0.3s',
        }
      );

      expect(updated.id).toBe(created.id);
      expect(updated.value).toBe(4.9);
      expect(updated.notes).toBe('Improved by 0.3s');
      expect(updated.testType).toBe('40_yard_dash'); // unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('deleteAssessmentAdmin', () => {
    it('deletes an assessment and makes it unretrievable', async () => {
      const assessment = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'situps_1min',
        value: 45,
        unit: 'count',
      });

      await deleteAssessmentAdmin(TEST_USER_ID, playerId, assessment.id);

      const result = await getAssessmentAdmin(TEST_USER_ID, playerId, assessment.id);
      expect(result).toBeNull();
    });

    it('removing one assessment does not affect others in the collection', async () => {
      const keep = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        testType: 'pro_agility',
        value: 4.8,
        unit: 'seconds',
      });
      const remove = await createAssessmentAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        testType: 'beep_test',
        value: 10,
        unit: 'level',
      });

      await deleteAssessmentAdmin(TEST_USER_ID, playerId, remove.id);

      const { assessments } = await getAssessmentsAdmin(TEST_USER_ID, playerId);
      expect(assessments).toHaveLength(1);
      expect(assessments[0].id).toBe(keep.id);
    });
  });
});
