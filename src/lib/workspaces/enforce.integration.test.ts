/**
 * Integration Tests: Workspace Access Control
 *
 * Tests checkWorkspaceAccess() against real Firestore Emulator data.
 * Validates that subscription status rules are enforced correctly for
 * every workspace lifecycle state, including the read-only grace period
 * for past_due workspaces.
 *
 * No mocks — Firestore Emulator provides real document reads.
 *
 * Access rules under test (from ACCESS_RULES in access-control.ts):
 *   active    → read=true,  write=true
 *   trial     → read=true,  write=true
 *   past_due  → read=true,  write=false  (grace period)
 *   canceled  → read=false, write=false
 *   suspended → read=false, write=false
 *   deleted   → read=false, write=false
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearEmulators,
  seedUserProfile,
  seedWorkspace,
} from '@/test-utils/integration';
import { checkWorkspaceAccess } from '@/lib/firebase/access-control';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_USER_ID = 'test-user-access-control';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('checkWorkspaceAccess() (Integration)', () => {
  beforeEach(async () => {
    await clearEmulators();
    await seedUserProfile(TEST_USER_ID);
  });

  // -------------------------------------------------------------------------
  // Workspace does not exist
  // -------------------------------------------------------------------------

  it('returns allowed=false with WORKSPACE_NOT_FOUND for a non-existent workspace', async () => {
    const result = await checkWorkspaceAccess('workspace-ghost-999', false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_NOT_FOUND');
    expect(result.workspaceId).toBe('workspace-ghost-999');
  });

  // -------------------------------------------------------------------------
  // Active workspace — full access
  // -------------------------------------------------------------------------

  it('allows read for an active workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'active' });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('active');
    expect(result.workspaceId).toBe(workspaceId);
  });

  it('allows write for an active workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'active' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('active');
  });

  // -------------------------------------------------------------------------
  // Trial workspace — full access during free trial
  // -------------------------------------------------------------------------

  it('allows read for a trial workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'trial' });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('trial');
  });

  it('allows write for a trial workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'trial' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('trial');
  });

  // -------------------------------------------------------------------------
  // Past-due workspace — read-only grace period
  // -------------------------------------------------------------------------

  it('allows read for a past_due workspace (grace period)', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'past_due' });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(true);
    expect(result.status).toBe('past_due');
  });

  it('blocks write for a past_due workspace and returns PAYMENT_PAST_DUE reason', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'past_due' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('PAYMENT_PAST_DUE');
    expect(result.status).toBe('past_due');
    expect(result.workspaceId).toBe(workspaceId);
  });

  // -------------------------------------------------------------------------
  // Canceled workspace — no access
  // -------------------------------------------------------------------------

  it('blocks read for a canceled workspace and returns SUBSCRIPTION_CANCELED reason', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'canceled' });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SUBSCRIPTION_CANCELED');
    expect(result.status).toBe('canceled');
  });

  it('blocks write for a canceled workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'canceled' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SUBSCRIPTION_CANCELED');
  });

  // -------------------------------------------------------------------------
  // Suspended workspace — no access
  // -------------------------------------------------------------------------

  it('blocks read for a suspended workspace and returns ACCOUNT_SUSPENDED reason', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'suspended' });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCOUNT_SUSPENDED');
    expect(result.status).toBe('suspended');
  });

  it('blocks write for a suspended workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'suspended' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ACCOUNT_SUSPENDED');
  });

  // -------------------------------------------------------------------------
  // Deleted workspace — no access
  // -------------------------------------------------------------------------

  it('blocks read for a deleted workspace and returns WORKSPACE_DELETED reason', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, {
      status: 'deleted',
      deletedAt: new Date(),
    });

    const result = await checkWorkspaceAccess(workspaceId, false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_DELETED');
    expect(result.status).toBe('deleted');
  });

  it('blocks write for a deleted workspace', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, {
      status: 'deleted',
      deletedAt: new Date(),
    });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('WORKSPACE_DELETED');
  });

  // -------------------------------------------------------------------------
  // Result shape — workspaceId is echoed on denial
  // -------------------------------------------------------------------------

  it('includes workspaceId in the result for denied access', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'suspended' });

    const result = await checkWorkspaceAccess(workspaceId, true);

    expect(result.workspaceId).toBe(workspaceId);
  });

  // -------------------------------------------------------------------------
  // Default parameter — isWriteOperation defaults to true (write is stricter)
  // -------------------------------------------------------------------------

  it('defaults isWriteOperation to true, blocking writes for past_due when called without the flag', async () => {
    const workspaceId = await seedWorkspace(TEST_USER_ID, { status: 'past_due' });

    // Omit the isWriteOperation argument — should default to write check
    const result = await checkWorkspaceAccess(workspaceId);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('PAYMENT_PAST_DUE');
  });
});
