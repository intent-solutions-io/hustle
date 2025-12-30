import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';
import {
  createWorkoutLogAdmin,
  getWorkoutLogsAdmin,
} from '@/lib/firebase/admin-services/workout-logs';
import { workoutLogCreateSchema, workoutLogQuerySchema } from '@/lib/validations/workout-log-schema';
import type { WorkoutLogType } from '@/types/firestore';

/**
 * GET /api/players/[id]/dream-gym/workout-logs - List workout logs
 * Supports pagination and filtering by type/date range
 */
export async function GET(
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

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Parse query params
    const url = new URL(request.url);
    const queryParams = {
      type: url.searchParams.get('type') as WorkoutLogType | undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      cursor: url.searchParams.get('cursor') || undefined,
    };

    // Validate query params
    const validationResult = workoutLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const options = {
      type: queryParams.type,
      startDate: queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      limit: queryParams.limit,
      cursor: queryParams.cursor,
    };

    const { logs, nextCursor } = await getWorkoutLogsAdmin(
      session.user.id,
      playerId,
      options
    );

    return NextResponse.json({
      success: true,
      logs,
      nextCursor,
    });
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players/[id]/dream-gym/workout-logs - Create workout log
 * Records a completed workout with reps/sets/weight data
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

    // Verify player belongs to user
    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const validationResult = workoutLogCreateSchema.safeParse({
      ...body,
      playerId, // Inject from URL
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid workout log data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const workoutLog = await createWorkoutLogAdmin(
      session.user.id,
      playerId,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      workoutLog,
    });
  } catch (error) {
    console.error('Error creating workout log:', error);
    return NextResponse.json(
      { error: 'Failed to create workout log' },
      { status: 500 }
    );
  }
}
