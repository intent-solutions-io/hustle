import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isOnWaitlist, addToWaitlist } from '@/lib/firebase/services/waitlist';

// Validation schema
const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validatedData = waitlistSchema.parse(body);

    // Check if email already exists (Firestore)
    const exists = await isOnWaitlist(validatedData.email);

    if (exists) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist' },
        { status: 409 }
      );
    }

    // Create waitlist entry (Firestore)
    await addToWaitlist({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      source: validatedData.source || 'landing_page',
    });

    return NextResponse.json(
      {
        message: 'Successfully joined the waitlist!',
        id: validatedData.email // Use email as ID in Firestore
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}
