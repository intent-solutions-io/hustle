import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { addDreamGymEventAdmin } from '@/lib/firebase/admin-services/dream-gym';

const logger = createLogger('api/players/[id]/dream-gym/events');

/**
 * POST /api/players/[id]/dream-gym/events - Add a Dream Gym event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);

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

    // Verify player belongs to user (using Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Add event (using Admin SDK)
    const eventId = await addDreamGymEventAdmin(session.user.id, playerId, {
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
    logger.error('Error adding event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to add event' },
      { status: 500 }
    );
  }
}
