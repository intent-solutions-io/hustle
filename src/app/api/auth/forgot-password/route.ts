import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/auth/forgot-password');

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const { email } = await request.json().catch(() => ({ email: '' }));

  if (!email || typeof email !== 'string' || !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }

  // If email service is not configured, fail fast (doesn't leak user existence).
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json(
      { success: false, error: 'Email service is not configured. Please contact support.' },
      { status: 503 }
    );
  }

  const origin =
    process.env.WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_DOMAIN ||
    new URL(request.url).origin;
  const websiteOrigin = origin.startsWith('http://') || origin.startsWith('https://')
    ? origin
    : `https://${origin}`;

  try {
    logger.info('Generating password reset link', { email: email.substring(0, 3) + '***' });

    const firebaseLink = await adminAuth.generatePasswordResetLink(email);
    logger.info('Firebase link generated successfully');

    const actionUrl = new URL(firebaseLink);
    const oobCode = actionUrl.searchParams.get('oobCode');

    const resetUrl = oobCode
      ? `${websiteOrigin}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : firebaseLink;

    logger.info('Sending password reset email', { resetUrlDomain: new URL(resetUrl).hostname });

    const template = emailTemplates.passwordReset(email, resetUrl);
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      logger.error('Failed to send email via Resend', undefined, { error: result.error });
      return NextResponse.json(
        { success: false, error: 'SEND_EMAIL_FAILED', message: result.error || 'Failed to send reset email.' },
        { status: 500 }
      );
    }

    logger.info('Password reset email sent successfully');
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error: any) {
    // Avoid user enumeration: return success for unknown users.
    if (error?.code === 'auth/user-not-found') {
      logger.info('User not found (returning success to prevent enumeration)');
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    }

    logger.error('Password reset failed', error instanceof Error ? error : new Error(String(error)), {
      errorCode: error?.code,
      errorMessage: error?.message,
    });

    return NextResponse.json(
      { success: false, error: 'PASSWORD_RESET_FAILED', message: 'Failed to send reset email. Please try again.' },
      { status: 500 }
    );
  }
}
