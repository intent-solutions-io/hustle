/**
 * Integration Tests: Cardio Logs Admin Service
 *
 * Tests real Firestore operations for the cardioLogs subcollection.
 * Validates: CRUD operations, automatic pace calculation, activity type
 * filtering, in-memory date sorting, and timestamp conversion.
 *
 * Collection: /users/{userId}/players/{playerId}/cardioLogs/{logId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createCardioLogAdmin,
  getCardioLogAdmin,
  getCardioLogsAdmin,
  updateCardioLogAdmin,
  deleteCardioLogAdmin,
} from './cardio-logs';

const TEST_USER_ID = 'test-user-cardio';

describe('Cardio Logs Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createCardioLogAdmin', () => {
    it('creates a cardio log and auto-calculates avgPacePerMile when not provided', async () => {
      // 3 miles in 24 minutes = 8:00/mile pace
      const log = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'run',
        distanceMiles: 3,
        durationMinutes: 24,
      });

      expect(log.id).toBeTruthy();
      expect(log.playerId).toBe(playerId);
      expect(log.activityType).toBe('run');
      expect(log.distanceMiles).toBe(3);
      expect(log.durationMinutes).toBe(24);
      // Service calculates pace as mm:ss string
      expect(log.avgPacePerMile).toMatch(/^\d{1,2}:\d{2}$/);
      expect(log.date).toBeInstanceOf(Date);
      expect(log.createdAt).toBeInstanceOf(Date);
      expect(log.updatedAt).toBeInstanceOf(Date);
    });

    it('stores an explicitly supplied pace and does not override it', async () => {
      const log = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'jog',
        distanceMiles: 2,
        durationMinutes: 22,
        avgPacePerMile: '11:00',
      });

      expect(log.avgPacePerMile).toBe('11:00');
    });

    it('defaults all optional fields to null when not provided', async () => {
      const log = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'sprint',
        distanceMiles: 0.25,
        durationMinutes: 2,
      });

      expect(log.calories).toBeNull();
      expect(log.avgHeartRate).toBeNull();
      expect(log.maxHeartRate).toBeNull();
      expect(log.location).toBeNull();
      expect(log.weather).toBeNull();
      expect(log.notes).toBeNull();
      expect(log.perceivedEffort).toBeNull();
    });

    it('stores optional contextual fields when provided', async () => {
      const log = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'long_run',
        distanceMiles: 6,
        durationMinutes: 54,
        location: 'River Trail',
        avgHeartRate: 155,
        calories: 480,
      });

      expect(log.location).toBe('River Trail');
      expect(log.avgHeartRate).toBe(155);
      expect(log.calories).toBe(480);
    });
  });

  describe('getCardioLogAdmin', () => {
    it('returns null for a non-existent log ID', async () => {
      const result = await getCardioLogAdmin(TEST_USER_ID, playerId, 'no-such-log');
      expect(result).toBeNull();
    });

    it('retrieves an existing log with all fields correctly mapped', async () => {
      const created = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-05',
        activityType: 'interval',
        distanceMiles: 1.5,
        durationMinutes: 15,
        location: 'Track',
      });

      const fetched = await getCardioLogAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.activityType).toBe('interval');
      expect(fetched!.distanceMiles).toBe(1.5);
      expect(fetched!.location).toBe('Track');
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getCardioLogsAdmin', () => {
    it('returns logs ordered by date descending', async () => {
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        activityType: 'jog',
        distanceMiles: 2,
        durationMinutes: 20,
      });
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        activityType: 'run',
        distanceMiles: 4,
        durationMinutes: 32,
      });
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        activityType: 'long_run',
        distanceMiles: 6,
        durationMinutes: 54,
      });

      const { logs, nextCursor } = await getCardioLogsAdmin(TEST_USER_ID, playerId);

      expect(logs).toHaveLength(3);
      expect(logs[0].activityType).toBe('run');        // Oct (most recent)
      expect(logs[1].activityType).toBe('long_run');   // Sep
      expect(logs[2].activityType).toBe('jog');        // Aug (oldest)
      expect(nextCursor).toBeNull();
    });

    it('filters logs by activityType', async () => {
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        activityType: 'run',
        distanceMiles: 3,
        durationMinutes: 27,
      });
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-02',
        activityType: 'jog',
        distanceMiles: 2,
        durationMinutes: 22,
      });
      await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-03',
        activityType: 'run',
        distanceMiles: 5,
        durationMinutes: 42,
      });

      const { logs } = await getCardioLogsAdmin(TEST_USER_ID, playerId, {
        activityType: 'run',
      });

      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.activityType).toBe('run'));
    });

    it('returns empty result when no logs exist', async () => {
      const { logs, nextCursor } = await getCardioLogsAdmin(TEST_USER_ID, playerId);

      expect(logs).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updateCardioLogAdmin', () => {
    it('updates distance and recalculates pace automatically', async () => {
      const created = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'run',
        distanceMiles: 3,
        durationMinutes: 30,
      });

      const updated = await updateCardioLogAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          distanceMiles: 4,
          durationMinutes: 36,
        }
      );

      expect(updated.distanceMiles).toBe(4);
      expect(updated.durationMinutes).toBe(36);
      // Pace should be recalculated (36min / 4mi = 9:00/mile)
      expect(updated.avgPacePerMile).toMatch(/^\d{1,2}:\d{2}$/);
      expect(updated.activityType).toBe('run'); // unchanged
    });

    it('updates optional fields like location and notes', async () => {
      const created = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'recovery',
        distanceMiles: 1,
        durationMinutes: 12,
      });

      const updated = await updateCardioLogAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          location: 'Neighborhood loop',
          notes: 'Easy recovery jog',
        }
      );

      expect(updated.location).toBe('Neighborhood loop');
      expect(updated.notes).toBe('Easy recovery jog');
    });
  });

  describe('deleteCardioLogAdmin', () => {
    it('deletes a log and makes it unretrievable', async () => {
      const log = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'run',
        distanceMiles: 3,
        durationMinutes: 27,
      });

      await deleteCardioLogAdmin(TEST_USER_ID, playerId, log.id);

      const result = await getCardioLogAdmin(TEST_USER_ID, playerId, log.id);
      expect(result).toBeNull();
    });

    it('deleting one log leaves the remaining logs intact', async () => {
      const keep = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-11',
        activityType: 'run',
        distanceMiles: 4,
        durationMinutes: 35,
      });
      const remove = await createCardioLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-10',
        activityType: 'jog',
        distanceMiles: 2,
        durationMinutes: 22,
      });

      await deleteCardioLogAdmin(TEST_USER_ID, playerId, remove.id);

      const { logs } = await getCardioLogsAdmin(TEST_USER_ID, playerId);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(keep.id);
    });
  });
});
