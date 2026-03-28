import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  Auth,
  UserCredential,
} from 'firebase/auth';

/**
 * Attempts Google sign-in via popup first, falling back to redirect
 * if the popup is blocked (common on iOS Safari, in-app browsers, etc.).
 */
export async function signInWithGoogle(
  auth: Auth,
  provider: GoogleAuthProvider
): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (
      firebaseError.code === 'auth/popup-blocked' ||
      firebaseError.code === 'auth/popup-closed-by-user' ||
      firebaseError.code === 'auth/cancelled-popup-request' ||
      firebaseError.code === 'auth/internal-error'
    ) {
      await signInWithRedirect(auth, provider);
      // signInWithRedirect navigates away; this line won't execute.
      // The result is handled by checkRedirectResult on page reload.
      throw new Error('REDIRECT_STARTED');
    }
    throw error;
  }
}

/**
 * Checks if there is a pending redirect result (called on page mount).
 * Returns null if no redirect result is pending.
 */
export async function checkRedirectResult(
  auth: Auth
): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.error('Redirect result error:', error);
    return null;
  }
}
