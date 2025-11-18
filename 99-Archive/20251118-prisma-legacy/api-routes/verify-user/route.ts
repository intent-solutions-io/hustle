import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to manually verify a user's email
 * POST /api/admin/verify-user
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        {
          message: 'User email already verified',
          email: user.email,
          verifiedAt: user.emailVerified,
        },
        { status: 200 }
      );
    }

    // Manually verify the user
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log(`[Admin] Manually verified user: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User email verified successfully',
        email: updatedUser.email,
        verifiedAt: updatedUser.emailVerified,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Admin] Error verifying user:', error);
    return NextResponse.json(
      { error: 'Failed to verify user' },
      { status: 500 }
    );
  }
}
