/**
 * Firebase Auth Error Code to User-Friendly Message Mapping
 *
 * Centralizes error message handling for all auth pages.
 */

export interface AuthErrorResult {
  message: string;
  action?: 'verify-email' | 'reset-password' | 'contact-support' | 'retry';
}

/**
 * Map Firebase Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): AuthErrorResult {
  const errorCode = (error as { code?: string })?.code || '';
  const errorMessage = (error as { message?: string })?.message || '';

  // Invalid credentials (covers wrong password, user not found in newer Firebase)
  if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
    return {
      message: 'Incorrect email or password. Please check your credentials and try again.',
      action: 'reset-password',
    };
  }

  // User not found
  if (errorCode === 'auth/user-not-found') {
    return {
      message: 'No account found with this email address. Please check your email or create a new account.',
    };
  }

  // Email already in use
  if (errorCode === 'auth/email-already-in-use') {
    return {
      message: 'An account with this email already exists. Try signing in or reset your password.',
      action: 'reset-password',
    };
  }

  // Weak password
  if (errorCode === 'auth/weak-password') {
    return {
      message: 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
    };
  }

  // Invalid email format
  if (errorCode === 'auth/invalid-email') {
    return {
      message: 'Please enter a valid email address.',
    };
  }

  // Too many requests (rate limiting)
  if (errorCode === 'auth/too-many-requests') {
    return {
      message: 'Too many attempts. Please wait a few minutes before trying again.',
      action: 'retry',
    };
  }

  // Network error
  if (errorCode === 'auth/network-request-failed') {
    return {
      message: 'Unable to connect. Please check your internet connection and try again.',
      action: 'retry',
    };
  }

  // User disabled
  if (errorCode === 'auth/user-disabled') {
    return {
      message: 'This account has been disabled. Please contact support for assistance.',
      action: 'contact-support',
    };
  }

  // Operation not allowed (e.g., email/password sign-in disabled)
  if (errorCode === 'auth/operation-not-allowed') {
    return {
      message: 'This sign-in method is not available. Please contact support.',
      action: 'contact-support',
    };
  }

  // Expired action code (password reset, email verification)
  if (errorCode === 'auth/expired-action-code') {
    return {
      message: 'This link has expired. Please request a new one.',
    };
  }

  // Invalid action code
  if (errorCode === 'auth/invalid-action-code') {
    return {
      message: 'This link is invalid or has already been used. Please request a new one.',
    };
  }

  // Requires recent login (for sensitive operations)
  if (errorCode === 'auth/requires-recent-login') {
    return {
      message: 'For security, please sign out and sign back in to complete this action.',
    };
  }

  // API key issues (configuration error)
  if (errorCode === 'auth/invalid-api-key' || errorCode === 'auth/api-key-not-valid') {
    console.error('[AuthError] CRITICAL: Invalid Firebase API key configuration');
    return {
      message: 'A configuration error occurred. Please contact support.',
      action: 'contact-support',
    };
  }

  // Email not verified (custom handling)
  if (errorMessage.includes('verify your email') || errorMessage.includes('email not verified')) {
    return {
      message: 'Please verify your email address before signing in. Check your inbox for a verification link.',
      action: 'verify-email',
    };
  }

  // Timeout errors
  if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
    return {
      message: 'The request took too long. Please check your connection and try again.',
      action: 'retry',
    };
  }

  // Generic error with message
  if (errorMessage && !errorMessage.includes('Firebase')) {
    return { message: errorMessage };
  }

  // Fallback
  return {
    message: 'Something went wrong. Please try again.',
    action: 'retry',
  };
}

/**
 * Get action link text for error actions
 */
export function getActionLink(action: AuthErrorResult['action']): { text: string; href: string } | null {
  switch (action) {
    case 'verify-email':
      return { text: 'Resend verification email', href: '/resend-verification' };
    case 'reset-password':
      return { text: 'Reset your password', href: '/forgot-password' };
    case 'contact-support':
      return { text: 'Contact support', href: 'mailto:support@hustlestats.io' };
    default:
      return null;
  }
}
