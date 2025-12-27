import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayer } from '@/lib/firebase/services/players';
import { addDreamGymEvent } from '@/lib/firebase/services/dream-gym';

/**
 * POST /api/players/[id]/dream-gym/events - Add a Dream Gym event
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

    const { date, type, name, notes } = body;

    if (!date || !type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: date, type, name' },
        { status: 400 }
      );
    }

    // Verify player belongs to user
    const player = await getPlayer(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Add event - service handles date-to-Timestamp conversion
    const eventId = await addDreamGymEvent(session.user.id, playerId, {
      date: new Date(date),
      type,
      name,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      eventId
    });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json(
      { error: 'Failed to add event' },
      { status: 500 }
    );
  }
}
