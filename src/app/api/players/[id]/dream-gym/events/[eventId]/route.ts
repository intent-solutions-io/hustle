import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import { removeDreamGymEventAdmin } from '@/lib/firebase/admin-services/dream-gym';

/**
 * DELETE /api/players/[id]/dream-gym/events/[eventId] - Remove a Dream Gym event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await auth();

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
    console.error('Error removing event:', error);
    return NextResponse.json(
      { error: 'Failed to remove event' },
      { status: 500 }
    );
  }
}
