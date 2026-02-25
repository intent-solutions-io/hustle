/**
 * Integration Tests: Workout Logs Admin Service
 *
 * Tests real Firestore operations for the workoutLogs subcollection.
 * Validates: CRUD operations, nested exercises array with sets, automatic
 * totalVolume calculation, workout type filtering, in-memory date sorting,
 * and timestamp conversion.
 *
 * Collection: /users/{userId}/players/{playerId}/workoutLogs/{logId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createWorkoutLogAdmin,
  getWorkoutLogAdmin,
  getWorkoutLogsAdmin,
  updateWorkoutLogAdmin,
  deleteWorkoutLogAdmin,
} from './workout-logs';

const TEST_USER_ID = 'test-user-workout';

/**
 * Minimal exercise set fixture for reuse across tests.
 * Represents one exercise with two completed sets.
 */
const makeExercise = (
  exerciseId: string,
  exerciseName: string,
  weightLbs: number
) => ({
  exerciseId,
  exerciseName,
  targetSets: 3,
  targetReps: '8-10',
  sets: [
    { setNumber: 1, reps: 10, weight: weightLbs, completed: true },
    { setNumber: 2, reps: 9, weight: weightLbs, completed: true },
    { setNumber: 3, reps: 8, weight: weightLbs, completed: true },
  ],
});

