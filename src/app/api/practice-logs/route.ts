import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { practiceLogCreateSchema, practiceLogQuerySchema } from '@/lib/validations/practice-log-schema';
import { createPracticeLogAdmin, getPracticeLogsAdmin } from '@/lib/firebase/admin-services/practice-logs';
import { getPlayerAdmin } from '@/lib/firebase/admin-services/players';

const logger = createLogger('api/practice-logs');

// GET /api/practice-logs?playerId=xxx
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

    const queryResult = practiceLogQuerySchema.safeParse({
      practiceType: params.get('practiceType') ?? undefined,
      focusArea: params.get('focusArea') ?? undefined,
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
    const { logs, nextCursor } = await getPracticeLogsAdmin(session.user.id, playerId, {
      practiceType: q.practiceType,
      focusArea: q.focusArea,
      startDate: q.startDate ? new Date(q.startDate) : undefined,
      endDate: q.endDate ? new Date(q.endDate) : undefined,
      limit: q.limit,
      cursor: q.cursor,
    });
    return NextResponse.json({ logs, nextCursor });
  } catch (error) {
    logger.error('Failed to fetch practice logs', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch practice logs' }, { status: 500 });
  }
}

// POST /api/practice-logs
export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = practiceLogCreateSchema.safeParse(body);

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

    const log = await createPracticeLogAdmin(session.user.id, playerId, validationResult.data);

    logger.info('Practice log created', { userId: session.user.id, playerId, logId: log.id });
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create practice log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create practice log' }, { status: 500 });
  }
}
