/**
 * DEBUG ENDPOINT — remove in production.
 *
 * GET /api/debug/workout-logs/[playerId]
 *
 * Lists every workout log for a player. Phase 4.5: backed by the Drizzle
 * players + workout-logs query modules instead of Firestore.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import { getWorkoutLogsAdmin } from '@/lib/db/queries/workout-logs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/debug/workout-logs/[playerId]');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerId } = await params;
    const userId = session.user.id;

    const player = await getPlayerAdmin(userId, playerId);
    const { logs } = await getWorkoutLogsAdmin(userId, playerId, { limit: 500 });

    return NextResponse.json({
      debug: true,
      userId,
      playerId,
      playerExists: Boolean(player),
      playerData: player ? { name: player.name } : null,
      workoutLogsCount: logs.length,
      workoutLogs: logs,
    });
  } catch (error) {
    logger.error('Error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
