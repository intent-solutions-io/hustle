import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { generateEmailVerificationToken } from '@/lib/tokens';
import { sendEmail } from '@/lib/email';
import { emailTemplates } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, password } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (10 rounds per CLAUDE.md security standards)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database with legal consent fields
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        password: hashedPassword,
        // Legal compliance (COPPA) - set automatically on registration
        agreedToTerms: true,
        agreedToPrivacy: true,
        isParentGuardian: true,
        termsAgreedAt: now,
        privacyAgreedAt: now,
      },
    });

    console.log('[Registration] User created successfully, generating verification token...');

    // Generate email verification token
    const verificationToken = await generateEmailVerificationToken(user.id);
    console.log('[Registration] Verification token generated');

    // Create verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken.token}`;
    console.log('[Registration] Verification URL created');

    // Send verification email
    console.log('[Registration] Preparing email template...');
    const emailTemplate = emailTemplates.emailVerification(
      user.firstName,
      verificationUrl
    );
    console.log('[Registration] Email template prepared, sending...');

    const emailResult = await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    if (!emailResult.success) {
      console.error('[Registration] Failed to send verification email:', emailResult.error);
      // Don't fail registration if email fails - user can request resend
    } else {
      console.log('[Registration] Verification email sent successfully');
    }

    // Return success (don't expose user ID or sensitive data)
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        emailSent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
