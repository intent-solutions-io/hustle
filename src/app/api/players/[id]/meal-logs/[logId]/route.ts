import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPlayerAdmin } from '@/lib/db/queries/players';
import { deleteMealLogAdmin } from '@/lib/db/queries/meal-logs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api/players/[id]/meal-logs/[logId]');

/**
 * DELETE /api/players/[id]/meal-logs/[logId] - Delete meal log
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await auth(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: playerId, logId } = await params;

    const player = await getPlayerAdmin(session.user.id, playerId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    await deleteMealLogAdmin(session.user.id, playerId, logId);
    return NextResponse.json({ success: true, message: 'Meal log deleted successfully' });
  } catch (error) {
    logger.error('Error deleting meal log', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to delete meal log' }, { status: 500 });
  }
}
