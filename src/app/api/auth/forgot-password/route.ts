import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

// Simple console logging for reliability (Cloud Logging can hang on init)
const log = (msg: string, data?: Record<string, unknown>) => {
  console.log(`[forgot-password] ${msg}`, data ? JSON.stringify(data) : '');
};

// Timeout wrapper for Firebase Admin calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  log('Request received');

  const { email } = await request.json().catch(() => ({ email: '' }));
  log('Email parsed', { hasEmail: !!email });

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    log('Invalid email format');
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  // If email service is not configured, fail fast (doesn't leak user existence).
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasEmailFrom = !!process.env.EMAIL_FROM;
  log('Email config check', { hasResendKey, hasEmailFrom });

  if (!hasResendKey || !hasEmailFrom) {
    log('Email service not configured');
    return NextResponse.json(
      { success: false, error: 'Email service is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  // Determine the correct origin for reset URL
  // Priority: x-forwarded-host (reverse proxy) > host header > env vars > hardcoded production
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  let websiteOrigin: string;
  if (forwardedHost && !forwardedHost.includes('0.0.0.0') && !forwardedHost.includes('localhost')) {
    websiteOrigin = `${protocol}://${forwardedHost}`;
  } else if (hostHeader && !hostHeader.includes('0.0.0.0') && !hostHeader.includes('localhost')) {
    websiteOrigin = `${protocol}://${hostHeader}`;
  } else if (process.env.WEBSITE_URL) {
    websiteOrigin = process.env.WEBSITE_URL;
  } else if (process.env.NEXT_PUBLIC_WEBSITE_DOMAIN) {
    const domain = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN;
    websiteOrigin = domain.startsWith('http') ? domain : `https://${domain}`;
  } else {
    // Hardcoded fallback for production
    websiteOrigin = 'https://hustlestats.io';
  }

  log('Website origin determined', { websiteOrigin });

  try {
    log('Generating password reset link via Firebase Admin');

    // Add 15 second timeout to prevent hanging
    const firebaseLink = await withTimeout(
      adminAuth.generatePasswordResetLink(email),
      15000,
      'generatePasswordResetLink'
    );
    log('Firebase link generated successfully');

    const actionUrl = new URL(firebaseLink);
    const oobCode = actionUrl.searchParams.get('oobCode');

    const resetUrl = oobCode
      ? `${websiteOrigin}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : firebaseLink;

    log('Sending password reset email via Resend');

    const template = emailTemplates.passwordReset(email, resetUrl);

    // Add 10 second timeout for email sending
    const result = await withTimeout(
      sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
      10000,
      'sendEmail'
    );

    if (!result.success) {
      log('Failed to send email via Resend', { error: result.error });
      return NextResponse.json(
        { success: false, error: 'SEND_EMAIL_FAILED', message: result.error || 'Failed to send reset email.' },
        { status: 500 }
      );
    }

    log('Password reset email sent successfully');
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error: unknown) {
    // For security (user enumeration prevention), return success for ALL Firebase Auth errors.
    // We don't want to reveal whether an account exists or not.
    const errorCode = (error as { code?: string })?.code || '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log('Password reset caught error', {
      errorCode,
      errorMessage: errorMessage.substring(0, 200),
      isTimeout: errorMessage.includes('timed out'),
    });

    // If it's a timeout, this is a real error we should report
    if (errorMessage.includes('timed out')) {
      log('Request timed out - returning error to client');
      return NextResponse.json(
        { success: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    // Any error from generatePasswordResetLink should return success
    // to prevent user enumeration (whether user exists or not, same response)
    log('Returning success to prevent user enumeration', { errorCode });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }
}
