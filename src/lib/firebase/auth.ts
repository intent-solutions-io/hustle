import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from './admin';

const COOKIE_NAME = '__session';

// Get current user from session cookie (server-side only)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const decodedClaims = await getAdminAuth().verifySessionCookie(
      sessionCookie.value,
      true // Check if revoked
    );

    return decodedClaims;
  } catch {
    return null;
  }
}

// Get user with Firestore profile data
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const profileDoc = await getAdminDb().collection('users').doc(user.uid).get();

  return {
    ...user,
    profile: profileDoc.exists ? profileDoc.data() : null,
  };
}

// Require auth or throw — use in server components / API routes
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
