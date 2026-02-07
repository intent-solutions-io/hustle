import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  getCardioLogAdmin,
  updateCardioLogAdmin,
  deleteCardioLogAdmin,
} from '@/lib/firebase/admin-services/cardio-logs';
import { cardioLogUpdateSchema } from '@/lib/validations/cardio-log-schema';

/**
 * GET /api/players/[id]/cardio-logs/[logId] - Get single cardio log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    const cardioLog = await getCardioLogAdmin(session.user.id, playerId, logId);
    if (!cardioLog) {
      return NextResponse.json(
        { error: 'Cardio log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cardioLog,
    });
  } catch (error) {
    console.error('Error fetching cardio log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cardio log' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/players/[id]/cardio-logs/[logId] - Update cardio log
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;
    const body = await request.json();

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify log exists
    const existingLog = await getCardioLogAdmin(session.user.id, playerId, logId);
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Cardio log not found' },
        { status: 404 }
      );
    }

    // Validate update data
    const validationResult = cardioLogUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updatedLog = await updateCardioLogAdmin(
      session.user.id,
      playerId,
      logId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      cardioLog: updatedLog,
    });
  } catch (error) {
    console.error('Error updating cardio log:', error);
    return NextResponse.json(
      { error: 'Failed to update cardio log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id]/cardio-logs/[logId] - Delete cardio log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: playerId, logId } = await params;

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Verify log exists
    const existingLog = await getCardioLogAdmin(session.user.id, playerId, logId);
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Cardio log not found' },
        { status: 404 }
      );
    }

    await deleteCardioLogAdmin(session.user.id, playerId, logId);

    return NextResponse.json({
      success: true,
      message: 'Cardio log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting cardio log:', error);
    return NextResponse.json(
      { error: 'Failed to delete cardio log' },
      { status: 500 }
    );
  }
}
