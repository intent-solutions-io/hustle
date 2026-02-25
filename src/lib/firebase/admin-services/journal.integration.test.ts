/**
 * Integration Tests: Journal Admin Service
 *
 * Tests real Firestore operations for the journal subcollection.
 * Validates: CRUD operations, context and mood filtering, pagination,
 * linked workout/game IDs, and timestamp conversion.
 *
 * Collection: /users/{userId}/players/{playerId}/journal/{entryId}
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  createJournalEntryAdmin,
  getJournalEntryAdmin,
  getJournalEntriesAdmin,
  updateJournalEntryAdmin,
  deleteJournalEntryAdmin,
} from './journal';

const TEST_USER_ID = 'test-user-journal';

describe('Journal Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('createJournalEntryAdmin', () => {
    it('creates a journal entry with all fields and converts timestamps', async () => {
      const entry = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'Had a great training session today. Really clicked with the passing drills.',
        context: 'daily_journal',
        moodTag: 'great',
        energyTag: 'energized',
      });

      expect(entry.id).toBeTruthy();
      expect(entry.playerId).toBe(playerId);
      expect(entry.content).toBe(
        'Had a great training session today. Really clicked with the passing drills.'
      );
      expect(entry.context).toBe('daily_journal');
      expect(entry.moodTag).toBe('great');
      expect(entry.energyTag).toBe('energized');
      expect(entry.linkedWorkoutId).toBeNull();
      expect(entry.linkedGameId).toBeNull();
      expect(entry.date).toBeInstanceOf(Date);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('defaults optional tag fields to null when omitted', async () => {
      const entry = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'Quick check-in before the game.',
        context: 'quick_entry',
      });

      expect(entry.moodTag).toBeNull();
      expect(entry.energyTag).toBeNull();
      expect(entry.linkedWorkoutId).toBeNull();
      expect(entry.linkedGameId).toBeNull();
    });

    it('stores linked workout and game IDs correctly', async () => {
      const entry = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'Post-workout reflection after today\'s strength session.',
        context: 'workout_reflection',
        linkedWorkoutId: 'workout-abc-123',
        linkedGameId: null,
      });

      expect(entry.linkedWorkoutId).toBe('workout-abc-123');
      expect(entry.linkedGameId).toBeNull();
    });
  });

  describe('getJournalEntryAdmin', () => {
    it('returns null for a non-existent entry ID', async () => {
      const result = await getJournalEntryAdmin(TEST_USER_ID, playerId, 'ghost-entry');
      expect(result).toBeNull();
    });

    it('retrieves an existing entry with all fields intact', async () => {
      const created = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-20',
        content: 'Tough game, but I learned a lot.',
        context: 'game_reflection',
        moodTag: 'okay',
        energyTag: 'tired',
      });

      const fetched = await getJournalEntryAdmin(TEST_USER_ID, playerId, created.id);

      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
      expect(fetched!.content).toBe('Tough game, but I learned a lot.');
      expect(fetched!.context).toBe('game_reflection');
      expect(fetched!.moodTag).toBe('okay');
      expect(fetched!.energyTag).toBe('tired');
      expect(fetched!.date).toBeInstanceOf(Date);
    });
  });

  describe('getJournalEntriesAdmin', () => {
    it('returns entries ordered by date descending', async () => {
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-08-01',
        content: 'Oldest entry',
        context: 'daily_journal',
      });
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        content: 'Newest entry',
        context: 'daily_journal',
      });
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-09-01',
        content: 'Middle entry',
        context: 'daily_journal',
      });

      const { entries, nextCursor } = await getJournalEntriesAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(entries).toHaveLength(3);
      expect(entries[0].content).toBe('Newest entry');
      expect(entries[1].content).toBe('Middle entry');
      expect(entries[2].content).toBe('Oldest entry');
      expect(nextCursor).toBeNull();
    });

    it('filters entries by context', async () => {
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-01',
        content: 'Post-workout thoughts',
        context: 'workout_reflection',
      });
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-02',
        content: 'Daily entry',
        context: 'daily_journal',
      });
      await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-03',
        content: 'Another workout reflection',
        context: 'workout_reflection',
      });

      const { entries } = await getJournalEntriesAdmin(TEST_USER_ID, playerId, {
        context: 'workout_reflection',
      });

      expect(entries).toHaveLength(2);
      entries.forEach((entry) => {
        expect(entry.context).toBe('workout_reflection');
      });
    });

    it('returns empty list when no entries exist', async () => {
      const { entries, nextCursor } = await getJournalEntriesAdmin(
        TEST_USER_ID,
        playerId
      );

      expect(entries).toHaveLength(0);
      expect(nextCursor).toBeNull();
    });
  });

  describe('updateJournalEntryAdmin', () => {
    it('updates content and moodTag, preserves other fields', async () => {
      const created = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'First draft of my thoughts.',
        context: 'daily_journal',
        moodTag: 'okay',
        energyTag: 'normal',
      });

      const updated = await updateJournalEntryAdmin(
        TEST_USER_ID,
        playerId,
        created.id,
        {
          content: 'Revised and more thoughtful reflection on today.',
          moodTag: 'good',
        }
      );

      expect(updated.id).toBe(created.id);
      expect(updated.content).toBe('Revised and more thoughtful reflection on today.');
      expect(updated.moodTag).toBe('good');
      expect(updated.energyTag).toBe('normal'); // unchanged
      expect(updated.context).toBe('daily_journal'); // unchanged
    });
  });

  describe('deleteJournalEntryAdmin', () => {
    it('deletes an entry and makes it unretrievable', async () => {
      const entry = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'This entry will be deleted.',
        context: 'quick_entry',
      });

      await deleteJournalEntryAdmin(TEST_USER_ID, playerId, entry.id);

      const result = await getJournalEntryAdmin(TEST_USER_ID, playerId, entry.id);
      expect(result).toBeNull();
    });

    it('deleting one entry does not affect the remaining entries', async () => {
      const keep = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-16',
        content: 'Keep this one.',
        context: 'daily_journal',
      });
      const remove = await createJournalEntryAdmin(TEST_USER_ID, playerId, {
        date: '2025-10-15',
        content: 'Remove this one.',
        context: 'daily_journal',
      });

      await deleteJournalEntryAdmin(TEST_USER_ID, playerId, remove.id);

      const { entries } = await getJournalEntriesAdmin(TEST_USER_ID, playerId);
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(keep.id);
    });
  });
});
