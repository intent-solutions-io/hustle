import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { workoutLogCreateSchema, workoutLogQuerySchema } from '@/lib/validations/workout-log-schema';
import { createWorkoutLogAdmin, getWorkoutLogsAdmin } from '@/lib/db/queries/workout-logs';
import { getPlayerAdmin } from '@/lib/db/queries/players';

const logger = createLogger('api/workout-logs');

// GET /api/workout-logs?playerId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const playerId = params.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'playerId is required' }, { status: 400 });
    }

    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const queryResult = workoutLogQuerySchema.safeParse({
      type: params.get('type') ?? undefined,
      startDate: params.get('startDate') ?? undefined,
      endDate: params.get('endDate') ?? undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
      cursor: params.get('cursor') ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: queryResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const q = queryResult.data;
    const { logs, nextCursor } = await getWorkoutLogsAdmin(session.user.id, playerId, {
      type: q.type,
      startDate: q.startDate ? new Date(q.startDate) : undefined,
      endDate: q.endDate ? new Date(q.endDate) : undefined,
      limit: q.limit,
      cursor: q.cursor,
    });
    return NextResponse.json({ logs, nextCursor });
  } catch (error) {
    logger.error('Failed to fetch workout logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch workout logs' }, { status: 500 });
  }
}

// POST /api/workout-logs
export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = workoutLogCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { playerId, ...data } = validationResult.data;

    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const log = await createWorkoutLogAdmin(session.user.id, playerId, validationResult.data);

    logger.info('Workout log created', { userId: session.user.id, playerId, logId: log.id });
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create workout log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create workout log' }, { status: 500 });
  }
}
