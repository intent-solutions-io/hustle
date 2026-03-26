/**
 * Firebase Admin Players Service Tests
 *
 * Tests for all exported functions in admin-services/players.ts.
 * Covers CRUD operations, timestamp conversion, and error propagation.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock state
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  add: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Firestore collection mock — supports both flat and nested paths
// ---------------------------------------------------------------------------

const mockDocRef = vi.hoisted(() => vi.fn());
const mockCollection = vi.hoisted(() => vi.fn());

vi.mock('@/lib/firebase/admin', () => {
  const docRefFactory = () => ({
    get: mocks.get,
    set: mocks.set,
    update: mocks.update,
    delete: mocks.delete,
  });

  const collectionFactory = (path: string) => ({
    doc: vi.fn(() => docRefFactory()),
    add: mocks.add,
    orderBy: vi.fn(() => ({
      get: mocks.getDocs,
    })),
    get: mocks.getDocs,
  });

  return {
    adminDb: { collection: collectionFactory },
    Timestamp: {
      fromDate: (d: Date) => ({ toDate: () => d }),
    },
  };
});

// firebase-admin/firestore Timestamp (imported directly in source)
vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d }),
  },
  FieldValue: {
    increment: (n: number) => ({ _increment: n }),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getPlayersAdmin,
  getPlayerAdmin,
  getPlayersCountAdmin,
  createPlayerAdmin,
  updatePlayerAdmin,
  deletePlayerAdmin,
} from './players';
import { adminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const USER_ID = 'user-abc';
const PLAYER_ID = 'player-xyz';

function makeTimestamp(date: Date) {
  return { toDate: () => date };
}

function makePlayerDoc(overrides: Record<string, unknown> = {}) {
  const now = new Date('2025-01-15T00:00:00.000Z');
  return {
    workspaceId: 'workspace-123',
    name: 'Alex Smith',
    birthday: makeTimestamp(new Date('2012-06-15')),
    gender: 'male',
    primaryPosition: 'CM',
    position: 'CM',
    secondaryPositions: ['DM'],
    leagueCode: 'REC',
    teamClub: 'Test FC',
    photoUrl: null,
    leagueOtherName: null,
    positionNote: null,
    createdAt: makeTimestamp(now),
    updatedAt: makeTimestamp(now),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getPlayersAdmin
// ---------------------------------------------------------------------------

describe('getPlayersAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array when the collection has no documents', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [], size: 0 });

    const result = await getPlayersAdmin(USER_ID);

    expect(result).toEqual([]);
  });

  it('maps Firestore documents to Player objects with converted timestamps', async () => {
    const birthday = new Date('2012-06-15');
    const now = new Date('2025-01-15');
    const doc = {
      id: PLAYER_ID,
      data: () => makePlayerDoc({
        birthday: makeTimestamp(birthday),
        createdAt: makeTimestamp(now),
        updatedAt: makeTimestamp(now),
      }),
    };

    mocks.getDocs.mockResolvedValue({ docs: [doc], size: 1 });

    const [player] = await getPlayersAdmin(USER_ID);

    expect(player.id).toBe(PLAYER_ID);
    expect(player.name).toBe('Alex Smith');
    expect(player.birthday).toBeInstanceOf(Date);
    expect(player.birthday.getFullYear()).toBe(2012);
    expect(player.primaryPosition).toBe('CM');
  });

  it('converts null optional fields to undefined', async () => {
    const doc = {
      id: PLAYER_ID,
      data: () => makePlayerDoc({ photoUrl: null, leagueOtherName: null, positionNote: null }),
    };

    mocks.getDocs.mockResolvedValue({ docs: [doc], size: 1 });

    const [player] = await getPlayersAdmin(USER_ID);

    expect(player.photoUrl).toBeUndefined();
    expect(player.leagueOtherName).toBeUndefined();
    expect(player.positionNote).toBeUndefined();
  });

  it('queries the correct Firestore collection path', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [], size: 0 });

    const spy = vi.spyOn(adminDb, 'collection');

    await getPlayersAdmin(USER_ID);

    expect(spy).toHaveBeenCalledWith(`users/${USER_ID}/players`);
  });

  it('throws a wrapped error when Firestore fails', async () => {
    mocks.getDocs.mockRejectedValue(new Error('network timeout'));

    await expect(getPlayersAdmin(USER_ID)).rejects.toThrow('Failed to fetch players: network timeout');
  });
});

// ---------------------------------------------------------------------------
// getPlayerAdmin
// ---------------------------------------------------------------------------

describe('getPlayerAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when document does not exist', async () => {
    mocks.get.mockResolvedValue({ exists: false });

    const result = await getPlayerAdmin(USER_ID, PLAYER_ID);

    expect(result).toBeNull();
  });

  it('returns a Player when document exists', async () => {
    const birthday = new Date('2012-06-15');
    mocks.get.mockResolvedValue({
      exists: true,
      id: PLAYER_ID,
      data: () => makePlayerDoc({ birthday: makeTimestamp(birthday) }),
    });

    const player = await getPlayerAdmin(USER_ID, PLAYER_ID);

    expect(player).not.toBeNull();
    expect(player!.id).toBe(PLAYER_ID);
    expect(player!.name).toBe('Alex Smith');
  });

  it('converts Firestore Timestamp birthday to Date', async () => {
    const birthday = new Date('2013-03-20');
    mocks.get.mockResolvedValue({
      exists: true,
      id: PLAYER_ID,
      data: () => makePlayerDoc({ birthday: makeTimestamp(birthday) }),
    });

    const player = await getPlayerAdmin(USER_ID, PLAYER_ID);

    expect(player!.birthday).toBeInstanceOf(Date);
    expect(player!.birthday.getMonth()).toBe(2); // March = 2
  });

  it('handles Date objects directly (no toDate call needed)', async () => {
    const birthday = new Date('2011-11-01');
    mocks.get.mockResolvedValue({
      exists: true,
      id: PLAYER_ID,
      data: () => makePlayerDoc({ birthday }),
    });

    const player = await getPlayerAdmin(USER_ID, PLAYER_ID);

    expect(player!.birthday).toBeInstanceOf(Date);
    expect(player!.birthday.getFullYear()).toBe(2011);
  });

  it('throws a wrapped error when Firestore fails', async () => {
    mocks.get.mockRejectedValue(new Error('permission denied'));

    await expect(getPlayerAdmin(USER_ID, PLAYER_ID)).rejects.toThrow(
      'Failed to fetch player: permission denied'
    );
  });
});

// ---------------------------------------------------------------------------
// getPlayersCountAdmin
// ---------------------------------------------------------------------------

describe('getPlayersCountAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 for an empty collection', async () => {
    mocks.getDocs.mockResolvedValue({ docs: [], size: 0 });

    const count = await getPlayersCountAdmin(USER_ID);

    expect(count).toBe(0);
  });

  it('returns the snapshot size', async () => {
    mocks.getDocs.mockResolvedValue({ docs: new Array(3).fill({}), size: 3 });

    const count = await getPlayersCountAdmin(USER_ID);

    expect(count).toBe(3);
  });

  it('throws a wrapped error when Firestore fails', async () => {
    mocks.getDocs.mockRejectedValue(new Error('unavailable'));

    await expect(getPlayersCountAdmin(USER_ID)).rejects.toThrow('Failed to count players: unavailable');
  });
});

// ---------------------------------------------------------------------------
// createPlayerAdmin
// ---------------------------------------------------------------------------

describe('createPlayerAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const playerInput = {
    workspaceId: 'workspace-123',
    name: 'Jordan Lee',
    birthday: new Date('2013-07-04'),
    gender: 'female' as const,
    primaryPosition: 'ST' as const,
    secondaryPositions: ['CF'] as const,
    leagueCode: 'TRAVEL' as const,
    teamClub: 'Star FC',
    photoUrl: null,
  };

  it('returns a Player with the generated document ID', async () => {
    mocks.add.mockResolvedValue({ id: 'new-player-id' });

    const player = await createPlayerAdmin(USER_ID, playerInput);

    expect(player.id).toBe('new-player-id');
    expect(player.name).toBe('Jordan Lee');
    expect(player.workspaceId).toBe('workspace-123');
  });

  it('calls Firestore add() with correctly structured document', async () => {
    mocks.add.mockResolvedValue({ id: 'new-player-id' });

    await createPlayerAdmin(USER_ID, playerInput);

    expect(mocks.add).toHaveBeenCalledOnce();
    const addedDoc = mocks.add.mock.calls[0][0];
    expect(addedDoc.name).toBe('Jordan Lee');
    expect(addedDoc.gender).toBe('female');
    expect(addedDoc.primaryPosition).toBe('ST');
    expect(addedDoc.position).toBe('ST'); // legacy field
    expect(addedDoc.secondaryPositions).toEqual(['CF']);
    expect(addedDoc.photoUrl).toBeNull();
  });

  it('omits positionNote and leagueOtherName when falsy', async () => {
    mocks.add.mockResolvedValue({ id: 'p1' });

    await createPlayerAdmin(USER_ID, { ...playerInput, positionNote: null, leagueOtherName: null });

    const addedDoc = mocks.add.mock.calls[0][0];
    expect(addedDoc).not.toHaveProperty('positionNote');
    expect(addedDoc).not.toHaveProperty('leagueOtherName');
  });

  it('includes positionNote and leagueOtherName when provided', async () => {
    mocks.add.mockResolvedValue({ id: 'p2' });

    await createPlayerAdmin(USER_ID, {
      ...playerInput,
      positionNote: 'Prefers left side',
      leagueOtherName: 'Regional Cup',
    });

    const addedDoc = mocks.add.mock.calls[0][0];
    expect(addedDoc.positionNote).toBe('Prefers left side');
    expect(addedDoc.leagueOtherName).toBe('Regional Cup');
  });

  it('returns undefined photoUrl when photoUrl is null', async () => {
    mocks.add.mockResolvedValue({ id: 'p3' });

    const player = await createPlayerAdmin(USER_ID, { ...playerInput, photoUrl: null });

    expect(player.photoUrl).toBeUndefined();
  });

  it('preserves photoUrl string when provided', async () => {
    mocks.add.mockResolvedValue({ id: 'p4' });

    const player = await createPlayerAdmin(USER_ID, {
      ...playerInput,
      photoUrl: 'https://cdn.example.com/photo.jpg',
    });

    expect(player.photoUrl).toBe('https://cdn.example.com/photo.jpg');
  });

  it('throws a wrapped error when Firestore add() fails', async () => {
    mocks.add.mockRejectedValue(new Error('quota exceeded'));

    await expect(createPlayerAdmin(USER_ID, playerInput)).rejects.toThrow(
      'Failed to create player: quota exceeded'
    );
  });
});

// ---------------------------------------------------------------------------
// updatePlayerAdmin
// ---------------------------------------------------------------------------

describe('updatePlayerAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Firestore update() with the provided fields plus updatedAt', async () => {
    mocks.update.mockResolvedValue(undefined);

    await updatePlayerAdmin(USER_ID, PLAYER_ID, { name: 'New Name', teamClub: 'New FC' });

    expect(mocks.update).toHaveBeenCalledOnce();
    const updateArg = mocks.update.mock.calls[0][0];
    expect(updateArg.name).toBe('New Name');
    expect(updateArg.teamClub).toBe('New FC');
    expect(updateArg.updatedAt).toBeInstanceOf(Date);
  });

  it('resolves with void on success', async () => {
    mocks.update.mockResolvedValue(undefined);

    await expect(updatePlayerAdmin(USER_ID, PLAYER_ID, { name: 'X' })).resolves.toBeUndefined();
  });

  it('throws a wrapped error when Firestore update() fails', async () => {
    mocks.update.mockRejectedValue(new Error('not found'));

    await expect(updatePlayerAdmin(USER_ID, PLAYER_ID, { name: 'Y' })).rejects.toThrow(
      'Failed to update player: not found'
    );
  });
});

// ---------------------------------------------------------------------------
// deletePlayerAdmin
// ---------------------------------------------------------------------------

describe('deletePlayerAdmin()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls Firestore delete() on the correct document', async () => {
    mocks.delete.mockResolvedValue(undefined);

    await deletePlayerAdmin(USER_ID, PLAYER_ID);

    expect(mocks.delete).toHaveBeenCalledOnce();
  });

  it('resolves with void on success', async () => {
    mocks.delete.mockResolvedValue(undefined);

    await expect(deletePlayerAdmin(USER_ID, PLAYER_ID)).resolves.toBeUndefined();
  });

  it('throws a wrapped error when Firestore delete() fails', async () => {
    mocks.delete.mockRejectedValue(new Error('permission denied'));

    await expect(deletePlayerAdmin(USER_ID, PLAYER_ID)).rejects.toThrow(
      'Failed to delete player: permission denied'
    );
  });
});
