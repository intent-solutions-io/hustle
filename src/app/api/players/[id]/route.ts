import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    // Verify player exists AND belongs to authenticated user
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      select: { parentId: true }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (existingPlayer.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not your player' },
        { status: 403 }
      );
    }

    // Update player
    const updatedPlayer = await prisma.player.update({
      where: { id },
      data: {
        name,
        birthday: new Date(birthday),
        position,
        teamClub,
      },
    });

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
 * Note: Cascades to delete all associated games
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

    // Verify player exists AND belongs to authenticated user
    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      select: { parentId: true, name: true }
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (existingPlayer.parentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not your player' },
        { status: 403 }
      );
    }

    // Delete player (CASCADE will delete all associated games)
    await prisma.player.delete({
      where: { id },
    });

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
