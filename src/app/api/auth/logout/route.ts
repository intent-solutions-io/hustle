/**
 * Logout API Route (Firebase Auth)
 *
 * Clears the session cookie to log out the user server-side.
 * Client should also call Firebase signOut() to clear client-side state.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('__session');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('Logout error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
