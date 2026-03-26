/**
 * Integration Tests: Workspaces Admin Service
 *
 * Tests real Firestore CRUD, FieldValue.increment, and query operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearEmulators, seedUserProfile, seedWorkspace, readDoc } from '@/test-utils/integration';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  getWorkspaceByIdAdmin,
  getWorkspaceByStripeCustomerIdAdmin,
  updateWorkspaceBillingAdmin,
  updateWorkspaceStatusAdmin,
  incrementWorkspacePlayerCountAdmin,
  incrementWorkspaceGamesThisMonthAdmin,
  updateWorkspaceStorageUsageAdmin,
} from './workspaces';

const TEST_USER_ID = 'test-user-workspaces';

describe('Workspaces Admin Service (Integration)', () => {
  let workspaceId: string;

  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
    workspaceId = await seedWorkspace(TEST_USER_ID);
  });

  describe('getWorkspaceByIdAdmin', () => {
    it('returns null for non-existent workspace', async () => {
      const ws = await getWorkspaceByIdAdmin('nonexistent');
      expect(ws).toBeNull();
    });

    it('returns workspace with converted timestamps', async () => {
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws).not.toBeNull();
      expect(ws!.id).toBe(workspaceId);
      expect(ws!.ownerUserId).toBe(TEST_USER_ID);
      expect(ws!.plan).toBe('starter');
      expect(ws!.status).toBe('active');
      expect(ws!.createdAt).toBeInstanceOf(Date);
      expect(ws!.updatedAt).toBeInstanceOf(Date);
    });

    it('returns correct usage counts', async () => {
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.playerCount).toBe(0);
      expect(ws!.usage.gamesThisMonth).toBe(0);
      expect(ws!.usage.storageUsedMB).toBe(0);
    });

    it('returns members with converted addedAt dates', async () => {
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.members).toHaveLength(1);
      expect(ws!.members[0].role).toBe('owner');
      expect(ws!.members[0].addedAt).toBeInstanceOf(Date);
    });

    it('returns billing fields correctly', async () => {
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.billing.stripeCustomerId).toBeNull();
      expect(ws!.billing.stripeSubscriptionId).toBeNull();
      expect(ws!.billing.currentPeriodEnd).toBeNull();
    });
  });

  describe('getWorkspaceByStripeCustomerIdAdmin', () => {
    it('returns null when no workspace matches', async () => {
      const ws = await getWorkspaceByStripeCustomerIdAdmin('cus_nonexistent');
      expect(ws).toBeNull();
    });

    it('finds workspace by Stripe customer ID', async () => {
      // Update workspace with a Stripe customer ID
      await updateWorkspaceBillingAdmin(workspaceId, {
        stripeCustomerId: 'cus_test_123',
      });

      const ws = await getWorkspaceByStripeCustomerIdAdmin('cus_test_123');
      expect(ws).not.toBeNull();
      expect(ws!.id).toBe(workspaceId);
    });
  });

  describe('updateWorkspaceBillingAdmin', () => {
    it('updates stripe customer ID', async () => {
      await updateWorkspaceBillingAdmin(workspaceId, {
        stripeCustomerId: 'cus_new',
      });

      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.billing.stripeCustomerId).toBe('cus_new');
    });

    it('updates multiple billing fields at once', async () => {
      const periodEnd = new Date('2026-04-01');
      await updateWorkspaceBillingAdmin(workspaceId, {
        stripeCustomerId: 'cus_full',
        stripeSubscriptionId: 'sub_full',
        currentPeriodEnd: periodEnd,
      });

      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.billing.stripeCustomerId).toBe('cus_full');
      expect(ws!.billing.stripeSubscriptionId).toBe('sub_full');
      expect(ws!.billing.currentPeriodEnd).toBeInstanceOf(Date);
    });

    it('can set billing fields to null', async () => {
      await updateWorkspaceBillingAdmin(workspaceId, {
        stripeCustomerId: 'cus_temp',
      });
      await updateWorkspaceBillingAdmin(workspaceId, {
        stripeCustomerId: null,
      });

      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.billing.stripeCustomerId).toBeNull();
    });
  });

  describe('updateWorkspaceStatusAdmin', () => {
    it('updates workspace status', async () => {
      await updateWorkspaceStatusAdmin(workspaceId, 'past_due');
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.status).toBe('past_due');
    });

    it('cycles through all status values', async () => {
      const statuses = ['active', 'trial', 'past_due', 'canceled', 'suspended'] as const;
      for (const status of statuses) {
        await updateWorkspaceStatusAdmin(workspaceId, status);
        const ws = await getWorkspaceByIdAdmin(workspaceId);
        expect(ws!.status).toBe(status);
      }
    });
  });

  describe('incrementWorkspacePlayerCountAdmin', () => {
    it('increments player count by 1 (default)', async () => {
      await incrementWorkspacePlayerCountAdmin(workspaceId);
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.playerCount).toBe(1);
    });

    it('increments by custom delta', async () => {
      await incrementWorkspacePlayerCountAdmin(workspaceId, 3);
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.playerCount).toBe(3);
    });

    it('decrements with negative delta', async () => {
      await incrementWorkspacePlayerCountAdmin(workspaceId, 5);
      await incrementWorkspacePlayerCountAdmin(workspaceId, -2);
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.playerCount).toBe(3);
    });
  });

  describe('incrementWorkspaceGamesThisMonthAdmin', () => {
    it('increments games count', async () => {
      await incrementWorkspaceGamesThisMonthAdmin(workspaceId);
      await incrementWorkspaceGamesThisMonthAdmin(workspaceId);
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.gamesThisMonth).toBe(2);
    });
  });

  describe('updateWorkspaceStorageUsageAdmin', () => {
    it('increments storage usage', async () => {
      await updateWorkspaceStorageUsageAdmin(workspaceId, 25.5);
      const ws = await getWorkspaceByIdAdmin(workspaceId);
      expect(ws!.usage.storageUsedMB).toBe(25.5);
    });
  });
});
