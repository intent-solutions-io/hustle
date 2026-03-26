/**
 * Tests for GET/POST /api/players/[id]/journal
 *
 * Covers: auth (401), validation (400), not-found (404), happy path (200),
 * and error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession, createMockPlayer } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPlayerAdmin: vi.fn(),
  createJournalEntryAdmin: vi.fn(),
  getJournalEntriesAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/journal', () => ({
  createJournalEntryAdmin: mocks.createJournalEntryAdmin,
  getJournalEntriesAdmin: mocks.getJournalEntriesAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_JOURNAL_ENTRY = {
  date: '2025-06-15',
  content: 'Had a great practice today. Worked on passing drills.',
  context: 'workout_reflection' as const,
  moodTag: 'great' as const,
  energyTag: 'energized' as const,
};

const CREATED_ENTRY = {
  id: 'entry-001',
  playerId: 'player-123',
  ...VALID_JOURNAL_ENTRY,
  createdAt: new Date('2025-06-15'),
  updatedAt: new Date('2025-06-15'),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/journal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 for invalid query parameters', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    // limit=0 is invalid (min 1)
    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal?limit=0',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns journal entries on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getJournalEntriesAdmin.mockResolvedValue({
      entries: [CREATED_ENTRY],
      nextCursor: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].id).toBe('entry-001');
    expect(body.nextCursor).toBeNull();
  });

  it('passes context and moodTag filters to service', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getJournalEntriesAdmin.mockResolvedValue({ entries: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal?context=daily_journal&moodTag=good&limit=10',
    });
    const response = await GET(request, { params: PARAMS });

    expect(response.status).toBe(200);
    expect(mocks.getJournalEntriesAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        context: 'daily_journal',
        moodTag: 'good',
        limit: 10,
      })
    );
  });

  it('returns 500 when getJournalEntriesAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getJournalEntriesAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/journal',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch journal entries');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/journal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: VALID_JOURNAL_ENTRY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when player not found', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: VALID_JOURNAL_ENTRY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 when body fails schema validation', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: {
        // missing required: date, content, context
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid journal entry data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when context is invalid', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: {
        ...VALID_JOURNAL_ENTRY,
        context: 'invalid_context',
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid journal entry data');
  });

  it('creates journal entry and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createJournalEntryAdmin.mockResolvedValue(CREATED_ENTRY);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: VALID_JOURNAL_ENTRY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.entry.id).toBe('entry-001');
    expect(mocks.createJournalEntryAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        playerId: 'player-123',
        content: VALID_JOURNAL_ENTRY.content,
        context: 'workout_reflection',
      })
    );
  });

  it('returns 500 when createJournalEntryAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createJournalEntryAdmin.mockRejectedValue(new Error('Write failed'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/journal',
      body: VALID_JOURNAL_ENTRY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create journal entry');
  });
});
