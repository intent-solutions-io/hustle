/**
 * Registration API Route (Firebase Auth)
 *
 * Handles user registration with Firebase Auth.
 * Replaces the previous NextAuth-based registration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/firebase/auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, 'You must agree to the Terms of Service'),
  agreedToPrivacy: z.boolean().refine((val) => val === true, 'You must agree to the Privacy Policy'),
  isParentGuardian: z.boolean().refine((val) => val === true, 'You must be 18+ to create an account'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = registerSchema.parse(body);

    // Create user with Firebase Auth
    const { user, firestoreUser } = await signUp(validatedData);

    // Note: Welcome email is sent automatically by Firebase Cloud Function (onUserCreated trigger)

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        user: {
          id: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          displayName: user.displayName,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { success: false, error: 'Password is too weak. Please choose a stronger password.' },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
