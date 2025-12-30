import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

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
    const user = await adminAuth.getUserByEmail(email);

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    const firebaseLink = await adminAuth.generateEmailVerificationLink(email);
    const actionUrl = new URL(firebaseLink);
    const oobCode = actionUrl.searchParams.get('oobCode');

    const verificationUrl = oobCode
      ? `${websiteOrigin}/verify-email?oobCode=${encodeURIComponent(oobCode)}`
      : firebaseLink;

    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const firstName = (userData?.firstName as string | undefined) || user.displayName?.split(' ')[0] || 'there';

    const template = emailTemplates.emailVerification(firstName, verificationUrl);
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send verification email.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent.',
    });
  } catch (error: any) {
    // Avoid user enumeration: return success for unknown users.
    if (error?.code === 'auth/user-not-found') {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    console.error('[api/auth/resend-verification] Failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    );
  }
}
