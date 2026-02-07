import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  getPracticeLogAdmin,
  updatePracticeLogAdmin,
  deletePracticeLogAdmin,
} from '@/lib/firebase/admin-services/practice-logs';
import { practiceLogUpdateSchema } from '@/lib/validations/practice-log-schema';

/**
 * GET /api/players/[id]/practice-logs/[logId] - Get single practice log
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

    const practiceLog = await getPracticeLogAdmin(session.user.id, playerId, logId);
    if (!practiceLog) {
      return NextResponse.json(
        { error: 'Practice log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      practiceLog,
    });
  } catch (error) {
    console.error('Error fetching practice log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch practice log' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/players/[id]/practice-logs/[logId] - Update practice log
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
    const existingLog = await getPracticeLogAdmin(session.user.id, playerId, logId);
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Practice log not found' },
        { status: 404 }
      );
    }

    // Validate update data
    const validationResult = practiceLogUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const updatedLog = await updatePracticeLogAdmin(
      session.user.id,
      playerId,
      logId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      practiceLog: updatedLog,
    });
  } catch (error) {
    console.error('Error updating practice log:', error);
    return NextResponse.json(
      { error: 'Failed to update practice log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id]/practice-logs/[logId] - Delete practice log
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
    const existingLog = await getPracticeLogAdmin(session.user.id, playerId, logId);
    if (!existingLog) {
      return NextResponse.json(
        { error: 'Practice log not found' },
        { status: 404 }
      );
    }

    await deletePracticeLogAdmin(session.user.id, playerId, logId);

    return NextResponse.json({
      success: true,
      message: 'Practice log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting practice log:', error);
    return NextResponse.json(
      { error: 'Failed to delete practice log' },
      { status: 500 }
    );
  }
}
