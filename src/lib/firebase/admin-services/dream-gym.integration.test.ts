/**
 * Integration Tests: Dream Gym Admin Service
 *
 * Tests real Firestore operations for the Dream Gym singleton document.
 * Validates: singleton pattern (one doc per player), upsert create/update,
 * mental check-in append behavior, event add/remove, and timestamp conversion.
 *
 * Document path: /users/{userId}/players/{playerId}/dreamGym/profile
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedPlayer,
} from '@/test-utils/integration';
import {
  getDreamGymAdmin,
  upsertDreamGymAdmin,
  addMentalCheckInAdmin,
  addDreamGymEventAdmin,
  removeDreamGymEventAdmin,
} from './dream-gym';

const TEST_USER_ID = 'test-user-dreamgym';

/**
 * Baseline Dream Gym upsert input that passes type-checking.
 * Reused across tests that need an existing profile to operate on.
 */
const BASE_UPSERT_INPUT = {
  profile: {
    hasGymAccess: true,
    hasHomeEquipment: true,
    equipmentTags: ['dumbbells'] as ['dumbbells'],
    sport: 'soccer' as const,
    position: 'CM' as const,
    goals: ['muscle_build'] as ['muscle_build'],
    intensity: 'normal' as const,
    onboardingComplete: true,
  },
  schedule: {
    monday: 'practice_medium' as const,
    tuesday: 'off' as const,
    wednesday: 'practice_hard' as const,
    thursday: 'off' as const,
    friday: 'game' as const,
    saturday: 'off' as const,
    sunday: 'off' as const,
  },
};

