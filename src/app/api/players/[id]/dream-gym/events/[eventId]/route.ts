import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { removeDreamGymEventAdmin } from '@/lib/firebase/admin-services/dream-gym';

const logger = createLogger('api/players/[id]/dream-gym/events/[eventId]');

/**
 * DELETE /api/players/[id]/dream-gym/events/[eventId] - Remove a Dream Gym event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, eventId } = await params;

    // Verify player belongs to user (using Admin SDK)
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Remove event (using Admin SDK)
    await removeDreamGymEventAdmin(session.user.id, playerId, eventId);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    logger.error('Error removing event', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to remove event' },
      { status: 500 }
    );
  }
}
