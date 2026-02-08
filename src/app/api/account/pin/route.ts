import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcrypt';
import { updateUserProfileAdmin } from '@/lib/firebase/admin-services/users';

/**
 * PATCH /api/account/pin - Create or update verification PIN
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Please log in to manage your PIN.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pin, confirmPin } = body;

    if (!pin || !confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PIN and confirmation are required.' },
        { status: 400 }
      );
    }

    if (pin !== confirmPin) {
      return NextResponse.json(
        { success: false, error: 'PINs do not match.' },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: 'PIN must be 4-6 digits.' },
        { status: 400 }
      );
    }

    const saltRounds = 10;
    const verificationPinHash = await bcrypt.hash(pin, saltRounds);

    await updateUserProfileAdmin(session.user.id, { verificationPinHash });

    return NextResponse.json({
      success: true,
      message: 'Verification PIN saved successfully.',
    });
  } catch (error) {
    console.error('Error saving verification PIN:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to save PIN. Please try again.' },
      { status: 500 }
    );
  }
}
