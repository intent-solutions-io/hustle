import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase Admin before importing auth module
vi.mock('./firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: vi.fn(),
  },
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock e2e module
vi.mock('@/lib/e2e', () => ({
  isE2ETestMode: vi.fn(() => false),
}));

import { auth, authWithProfile, requireAuth } from './auth';
import type { Session, DashboardUser } from './auth';
import { adminAuth, adminDb } from './firebase/admin';
import { cookies } from 'next/headers';
import { isE2ETestMode } from '@/lib/e2e';

describe('auth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no session cookie exists', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
    } as any);

    const session = await auth();
    expect(session).toBeNull();
  });

  it('returns session when valid cookie exists', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-session-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    } as any);

    const session = await auth();
    expect(session).toEqual({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
      },
    } satisfies Session);
  });

  it('returns null when cookie verification fails', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'expired-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockRejectedValue(
      new Error('Session cookie has expired')
    );

    const session = await auth();
    expect(session).toBeNull();
  });
});

describe('authWithProfile()', () => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({ get: mockGet }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminDb.collection).mockImplementation(mockCollection as any);
  });

  it('returns null when no session cookie', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
    } as any);

    const user = await authWithProfile();
    expect(user).toBeNull();
  });

  it('returns user with profile data', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    } as any);

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: 'John', lastName: 'Doe' }),
    });

    const user = await authWithProfile();
    expect(user).toEqual({
      uid: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
    } satisfies DashboardUser);
  });

  it('returns null when Firestore user doc missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    } as any);

    mockGet.mockResolvedValue({ exists: false });

    const user = await authWithProfile();
    expect(user).toBeNull();
  });

  it('bypasses email verification in E2E mode', async () => {
    vi.mocked(isE2ETestMode).mockReturnValue(true);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: false,
    } as any);

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: 'Test', lastName: 'User' }),
    });

    const user = await authWithProfile();
    expect(user?.emailVerified).toBe(true);
  });
});

describe('requireAuth()', () => {
  const mockGet = vi.fn();
  const mockDoc = vi.fn(() => ({ get: mockGet }));
  const mockCollection = vi.fn(() => ({ doc: mockDoc }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminDb.collection).mockImplementation(mockCollection as any);
    vi.mocked(isE2ETestMode).mockReturnValue(false);
  });

  it('throws when not authenticated', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => undefined),
    } as any);

    await expect(requireAuth()).rejects.toThrow('Unauthorized: No valid Firebase session');
  });

  it('throws when email not verified', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: false,
    } as any);

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: 'John', lastName: 'Doe' }),
    });

    await expect(requireAuth()).rejects.toThrow('Unauthorized: Email not verified');
  });

  it('returns user when authenticated and verified', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(() => ({ value: 'valid-cookie' })),
    } as any);

    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    } as any);

    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ firstName: 'John', lastName: 'Doe' }),
    });

    const user = await requireAuth();
    expect(user.uid).toBe('user-123');
    expect(user.emailVerified).toBe(true);
  });
});