describe('Workout Logs Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createWorkoutLogAdmin', () => {
    it('creates a workout log with exercises and calculates totalVolume', async () => {
      // squat: (10+9+8) reps * 135 lbs = 27 * 135 = 3645
      // bench:  (10+9+8) reps * 95 lbs  = 27 * 95  = 2565
      // totalVolume = 6210
      const log = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'strength',
        title: 'Lower Body Strength',
        duration: 50,
        exercises: [
          makeExercise('ex-squat', 'Back Squat', 135),
          makeExercise('ex-bench', 'Bench Press', 95),
        ],
      });

      expect(log.id).toBeTruthy();
      expect(log.playerId).toBe(playerId);
      expect(log.type).toBe('strength');
      expect(log.title).toBe('Lower Body Strength');
      expect(log.duration).toBe(50);
      expect(log.exercises).toHaveLength(2);
      expect(log.exercises[0].exerciseName).toBe('Back Squat');
      expect(log.exercises[1].exerciseName).toBe('Bench Press');
      // Each exercise has 3 sets
      expect(log.exercises[0].sets).toHaveLength(3);
      // Volume should be calculated (non-null, positive number)
      expect(log.totalVolume).not.toBeNull();
      expect(log.totalVolume).toBeGreaterThan(0);
      expect(log.date).toBeInstanceOf(Date);
      expect(log.completedAt).toBeInstanceOf(Date);
      expect(log.createdAt).toBeInstanceOf(Date);
      expect(log.updatedAt).toBeInstanceOf(Date);
    });

    it('stores bodyweight exercises (no weight) and still calculates volume', async () => {
      const log = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'core',
        title: 'Core Circuit',
        duration: 20,
        exercises: [
          {
            exerciseId: 'ex-plank',
            exerciseName: 'Plank Hold',
            targetSets: 3,
            targetReps: '30s',
            sets: [
              { setNumber: 1, reps: 1, weight: null, completed: true },
              { setNumber: 2, reps: 1, weight: null, completed: true },
              { setNumber: 3, reps: 1, weight: null, completed: true },
            ],
          },
        ],
      });

      expect(log.exercises[0].exerciseName).toBe('Plank Hold');
      // No weight — volume can be 0 or null, just should not throw
      expect(log.totalVolume).toBeDefined();
    });

    it('stores optional workoutId and journalEntryId when provided', async () => {
      const log = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'conditioning',
        title: 'Conditioning Block',
        duration: 30,
        workoutId: 'template-workout-abc',
        journalEntryId: 'journal-xyz',
        exercises: [makeExercise('ex-jump', 'Box Jump', 0)],
      });

      expect(log.workoutId).toBe('template-workout-abc');
      expect(log.journalEntryId).toBe('journal-xyz');
    });
  });

  describe('getWorkoutLogAdmin', () => {
    it('returns null for a non-existent log ID', async () => {
      const result = await getWorkoutLogAdmin(TEST_USER_ID, playerId, 'no-log-here');
      expect(result).toBeNull();
    });

    it('retrieves an existing log including the full exercises array', async () => {
      const created = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-25',
        type: 'strength',
        title: 'Pull Day',
        duration: 45,
        exercises: [makeExercise('ex-row', 'Barbell Row', 115)],
      });

      const fetched = await getWorkoutLogAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.title).toBe('Pull Day');
      expect(fetched!.exercises).toHaveLength(1);
      expect(fetched!.exercises[0].exerciseName).toBe('Barbell Row');
      expect(fetched!.exercises[0].sets).toHaveLength(3);
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getWorkoutLogsAdmin', () => {
    it('returns logs ordered by date descending', async () => {
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        type: 'core',
        title: 'Core August',
        duration: 20,
        exercises: [makeExercise('ex-crunch', 'Crunch', 0)],
      });
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        type: 'strength',
        title: 'Strength October',
        duration: 55,
        exercises: [makeExercise('ex-squat', 'Squat', 135)],
      });
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        type: 'conditioning',
        title: 'Conditioning September',
        duration: 35,
        exercises: [makeExercise('ex-jump', 'Jump Squat', 45)],
      });

      const { logs, nextCursor } = await getWorkoutLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(3);
      expect(logs[0].title).toBe('Strength October');    // Oct (most recent)
      expect(logs[1].title).toBe('Conditioning September'); // Sep
      expect(logs[2].title).toBe('Core August');         // Aug (oldest)
      expect(nextCursor).toBeNull();
    });

    it('filters logs by workout type', async () => {
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        type: 'strength',
        title: 'Strength A',
        duration: 50,
        exercises: [makeExercise('ex-dl', 'Deadlift', 185)],
      });
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-02',
        type: 'core',
        title: 'Core B',
        duration: 20,
        exercises: [makeExercise('ex-plank', 'Plank', 0)],
      });
      await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-03',
        type: 'strength',
        title: 'Strength C',
        duration: 55,
        exercises: [makeExercise('ex-sq', 'Squat', 145)],
      });

      const { logs } = await getWorkoutLogsAdmin(TEST_USER_ID, playerId, {
        type: 'strength',
      });

      expect(logs).toHaveLength(2);
      logs.forEach((log) => expect(log.type).toBe('strength'));
    });

    it('returns empty result when no logs exist', async () => {
      const { logs, nextCursor } = await getWorkoutLogsAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(logs).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updateWorkoutLogAdmin', () => {
    it('updates title and recalculates totalVolume when exercises change', async () => {
      const created = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'strength',
        title: 'Original Title',
        duration: 40,
        exercises: [makeExercise('ex-sq', 'Squat', 100)],
      });

      const originalVolume = created.totalVolume;

      const updated = await updateWorkoutLogAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          title: 'Updated Title',
          exercises: [makeExercise('ex-sq', 'Squat', 200)], // heavier — higher volume
        }
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.type).toBe('strength'); // unchanged
      expect(updated.totalVolume).not.toBeNull();
      // Volume should be higher now (200 lbs vs 100 lbs)
      expect(updated.totalVolume!).toBeGreaterThan(originalVolume ?? 0);
    });
  });

  describe('deleteWorkoutLogAdmin', () => {
    it('deletes a log and makes it unretrievable', async () => {
      const log = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'recovery',
        title: 'Recovery Session',
        duration: 25,
        exercises: [makeExercise('ex-foam', 'Foam Roll', 0)],
      });

      await deleteWorkoutLogAdmin(TEST_USER_ID, playerId, log.id);

      const result = await getWorkoutLogAdmin(TEST_USER_ID, playerId, log.id);
      expect(result).toBeNull();
    });

    it('deleting one log leaves the remaining logs intact', async () => {
      const keep = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-13',
        type: 'strength',
        title: 'Keeper',
        duration: 50,
        exercises: [makeExercise('ex-bp', 'Bench Press', 135)],
      });
      const remove = await createWorkoutLogAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-12',
        type: 'core',
        title: 'Goner',
        duration: 20,
        exercises: [makeExercise('ex-sit', 'Situp', 0)],
      });

      await deleteWorkoutLogAdmin(TEST_USER_ID, playerId, remove.id);

      const { logs } = await getWorkoutLogsAdmin(TEST_USER_ID, playerId);
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(keep.id);
      expect(logs[0].title).toBe('Keeper');
    });
  });
});
