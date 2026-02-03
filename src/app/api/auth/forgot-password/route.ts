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

  logger.info('Determined website origin', { websiteOrigin, forwardedHost, hostHeader });

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
    // For security (user enumeration prevention), return success for ALL Firebase Auth errors.
    // We don't want to reveal whether an account exists or not.
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    logger.info('Password reset caught error', {
      errorCode,
      errorMessage: errorMessage.substring(0, 200),
    });

    // Any error from generatePasswordResetLink should return success
    // to prevent user enumeration (whether user exists or not, same response)
    logger.info('Returning success to prevent user enumeration', { errorCode });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }
}
