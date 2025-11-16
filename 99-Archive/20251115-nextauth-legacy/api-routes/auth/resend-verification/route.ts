import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmailVerificationToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[Resend Verification] No user found for email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists and is unverified, we sent a verification link.',
        },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      console.log(`[Resend Verification] Email already verified: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'This email is already verified. You can log in now.',
        },
        { status: 200 }
      );
    }

    // Generate new verification token
    const verificationToken = await generateEmailVerificationToken(user.id);

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken.token}`;

    // Send verification email
    const emailTemplate = emailTemplates.emailVerification(user.firstName, verificationUrl);
    const emailResult = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      console.error('[Resend Verification] Failed to send email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[Resend Verification] Verification email sent to: ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Resend Verification] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
