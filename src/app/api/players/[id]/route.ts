import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayer, updatePlayer, deletePlayer } from '@/lib/firebase/services/players';

/**
 * PUT /api/players/[id] - Update athlete profile
 * Security: Verifies parent ownership before update
 */
export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const { name, birthday, position, teamClub } = body;

    // Validation
    if (!name || !birthday || !position || !teamClub) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify player exists AND belongs to authenticated user (Firestore)
    const existingPlayer = await getPlayer(session.user.id, id);

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update player (Firestore)
    await updatePlayer(session.user.id, id, {
      name,
      position,
      teamClub,
    });

    // Get updated player for response
    const updatedPlayer = await getPlayer(session.user.id, id);

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id] - Delete athlete profile
 * Security: Verifies parent ownership before deletion
 * Note: Cascades to delete all associated games (via Firestore rules)
 */
export async function DELETE(
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

    const { id } = await params;

    // Verify player exists AND belongs to authenticated user (Firestore)
    const existingPlayer = await getPlayer(session.user.id, id);

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Delete player (Firestore - CASCADE handled by security rules)
    await deletePlayer(session.user.id, id);

    return NextResponse.json({
      success: true,
      message: `Player ${existingPlayer.name} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
