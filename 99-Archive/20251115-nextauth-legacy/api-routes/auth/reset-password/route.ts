import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPasswordResetToken, deletePasswordResetToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify reset token
    const resetToken = await verifyPasswordResetToken(token);

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password (10 rounds per CLAUDE.md security standards)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await deletePasswordResetToken(resetToken.id);

    // Send password changed confirmation email
    const confirmationTemplate = emailTemplates.passwordChanged(resetToken.user.email);
    const emailResult = await sendEmail({
      to: resetToken.user.email,
      subject: confirmationTemplate.subject,
      html: confirmationTemplate.html,
      text: confirmationTemplate.text,
    });

    if (!emailResult.success) {
      console.error('[Reset Password] Failed to send confirmation email:', emailResult.error);
    }

    console.log(`[Reset Password] Password reset successfully for user: ${resetToken.user.email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
        confirmationEmailSent: emailResult.success,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Reset Password] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
