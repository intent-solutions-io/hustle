/**
 * Tests for GET/POST /api/players/[id]/assessments
 *
 * Covers: auth (401), validation (400), not-found (404), happy path (200),
 * value constraints, and error handling (500)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequest, createMockSession, createMockPlayer } from '@/test-utils';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getPlayerAdmin: vi.fn(),
  createAssessmentAdmin: vi.fn(),
  getAssessmentsAdmin: vi.fn(),
  getAssessmentSummaryAdmin: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/firebase/admin-services/players', () => ({
  getPlayerAdmin: mocks.getPlayerAdmin,
}));

vi.mock('@/lib/firebase/admin-services/assessments', () => ({
  createAssessmentAdmin: mocks.createAssessmentAdmin,
  getAssessmentsAdmin: mocks.getAssessmentsAdmin,
  getAssessmentSummaryAdmin: mocks.getAssessmentSummaryAdmin,
}));

// ---------------------------------------------------------------------------
// Import under test (AFTER mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from './route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PARAMS = Promise.resolve({ id: 'player-123' });

const VALID_ASSESSMENT_BODY = {
  date: '2025-06-15',
  testType: 'vertical_jump' as const,
  value: 18,         // inches — valid range 6–40
  unit: 'inches' as const,
  notes: 'Good form',
};

const CREATED_ASSESSMENT = {
  id: 'assess-001',
  playerId: 'player-123',
  ...VALID_ASSESSMENT_BODY,
  createdAt: new Date('2025-06-15'),
};

// ---------------------------------------------------------------------------
// GET tests
// ---------------------------------------------------------------------------

describe('GET /api/players/[id]/assessments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments',
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
      url: 'http://localhost:3000/api/players/player-123/assessments',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Player not found');
  });

  it('returns 400 for invalid testType parameter', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments?testType=unknown_test',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid test type parameter');
  });

  it('returns assessments on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getAssessmentsAdmin.mockResolvedValue({
      assessments: [CREATED_ASSESSMENT],
      nextCursor: null,
    });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.assessments).toHaveLength(1);
    expect(body.assessments[0].id).toBe('assess-001');
    expect(body.summary).toBeNull();
    expect(body.metadata).toBeUndefined();
  });

  it('includes summary when includeSummary=true', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getAssessmentsAdmin.mockResolvedValue({ assessments: [], nextCursor: null });
    mocks.getAssessmentSummaryAdmin.mockResolvedValue({ bestVerticalJump: 22 });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments?includeSummary=true',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({ bestVerticalJump: 22 });
    expect(mocks.getAssessmentSummaryAdmin).toHaveBeenCalledWith('user-123', 'player-123');
  });

  it('includes metadata when includeMetadata=true', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getAssessmentsAdmin.mockResolvedValue({ assessments: [], nextCursor: null });

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments?includeMetadata=true',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.metadata).toBeDefined();
    expect(body.metadata.vertical_jump).toBeDefined();
  });

  it('returns 500 when getAssessmentsAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.getAssessmentsAdmin.mockRejectedValue(new Error('Firestore error'));

    const request = createMockRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/players/player-123/assessments',
    });
    const response = await GET(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch assessments');
  });
});

// ---------------------------------------------------------------------------
// POST tests
// ---------------------------------------------------------------------------

describe('POST /api/players/[id]/assessments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mocks.auth.mockResolvedValue(null);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: VALID_ASSESSMENT_BODY,
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
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: VALID_ASSESSMENT_BODY,
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
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: {
        // missing testType, value, unit, date
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid assessment data');
    expect(body.details).toBeDefined();
  });

  it('returns 400 when value is below test type minimum', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: {
        ...VALID_ASSESSMENT_BODY,
        testType: 'vertical_jump',
        value: 2, // below minimum of 6 inches
        unit: 'inches',
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    // validateAssessmentValue rejects values outside min/max range
    expect(body.error).toContain('Vertical Jump');
  });

  it('returns 400 when value exceeds test type maximum', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: {
        ...VALID_ASSESSMENT_BODY,
        testType: 'vertical_jump',
        value: 50, // above maximum of 40 inches
        unit: 'inches',
      },
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Vertical Jump');
  });

  it('creates assessment and returns it on success', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createAssessmentAdmin.mockResolvedValue(CREATED_ASSESSMENT);

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: VALID_ASSESSMENT_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.assessment.id).toBe('assess-001');
    expect(mocks.createAssessmentAdmin).toHaveBeenCalledWith(
      'user-123',
      'player-123',
      expect.objectContaining({
        playerId: 'player-123',
        testType: 'vertical_jump',
        value: 18,
      })
    );
  });

  it('returns 500 when createAssessmentAdmin throws', async () => {
    mocks.auth.mockResolvedValue(createMockSession());
    mocks.getPlayerAdmin.mockResolvedValue(createMockPlayer());
    mocks.createAssessmentAdmin.mockRejectedValue(new Error('Write failed'));

    const request = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/players/player-123/assessments',
      body: VALID_ASSESSMENT_BODY,
    });
    const response = await POST(request, { params: PARAMS });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to create assessment');
  });
});
