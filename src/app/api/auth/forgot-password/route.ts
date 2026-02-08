import { NextRequest, NextResponse } from 'next/server';

// Simple console logging for reliability
const log = (msg: string, data?: Record<string, unknown>) => {
  console.log(`[forgot-password] ${msg}`, data ? JSON.stringify(data) : '');
};

// Timeout wrapper for async operations
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
  const startTime = Date.now();
  log('Request received', { timestamp: new Date().toISOString() });

  try {
    const { email } = await request.json().catch(() => ({ email: '' }));
    log('Email parsed', { hasEmail: !!email, elapsed: Date.now() - startTime });

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      log('Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // If email service is not configured, fail fast
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const hasEmailFrom = !!process.env.EMAIL_FROM;
    log('Email config check', { hasResendKey, hasEmailFrom, elapsed: Date.now() - startTime });

    if (!hasResendKey || !hasEmailFrom) {
      log('Email service not configured');
      return NextResponse.json(
        { success: false, error: 'Email service is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Determine the correct origin for reset URL
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
      websiteOrigin = 'https://hustlestats.io';
    }

    log('Website origin determined', { websiteOrigin, elapsed: Date.now() - startTime });

    // Dynamic import to avoid module-level hanging
    log('Loading Firebase Admin module...');
    const { adminAuth } = await withTimeout(
      import('@/lib/firebase/admin'),
      10000,
      'import firebase/admin'
    );
    log('Firebase Admin module loaded', { elapsed: Date.now() - startTime });

    log('Generating password reset link...');
    const firebaseLink = await withTimeout(
      adminAuth.generatePasswordResetLink(email),
      15000,
      'generatePasswordResetLink'
    );
    log('Firebase link generated', { elapsed: Date.now() - startTime });

    const actionUrl = new URL(firebaseLink);
    const oobCode = actionUrl.searchParams.get('oobCode');

    const resetUrl = oobCode
      ? `${websiteOrigin}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : firebaseLink;

    log('Loading email modules...');
    const [{ sendEmail }, { emailTemplates }] = await Promise.all([
      withTimeout(import('@/lib/email'), 5000, 'import email'),
      withTimeout(import('@/lib/email-templates'), 5000, 'import email-templates'),
    ]);
    log('Email modules loaded', { elapsed: Date.now() - startTime });

    const template = emailTemplates.passwordReset(email, resetUrl);

    log('Sending password reset email...');
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
      log('Failed to send email via Resend', { error: result.error, elapsed: Date.now() - startTime });
      return NextResponse.json(
        { success: false, error: 'SEND_EMAIL_FAILED', message: result.error || 'Failed to send reset email.' },
        { status: 500 }
      );
    }

    log('Password reset email sent successfully', { elapsed: Date.now() - startTime });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const elapsed = Date.now() - startTime;

    log('Password reset caught error', {
      errorCode,
      errorMessage: errorMessage.substring(0, 200),
      isTimeout: errorMessage.includes('timed out'),
      elapsed,
    });

    // If it's a timeout, return a proper error
    if (errorMessage.includes('timed out')) {
      log('Request timed out - returning error to client');
      return NextResponse.json(
        { success: false, error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    // For other errors, return success to prevent user enumeration
    log('Returning success to prevent user enumeration', { errorCode, elapsed });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }
}
