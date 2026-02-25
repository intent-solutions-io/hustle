/**
 * Firebase Admin Users Service Tests
 *
 * Tests for all exported functions in admin-services/users.ts.
 * Covers user document retrieval, updates, and Timestamp conversion.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
}));

// Chainable doc mock returned for any collection().doc() call
const mockDocRef = vi.hoisted(() => ({
  get: mocks.get,
  update: mocks.update,
}));

const mockCollectionRef = vi.hoisted(() => ({
  doc: vi.fn(() => mockDocRef),
}));

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => mockCollectionRef),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getUserProfileAdmin, updateUserProfileAdmin } from './users';
import { adminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const UID = 'user-test-123';

function makeTimestamp(date: Date) {
  return { toDate: () => date };
}

function makeUserDoc(overrides: Record<string, unknown> = {}) {
  const now = new Date('2025-04-01T00:00:00.000Z');
  return {
    defaultWorkspaceId: 'workspace-123',
    ownedWorkspaces: ['workspace-123'],
    firstName: 'Jamie',
    lastName: 'Rivera',
    email: 'jamie@example.com',
    phone: '555-0100',
    emailVerified: true,
    agreedToTerms: true,
    agreedToPrivacy: true,
    isParentGuardian: true,
    verificationPinHash: null,
    termsAgreedAt: makeTimestamp(now),
    privacyAgreedAt: makeTimestamp(now),
    createdAt: makeTimestamp(now),
    updatedAt: makeTimestamp(now),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getUserProfileAdmin
// ---------------------------------------------------------------------------

describe('getUserProfileAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('returns null when user document does not exist', async () => {
    mocks.get.mockResolvedValue({ exists: false });

    const result = await getUserProfileAdmin(UID);

    expect(result).toBeNull();
  });

  it('returns a User object with the correct id when document exists', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc(),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user).not.toBeNull();
    expect(user!.id).toBe(UID);
    expect(user!.firstName).toBe('Jamie');
    expect(user!.lastName).toBe('Rivera');
    expect(user!.email).toBe('jamie@example.com');
  });

  it('converts Timestamp createdAt and updatedAt to Date', async () => {
    const createdAt = new Date('2025-01-15T12:00:00Z');
    const updatedAt = new Date('2025-06-15T12:00:00Z');
    mocks.get.mockResolvedValue({
      exists: true,
      data: () =>
        makeUserDoc({
          createdAt: makeTimestamp(createdAt),
          updatedAt: makeTimestamp(updatedAt),
        }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.createdAt).toBeInstanceOf(Date);
    expect(user!.createdAt.getFullYear()).toBe(2025);
    expect(user!.updatedAt).toBeInstanceOf(Date);
    expect(user!.updatedAt.getMonth()).toBe(5); // June
  });

  it('accepts Date objects for createdAt and updatedAt directly', async () => {
    const createdAt = new Date('2025-02-01');
    const updatedAt = new Date('2025-07-20');
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ createdAt, updatedAt }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.createdAt).toBeInstanceOf(Date);
    expect(user!.updatedAt).toBeInstanceOf(Date);
  });

  it('converts Timestamp termsAgreedAt and privacyAgreedAt to Date', async () => {
    const termsAt = new Date('2025-01-10');
    const privacyAt = new Date('2025-01-10');
    mocks.get.mockResolvedValue({
      exists: true,
      data: () =>
        makeUserDoc({
          termsAgreedAt: makeTimestamp(termsAt),
          privacyAgreedAt: makeTimestamp(privacyAt),
        }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.termsAgreedAt).toBeInstanceOf(Date);
    expect(user!.privacyAgreedAt).toBeInstanceOf(Date);
  });

  it('returns null for termsAgreedAt and privacyAgreedAt when absent', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ termsAgreedAt: null, privacyAgreedAt: null }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.termsAgreedAt).toBeNull();
    expect(user!.privacyAgreedAt).toBeNull();
  });

  it('defaults defaultWorkspaceId to null when absent', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ defaultWorkspaceId: undefined }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.defaultWorkspaceId).toBeNull();
  });

  it('defaults ownedWorkspaces to empty array when absent', async () => {
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ ownedWorkspaces: undefined }),
    });

    const user = await getUserProfileAdmin(UID);

    expect(user!.ownedWorkspaces).toEqual([]);
  });

  it('queries the users collection with the correct UID', async () => {
    mocks.get.mockResolvedValue({ exists: false });
    const spy = vi.spyOn(adminDb, 'collection');

    await getUserProfileAdmin(UID);

    expect(spy).toHaveBeenCalledWith('users');
    expect(mockCollectionRef.doc).toHaveBeenCalledWith(UID);
  });

  it('throws a wrapped error when Firestore fails', async () => {
    mocks.get.mockRejectedValue(new Error('unavailable'));

    await expect(getUserProfileAdmin(UID)).rejects.toThrow(
      'Failed to fetch user profile: unavailable'
    );
  });
});

// ---------------------------------------------------------------------------
// updateUserProfileAdmin
// ---------------------------------------------------------------------------

describe('updateUserProfileAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionRef.doc.mockReturnValue(mockDocRef);
  });

  it('calls Firestore update() with the provided fields plus updatedAt', async () => {
    // First call is update(), second call is the re-fetch get()
    mocks.update.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ firstName: 'Updated' }),
    });

    await updateUserProfileAdmin(UID, { firstName: 'Updated' });

    expect(mocks.update).toHaveBeenCalledOnce();
    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.firstName).toBe('Updated');
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });

  it('returns the updated User object after writing', async () => {
    mocks.update.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ firstName: 'NewName', verificationPinHash: 'hash123' }),
    });

    const user = await updateUserProfileAdmin(UID, {
      firstName: 'NewName',
      verificationPinHash: 'hash123',
    });

    expect(user.id).toBe(UID);
    expect(user.firstName).toBe('NewName');
    expect(user.verificationPinHash).toBe('hash123');
  });

  it('re-fetches the document after updating', async () => {
    mocks.update.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc(),
    });

    await updateUserProfileAdmin(UID, { phone: '555-9999' });

    // get() is called once (the re-fetch after update)
    expect(mocks.get).toHaveBeenCalledOnce();
  });

  it('supports updating the verificationPinHash field', async () => {
    mocks.update.mockResolvedValue(undefined);
    mocks.get.mockResolvedValue({
      exists: true,
      data: () => makeUserDoc({ verificationPinHash: 'bcrypt-hash' }),
    });

    await updateUserProfileAdmin(UID, { verificationPinHash: 'bcrypt-hash' });

    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.verificationPinHash).toBe('bcrypt-hash');
  });

  it('throws a wrapped error when Firestore update() fails', async () => {
    mocks.update.mockRejectedValue(new Error('write failed'));

    await expect(updateUserProfileAdmin(UID, { firstName: 'X' })).rejects.toThrow(
      'Failed to update user profile: write failed'
    );
  });

  it('throws a wrapped error when the re-fetch get() fails', async () => {
    mocks.update.mockResolvedValue(undefined);
    mocks.get.mockRejectedValue(new Error('read failed'));

    await expect(updateUserProfileAdmin(UID, { firstName: 'Y' })).rejects.toThrow(
      'Failed to update user profile: read failed'
    );
  });
});
