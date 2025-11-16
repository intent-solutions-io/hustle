import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/tokens';
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
    // Don't reveal whether the email exists in our system
    if (!user) {
      console.log(`[Forgot Password] No user found for email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists, we sent a password reset link.',
        },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = await generatePasswordResetToken(user.id);

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken.token}`;

    // Send password reset email
    const emailTemplate = emailTemplates.passwordReset(user.email, resetUrl);
    const emailResult = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      console.error('[Forgot Password] Failed to send reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`[Forgot Password] Reset email sent to: ${user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, we sent a password reset link.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
