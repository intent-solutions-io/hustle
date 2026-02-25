/**
 * Integration Tests: Practice Logs Admin Service
 *
 * Tests real Firestore operations for the practiceLogs subcollection.
 * Validates: CRUD operations, focusAreas array storage, practice type
 * filtering, in-memory date sorting, and timestamp conversion.
 *
 * Collection: /users/{userId}/players/{playerId}/practiceLogs/{logId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createPracticeLogAdmin,
  getPracticeLogAdmin,
  getPracticeLogsAdmin,
  updatePracticeLogAdmin,
  deletePracticeLogAdmin,
} from './practice-logs';

const TEST_USER_ID = 'test-user-practice';

describe('Practice Logs Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createPracticeLogAdmin', () => {
    it('creates a practice log with all fields and converts timestamps', async () => {
      const log = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'team_practice',
        durationMinutes: 90,
        focusAreas: ['passing', 'shooting', 'positioning'],
        teamName: 'Riverside FC',
        intensity: 4,
        enjoyment: 5,
        notes: 'Great session, coach focused on combination play.',
      });

      expect(log.id).toBeTruthy();
      expect(log.playerId).toBe(playerId);
      expect(log.practiceType).toBe('team_practice');
      expect(log.durationMinutes).toBe(90);
      expect(log.focusAreas).toEqual(['passing', 'shooting', 'positioning']);
      expect(log.teamName).toBe('Riverside FC');
      expect(log.intensity).toBe(4);
      expect(log.enjoyment).toBe(5);
      expect(log.notes).toBe('Great session, coach focused on combination play.');
      expect(log.date).toBeInstanceOf(Date);
      expect(log.createdAt).toBeInstanceOf(Date);
      expect(log.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults optional fields to null when not provided', async () => {
      const log = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'individual',
        durationMinutes: 45,
        focusAreas: ['dribbling'],
      });

      expect(log.teamName).toBeNull();
      expect(log.location).toBeNull();
      expect(log.drillsCompleted).toBeNull();
      expect(log.intensity).toBeNull();
      expect(log.enjoyment).toBeNull();
      expect(log.improvement).toBeNull();
      expect(log.notes).toBeNull();
    });

    it('stores a multi-element focusAreas array intact', async () => {
      const log = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'camp',
        durationMinutes: 120,
        focusAreas: ['passing', 'first_touch', 'defending', 'tactics'],
      });

      expect(log.focusAreas).toHaveLength(4);
      expect(log.focusAreas).toContain('passing');
      expect(log.focusAreas).toContain('first_touch');
      expect(log.focusAreas).toContain('defending');
      expect(log.focusAreas).toContain('tactics');
    });
  });

  describe('getPracticeLogAdmin', () => {
    it('returns null for a non-existent log ID', async () => {
      const result = await getPracticeLogAdmin(TEST_USER_ID, playerId, 'ghost-log');
      expect(result).toBeNull();
    });

    it('retrieves an existing log with correct focusAreas array', async () => {
      const created = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-20',
        practiceType: 'small_group',
        durationMinutes: 60,
        focusAreas: ['shooting', 'set_pieces'],
        teamName: 'Elite Group',
      });

      const fetched = await getPracticeLogAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.practiceType).toBe('small_group');
      expect(fetched!.focusAreas).toEqual(['shooting', 'set_pieces']);
      expect(fetched!.teamName).toBe('Elite Group');
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getPracticeLogsAdmin', () => {
    it('returns logs ordered by date descending', async () => {
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        practiceType: 'individual',
        durationMinutes: 30,
        focusAreas: ['dribbling'],
      });
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        practiceType: 'team_practice',
        durationMinutes: 90,
        focusAreas: ['passing'],
      });
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        practiceType: 'private_lesson',
        durationMinutes: 60,
        focusAreas: ['shooting'],
      });

      const { logs, nextCursor } = await getPracticeLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(3);
      expect(logs[0].practiceType).toBe('team_practice');   // Oct (most recent)
      expect(logs[1].practiceType).toBe('private_lesson');  // Sep
      expect(logs[2].practiceType).toBe('individual');      // Aug (oldest)
      expect(nextCursor).toBeNull();
    });

    it('filters logs by practiceType', async () => {
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        practiceType: 'team_practice',
        durationMinutes: 90,
        focusAreas: ['passing'],
      });
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-02',
        practiceType: 'individual',
        durationMinutes: 40,
        focusAreas: ['dribbling'],
      });
      await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-03',
        practiceType: 'team_practice',
        durationMinutes: 75,
        focusAreas: ['tactics'],
      });

      const { logs } = await getPracticeLogsAdmin(TEST_USER_ID, playerId, {
        practiceType: 'team_practice',
      });

      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.practiceType).toBe('team_practice'));
    });

    it('returns empty result when no logs exist', async () => {
      const { logs, nextCursor } = await getPracticeLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updatePracticeLogAdmin', () => {
    it('updates duration, intensity, and focusAreas array', async () => {
      const created = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'team_practice',
        durationMinutes: 60,
        focusAreas: ['passing'],
        intensity: 3,
      });

      const updated = await updatePracticeLogAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          durationMinutes: 75,
          focusAreas: ['passing', 'shooting', 'fitness'],
          intensity: 5,
        }
      );

      expect(updated.durationMinutes).toBe(75);
      expect(updated.focusAreas).toEqual(['passing', 'shooting', 'fitness']);
      expect(updated.intensity).toBe(5);
      expect(updated.practiceType).toBe('team_practice'); // unchanged
    });
  });

  describe('deletePracticeLogAdmin', () => {
    it('deletes a log and makes it unretrievable', async () => {
      const log = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'clinic',
        durationMinutes: 90,
        focusAreas: ['goalkeeping'],
      });

      await deletePracticeLogAdmin(TEST_USER_ID, playerId, log.id);

      const result = await getPracticeLogAdmin(TEST_USER_ID, playerId, log.id);
      expect(result).toBeNull();
    });

    it('deleting one log leaves remaining logs intact', async () => {
      const keep = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-09',
        practiceType: 'team_practice',
        durationMinutes: 90,
        focusAreas: ['passing', 'shooting'],
      });
      const remove = await createPracticeLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-08',
        practiceType: 'individual',
        durationMinutes: 30,
        focusAreas: ['dribbling'],
      });

      await deletePracticeLogAdmin(TEST_USER_ID, playerId, remove.id);

      const { logs } = await getPracticeLogsAdmin(TEST_USER_ID, playerId);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(keep.id);
      expect(logs[0].focusAreas).toEqual(['passing', 'shooting']);
    });
  });
});
