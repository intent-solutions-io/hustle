import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmailToken, deleteEmailVerificationToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify token and get user
    const verificationToken = await verifyEmailToken(token);

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      return NextResponse.json(
        {
          success: true,
          message: 'Email already verified',
          alreadyVerified: true
        },
        { status: 200 }
      );
    }

    // Update user's emailVerified timestamp
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    });

    // Delete the used token
    await deleteEmailVerificationToken(verificationToken.id);

    // Send welcome email
    const welcomeTemplate = emailTemplates.welcome(verificationToken.user.firstName);
    const emailResult = await sendEmail({
      to: verificationToken.user.email,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.html,
      text: welcomeTemplate.text,
    });

    if (!emailResult.success) {
      console.error('[Email Verification] Failed to send welcome email:', emailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully. You can now log in.',
        welcomeEmailSent: emailResult.success,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Verification] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}