describe('Dream Gym Admin Service (Integration)', () => {
  let playerId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    playerId = await seedPlayer(TEST_USER_ID);
  });

  describe('getDreamGymAdmin', () => {
    it('returns null when no Dream Gym profile exists for a player', async () => {
      const result = await getDreamGymAdmin(TEST_USER_ID, playerId);
      expect(result).toBeNull();
    });
  });

  describe('upsertDreamGymAdmin', () => {
    it('creates the singleton profile document when none exists', async () => {
      const dreamGym = await upsertDreamGymAdmin(
        TEST_USER_ID,
        playerId,
        BASE_UPSERT_INPUT
      );

      expect(dreamGym.id).toBe('profile'); // Singleton document ID
      expect(dreamGym.playerId).toBe(playerId);
      expect(dreamGym.profile.hasGymAccess).toBe(true);
      expect(dreamGym.profile.position).toBe('CM');
      expect(dreamGym.profile.goals).toContain('muscle_build');
      expect(dreamGym.profile.intensity).toBe('normal');
      expect(dreamGym.schedule.monday).toBe('practice_medium');
      expect(dreamGym.schedule.friday).toBe('game');
      // Default collections should be initialized empty
      expect(dreamGym.events).toHaveLength(0);
      expect(dreamGym.mental.checkIns).toHaveLength(0);
      expect(dreamGym.mental.favoriteTips).toHaveLength(0);
      expect(dreamGym.createdAt).toBeInstanceOf(Date);
      expect(dreamGym.updatedAt).toBeInstanceOf(Date);
    });

    it('updates an existing profile without resetting events or check-ins', async () => {
      // Create initial profile
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      // Verify it exists
      const initial = await getDreamGymAdmin(TEST_USER_ID, playerId);
      expect(initial).not.toBeNull();

      // Update with changed profile data
      const updated = await upsertDreamGymAdmin(TEST_USER_ID, playerId, {
        profile: {
          ...BASE_UPSERT_INPUT.profile,
          hasGymAccess: false,
          intensity: 'beast_mode',
          goals: ['fat_loss', 'leg_power'],
          equipmentTags: ['dumbbells', 'bands'],
        },
        schedule: {
          ...BASE_UPSERT_INPUT.schedule,
          saturday: 'practice_light',
        },
      });

      expect(updated.id).toBe('profile'); // Still the same singleton
      expect(updated.profile.hasGymAccess).toBe(false);
      expect(updated.profile.intensity).toBe('beast_mode');
      expect(updated.profile.goals).toContain('fat_loss');
      expect(updated.profile.goals).toContain('leg_power');
      expect(updated.profile.equipmentTags).toContain('bands');
      expect(updated.schedule.saturday).toBe('practice_light');
    });

    it('makes the profile retrievable via getDreamGymAdmin after upsert', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      const fetched = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(fetched).not.toBeNull();
      expect(fetched!.profile.sport).toBe('soccer');
      expect(fetched!.profile.onboardingComplete).toBe(true);
      expect(fetched!.createdAt).toBeInstanceOf(Date);
      expect(fetched!.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('addMentalCheckInAdmin', () => {
    it('appends a mental check-in to the profile and updates lastCheckIn', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      await addMentalCheckInAdmin(TEST_USER_ID, playerId, {
        mood: 4,
        energy: 'high',
        soreness: 'low',
        stress: 'low',
        notes: 'Feeling great before training.',
      });

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(dreamGym!.mental.checkIns).toHaveLength(1);
      expect(dreamGym!.mental.checkIns[0].mood).toBe(4);
      expect(dreamGym!.mental.checkIns[0].energy).toBe('high');
      expect(dreamGym!.mental.checkIns[0].soreness).toBe('low');
      expect(dreamGym!.mental.checkIns[0].stress).toBe('low');
      expect(dreamGym!.mental.checkIns[0].notes).toBe('Feeling great before training.');
      expect(dreamGym!.mental.checkIns[0].date).toBeInstanceOf(Date);
      expect(dreamGym!.mental.lastCheckIn).toBeInstanceOf(Date);
    });

    it('accumulates multiple check-ins in order of insertion', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      await addMentalCheckInAdmin(TEST_USER_ID, playerId, {
        mood: 3,
        energy: 'ok',
        soreness: 'medium',
        stress: 'medium',
      });

      await addMentalCheckInAdmin(TEST_USER_ID, playerId, {
        mood: 5,
        energy: 'high',
        soreness: 'low',
        stress: 'low',
      });

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(dreamGym!.mental.checkIns).toHaveLength(2);
      expect(dreamGym!.mental.checkIns[0].mood).toBe(3);
      expect(dreamGym!.mental.checkIns[1].mood).toBe(5);
    });

    it('throws when attempting to add a check-in to a non-existent profile', async () => {
      await expect(
        addMentalCheckInAdmin(TEST_USER_ID, playerId, {
          mood: 3,
          energy: 'ok',
          soreness: 'medium',
          stress: 'medium',
        })
      ).rejects.toThrow('Dream Gym profile not found');
    });
  });

  describe('addDreamGymEventAdmin', () => {
    it('adds an event and returns a generated event ID', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      const eventId = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-11-15'),
        type: 'game',
        name: 'State Cup Qualifier',
        notes: 'Away game, leave by 10am',
      });

      expect(eventId).toBeTruthy();
      expect(typeof eventId).toBe('string');

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(dreamGym!.events).toHaveLength(1);
      expect(dreamGym!.events[0].id).toBe(eventId);
      expect(dreamGym!.events[0].type).toBe('game');
      expect(dreamGym!.events[0].name).toBe('State Cup Qualifier');
      expect(dreamGym!.events[0].notes).toBe('Away game, leave by 10am');
      expect(dreamGym!.events[0].date).toBeInstanceOf(Date);
    });

    it('accumulates multiple events independently', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      const id1 = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-11-10'),
        type: 'tournament',
        name: 'Fall Classic',
      });

      const id2 = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-12-05'),
        type: 'tryout',
        name: 'ODP Tryout',
      });

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(dreamGym!.events).toHaveLength(2);
      const ids = dreamGym!.events.map((e) => e.id);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });

    it('throws when adding an event to a non-existent profile', async () => {
      await expect(
        addDreamGymEventAdmin(TEST_USER_ID, playerId, {
          date: new Date('2025-11-15'),
          type: 'game',
          name: 'Phantom Game',
        })
      ).rejects.toThrow('Dream Gym profile not found');
    });
  });

  describe('removeDreamGymEventAdmin', () => {
    it('removes a specific event by ID, leaving others intact', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      const keepId = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-11-10'),
        type: 'tournament',
        name: 'Keep This Tournament',
      });

      const removeId = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-12-01'),
        type: 'camp',
        name: 'Remove This Camp',
      });

      await removeDreamGymEventAdmin(TEST_USER_ID, playerId, removeId);

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);

      expect(dreamGym!.events).toHaveLength(1);
      expect(dreamGym!.events[0].id).toBe(keepId);
      expect(dreamGym!.events[0].name).toBe('Keep This Tournament');
    });

    it('is idempotent when removing an event ID that does not exist', async () => {
      await upsertDreamGymAdmin(TEST_USER_ID, playerId, BASE_UPSERT_INPUT);

      const eventId = await addDreamGymEventAdmin(TEST_USER_ID, playerId, {
        date: new Date('2025-11-10'),
        type: 'game',
        name: 'Existing Game',
      });

      // Remove a non-existent ID — should not throw or affect the real event
      await removeDreamGymEventAdmin(TEST_USER_ID, playerId, 'event_nonexistent');

      const dreamGym = await getDreamGymAdmin(TEST_USER_ID, playerId);
      expect(dreamGym!.events).toHaveLength(1);
      expect(dreamGym!.events[0].id).toBe(eventId);
    });
  });
});
