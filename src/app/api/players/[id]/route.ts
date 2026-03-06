import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getPlayerAdmin, updatePlayerAdmin, deletePlayerAdmin } from '@/lib/firebase/admin-services/players';
import { getUserProfileAdmin } from '@/lib/firebase/admin-services/users';
import { getWorkspaceByIdAdmin } from '@/lib/firebase/admin-services/workspaces';
import { assertWorkspaceActive } from '@/lib/workspaces/enforce';
import { WorkspaceAccessError } from '@/lib/firebase/access-control';
import { playerSchema } from '@/lib/validations/player';

const logger = createLogger('api/players/[id]');

/**
 * GET /api/players/[id] - Get single athlete
 * Security: Verifies parent ownership
 */
export async function GET(
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

    const { id } = await params;

    // Get player (Firestore - ownership verified by subcollection path)
    const player = await getPlayerAdmin(session.user.id, id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      player
    });
  } catch (error) {
    logger.error('Error fetching player', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players/[id] - Update athlete profile
 * Security: Verifies parent ownership before update
 */
export async function PUT(
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

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST_BODY', message: 'Invalid request body. Please try again.' },
        { status: 400 }
      );
    }

    const validationResult = playerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          message: 'Please check the form fields and try again.',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Phase 6 Task 5: Enforce workspace status
    const user = await getUserProfileAdmin(session.user.id);
    if (!user?.defaultWorkspaceId) {
      return NextResponse.json(
        { error: 'No workspace found' },
        { status: 500 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(user.defaultWorkspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 500 }
      );
    }

    try {
      assertWorkspaceActive(workspace);
    } catch (error) {
      if (error instanceof WorkspaceAccessError) {
        return NextResponse.json(
          error.toJSON(),
          { status: error.httpStatus }
        );
      }
      throw error;
    }

    // Verify player exists AND belongs to authenticated user (Firestore)
    const existingPlayer = await getPlayerAdmin(session.user.id, id);

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Update player (Firestore)
    await updatePlayerAdmin(session.user.id, id, {
      name: validatedData.name,
      birthday: new Date(validatedData.birthday),
      gender: validatedData.gender,
      primaryPosition: validatedData.primaryPosition,
      position: validatedData.primaryPosition, // Legacy field for backward compatibility
      secondaryPositions: validatedData.secondaryPositions ?? [],
      positionNote: validatedData.positionNote?.trim() ? validatedData.positionNote.trim() : null,
      leagueCode: validatedData.leagueCode,
      leagueOtherName: validatedData.leagueCode === 'other' && validatedData.leagueOtherName?.trim()
        ? validatedData.leagueOtherName.trim()
        : null,
      teamClub: validatedData.teamClub,
    });

    // Get updated player for response
    const updatedPlayer = await getPlayerAdmin(session.user.id, id);

    return NextResponse.json({
      success: true,
      player: updatedPlayer
    });
  } catch (error) {
    logger.error('Error updating player', error instanceof Error ? error : new Error(String(error)));
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
    const session = await auth(request);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Phase 6 Task 5: Enforce workspace status
    const user = await getUserProfileAdmin(session.user.id);
    if (!user?.defaultWorkspaceId) {
      return NextResponse.json(
        { error: 'No workspace found' },
        { status: 500 }
      );
    }

    const workspace = await getWorkspaceByIdAdmin(user.defaultWorkspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 500 }
      );
    }

    try {
      assertWorkspaceActive(workspace);
    } catch (error) {
      if (error instanceof WorkspaceAccessError) {
        return NextResponse.json(
          error.toJSON(),
          { status: error.httpStatus }
        );
      }
      throw error;
    }

    // Verify player exists AND belongs to authenticated user (Firestore)
    const existingPlayer = await getPlayerAdmin(session.user.id, id);

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Delete player (Firestore - CASCADE handled by security rules)
    await deletePlayerAdmin(session.user.id, id);

    return NextResponse.json({
      success: true,
      message: `Player ${existingPlayer.name} deleted successfully`
    });
  } catch (error) {
    logger.error('Error deleting player', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
