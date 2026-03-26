/**
 * Integration Tests: Users Admin Service
 *
 * Tests real Firestore CRUD operations against the Firebase Emulator.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearEmulators, seedUserProfile, readDoc } from '@/test-utils/integration';
import { getUserProfileAdmin, updateUserProfileAdmin } from './users';

const TEST_USER_ID = 'test-user-users';

describe('Users Admin Service (Integration)', () => {
  beforeEach(async () => {
    await clearEmulators();
  });

  describe('getUserProfileAdmin', () => {
    it('returns null for non-existent user', async () => {
      const user = await getUserProfileAdmin('nonexistent');
      expect(user).toBeNull();
    });

    it('returns a user profile with converted timestamps', async () => {
      await seedUserProfile(TEST_USER_ID, {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@test.com',
      });

      const user = await getUserProfileAdmin(TEST_USER_ID);
      expect(user).not.toBeNull();
      expect(user!.id).toBe(TEST_USER_ID);
      expect(user!.firstName).toBe('Jane');
      expect(user!.lastName).toBe('Doe');
      expect(user!.email).toBe('jane@test.com');
      expect(user!.createdAt).toBeInstanceOf(Date);
      expect(user!.updatedAt).toBeInstanceOf(Date);
    });

    it('returns null termsAgreedAt and privacyAgreedAt when set to null', async () => {
      await seedUserProfile(TEST_USER_ID, {
        termsAgreedAt: null,
        privacyAgreedAt: null,
      });

      const user = await getUserProfileAdmin(TEST_USER_ID);
      expect(user!.termsAgreedAt).toBeNull();
      expect(user!.privacyAgreedAt).toBeNull();
    });

    it('returns verificationPinHash when present', async () => {
      await seedUserProfile(TEST_USER_ID, {
        verificationPinHash: '$2b$10$somehash',
      });

      const user = await getUserProfileAdmin(TEST_USER_ID);
      expect(user!.verificationPinHash).toBe('$2b$10$somehash');
    });

    it('returns workspace ownership fields', async () => {
      await seedUserProfile(TEST_USER_ID, {
        defaultWorkspaceId: 'ws-123',
        ownedWorkspaces: ['ws-123', 'ws-456'],
      });

      const user = await getUserProfileAdmin(TEST_USER_ID);
      expect(user!.defaultWorkspaceId).toBe('ws-123');
      expect(user!.ownedWorkspaces).toEqual(['ws-123', 'ws-456']);
    });
  });

  describe('updateUserProfileAdmin', () => {
    it('updates specific fields and returns updated user', async () => {
      await seedUserProfile(TEST_USER_ID, {
        firstName: 'Original',
        lastName: 'Name',
      });

      const updated = await updateUserProfileAdmin(TEST_USER_ID, {
        firstName: 'Updated',
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.lastName).toBe('Name'); // unchanged
    });

    it('updates the updatedAt timestamp', async () => {
      await seedUserProfile(TEST_USER_ID);
      const before = await getUserProfileAdmin(TEST_USER_ID);

      await new Promise(r => setTimeout(r, 50));
      const updated = await updateUserProfileAdmin(TEST_USER_ID, {
        lastName: 'NewLast',
      });

      expect(updated.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
    });

    it('persists changes to Firestore', async () => {
      await seedUserProfile(TEST_USER_ID, { phone: null });

      await updateUserProfileAdmin(TEST_USER_ID, { phone: '+15551234567' });

      const raw = await readDoc(`users/${TEST_USER_ID}`);
      expect(raw!.phone).toBe('+15551234567');
    });
  });
});
