import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { addMentalCheckInAdmin } from '@/lib/firebase/admin-services/dream-gym';

/**
 * POST /api/players/[id]/dream-gym/check-in - Add a mental check-in
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();

    const { mood, energy, soreness, stress, notes } = body;

    // Validate required fields
    if (typeof mood !== 'number' || mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: 'Mood must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (!['low', 'ok', 'high'].includes(energy)) {
      return NextResponse.json(
        { error: 'Energy must be low, ok, or high' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(soreness)) {
      return NextResponse.json(
        { error: 'Soreness must be low, medium, or high' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(stress)) {
      return NextResponse.json(
        { error: 'Stress must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Verify player belongs to user (using Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Add check-in (using Admin SDK)
    await addMentalCheckInAdmin(session.user.id, playerId, {
      mood: mood as 1 | 2 | 3 | 4 | 5,
      energy,
      soreness,
      stress,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error adding check-in:', error);
    return NextResponse.json(
      { error: 'Failed to add check-in' },
      { status: 500 }
    );
  }
}
