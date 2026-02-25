/**
 * Integration Tests: Biometrics Admin Service
 *
 * Tests real Firestore operations for the biometrics subcollection.
 * Validates: CRUD operations, nullable health metric fields, source
 * filtering, in-memory date sorting, and timestamp conversion.
 *
 * Collection: /users/{userId}/players/{playerId}/biometrics/{logId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createBiometricsLogAdmin,
  getBiometricsLogAdmin,
  getBiometricsLogsAdmin,
  updateBiometricsLogAdmin,
  deleteBiometricsLogAdmin,
} from './biometrics';

const TEST_USER_ID = 'test-user-biometrics';

describe('Biometrics Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createBiometricsLogAdmin', () => {
    it('creates a log with all health metrics and converts timestamps', async () => {
      const log = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'manual',
        restingHeartRate: 58,
        hrv: 72,
        sleepScore: 85,
        sleepHours: 8.5,
        steps: 9200,
        activeMinutes: 45,
      });

      expect(log.id).toBeTruthy();
      expect(log.playerId).toBe(playerId);
      expect(log.source).toBe('manual');
      expect(log.restingHeartRate).toBe(58);
      expect(log.hrv).toBe(72);
      expect(log.sleepScore).toBe(85);
      expect(log.sleepHours).toBe(8.5);
      expect(log.steps).toBe(9200);
      expect(log.activeMinutes).toBe(45);
      expect(log.date).toBeInstanceOf(Date);
      expect(log.createdAt).toBeInstanceOf(Date);
      expect(log.updatedAt).toBeInstanceOf(Date);
    });

    it('stores null for omitted optional health metrics', async () => {
      const log = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'manual',
      });

      expect(log.restingHeartRate).toBeNull();
      expect(log.maxHeartRate).toBeNull();
      expect(log.avgHeartRate).toBeNull();
      expect(log.hrv).toBeNull();
      expect(log.sleepScore).toBeNull();
      expect(log.sleepHours).toBeNull();
      expect(log.steps).toBeNull();
      expect(log.activeMinutes).toBeNull();
    });

    it('stores a garmin source correctly', async () => {
      const log = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'garmin',
        restingHeartRate: 55,
        hrv: 80,
        steps: 11000,
      });

      expect(log.source).toBe('garmin');
    });
  });

  describe('getBiometricsLogAdmin', () => {
    it('returns null for a non-existent log ID', async () => {
      const result = await getBiometricsLogAdmin(TEST_USER_ID, playerId, 'phantom-id');
      expect(result).toBeNull();
    });

    it('retrieves an existing log with all fields intact', async () => {
      const created = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-10',
        source: 'manual',
        restingHeartRate: 62,
        sleepHours: 7.0,
      });

      const fetched = await getBiometricsLogAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.restingHeartRate).toBe(62);
      expect(fetched!.sleepHours).toBe(7.0);
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getBiometricsLogsAdmin', () => {
    it('returns logs ordered by date descending', async () => {
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        source: 'manual',
        sleepScore: 70,
      });
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        source: 'manual',
        sleepScore: 90,
      });
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        source: 'manual',
        sleepScore: 80,
      });

      const { logs, nextCursor } = await getBiometricsLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(3);
      expect(logs[0].sleepScore).toBe(90); // Oct (most recent)
      expect(logs[1].sleepScore).toBe(80); // Sep
      expect(logs[2].sleepScore).toBe(70); // Aug (oldest)
      expect(nextCursor).toBeNull();
    });

    it('filters logs by source', async () => {
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        source: 'manual',
        steps: 8000,
      });
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-02',
        source: 'garmin',
        steps: 12000,
      });
      await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-03',
        source: 'garmin',
        steps: 10000,
      });

      const { logs } = await getBiometricsLogsAdmin(TEST_USER_ID, playerId, {
        source: 'garmin',
      });

      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.source).toBe('garmin'));
    });

    it('returns empty result when no logs exist', async () => {
      const { logs, nextCursor } = await getBiometricsLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updateBiometricsLogAdmin', () => {
    it('updates specified fields and refreshes updatedAt', async () => {
      const created = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'manual',
        restingHeartRate: 65,
        sleepScore: 72,
      });

      const originalUpdatedAt = created.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 50));

      const updated = await updateBiometricsLogAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          restingHeartRate: 60,
          sleepScore: 85,
          hrv: 68,
        }
      );

      expect(updated.restingHeartRate).toBe(60);
      expect(updated.sleepScore).toBe(85);
      expect(updated.hrv).toBe(68);
      expect(updated.source).toBe('manual'); // unchanged
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('deleteBiometricsLogAdmin', () => {
    it('deletes a log and makes it unretrievable', async () => {
      const log = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'manual',
        steps: 7500,
      });

      await deleteBiometricsLogAdmin(TEST_USER_ID, playerId, log.id);

      const result = await getBiometricsLogAdmin(TEST_USER_ID, playerId, log.id);
      expect(result).toBeNull();
    });

    it('deleting one log leaves the rest of the collection intact', async () => {
      const keep = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-16',
        source: 'manual',
        sleepScore: 88,
      });
      const remove = await createBiometricsLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        source: 'manual',
        sleepScore: 60,
      });

      await deleteBiometricsLogAdmin(TEST_USER_ID, playerId, remove.id);

      const { logs } = await getBiometricsLogsAdmin(TEST_USER_ID, playerId);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(keep.id);
    });
  });
});
