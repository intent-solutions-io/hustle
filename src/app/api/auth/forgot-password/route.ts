import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

// Simple console logging for reliability
const log = (msg: string, data?: Record<string, unknown>) => {
  console.log(`[forgot-password] ${msg}`, data ? JSON.stringify(data) : '');
};

// GET endpoint for debugging - verifies route is loaded
export async function GET() {
  return NextResponse.json({ status: 'ok', route: 'forgot-password', timestamp: new Date().toISOString() });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  log('Request received');

  try {
    const body = await request.json();
    const email = body?.email || '';

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Fail fast if email service is not configured
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
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
    } else {
      websiteOrigin = 'https://hustlestats.io';
    }

    log('Generating reset link', { elapsed: Date.now() - startTime });
    const firebaseLink = await adminAuth.generatePasswordResetLink(email);
    log('Reset link generated', { elapsed: Date.now() - startTime });

    const actionUrl = new URL(firebaseLink);
    const oobCode = actionUrl.searchParams.get('oobCode');
    const resetUrl = oobCode
      ? `${websiteOrigin}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : firebaseLink;

    const template = emailTemplates.passwordReset(email, resetUrl);

    log('Sending email', { elapsed: Date.now() - startTime });
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      log('Send failed', { error: result.error, elapsed: Date.now() - startTime });
      return NextResponse.json(
        { success: false, error: 'SEND_EMAIL_FAILED', message: result.error || 'Failed to send reset email.' },
        { status: 500 }
      );
    }

    log('Email sent', { elapsed: Date.now() - startTime });
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code || '';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log('Error', { errorCode, errorMessage: errorMessage.substring(0, 200), elapsed: Date.now() - startTime });

    // Return success to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });
  }
}
