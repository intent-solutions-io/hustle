import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  getWorkoutLogAdmin,
  updateWorkoutLogAdmin,
  deleteWorkoutLogAdmin,
} from '@/lib/firebase/admin-services/workout-logs';
import { workoutLogUpdateSchema } from '@/lib/validations/workout-log-schema';

/**
 * GET /api/players/[id]/dream-gym/workout-logs/[logId] - Get single workout log
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

    const workoutLog = await getWorkoutLogAdmin(session.user.id, playerId, logId);

    if (!workoutLog) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      workoutLog,
    });
  } catch (error) {
    console.error('Error fetching workout log:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout log' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players/[id]/dream-gym/workout-logs/[logId] - Update workout log
 */
export async function PUT(
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

    // Verify workout log exists
    const existing = await getWorkoutLogAdmin(session.user.id, playerId, logId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = workoutLogUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid workout log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const workoutLog = await updateWorkoutLogAdmin(
      session.user.id,
      playerId,
      logId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      workoutLog,
    });
  } catch (error) {
    console.error('Error updating workout log:', error);
    return NextResponse.json(
      { error: 'Failed to update workout log' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players/[id]/dream-gym/workout-logs/[logId] - Delete workout log
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

    // Verify workout log exists
    const existing = await getWorkoutLogAdmin(session.user.id, playerId, logId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workout log not found' },
        { status: 404 }
      );
    }

    await deleteWorkoutLogAdmin(session.user.id, playerId, logId);

    return NextResponse.json({
      success: true,
      message: 'Workout log deleted',
    });
  } catch (error) {
    console.error('Error deleting workout log:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout log' },
      { status: 500 }
    );
  }
}
