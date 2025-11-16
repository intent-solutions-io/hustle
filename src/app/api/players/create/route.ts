import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { createPlayer } from '@/lib/firebase/services/players';

const logger = createLogger('api/players/create');

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get authenticated user from NextAuth session
    const session = await auth();

    if (!session?.user?.id) {
      logger.warn('Unauthorized player creation attempt', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, birthday, position, teamClub } = body;

    // Validate required fields
    if (!name || !birthday || !position || !teamClub) {
      logger.warn('Invalid player creation request - missing fields', {
        userId: session.user.id,
        providedFields: { name: !!name, birthday: !!birthday, position: !!position, teamClub: !!teamClub },
      });

      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create player with authenticated user as parent (Firestore)
    const player = await createPlayer(session.user.id, {
      name,
      birthday: new Date(birthday),
      position,
      teamClub,
      photoUrl: null,
    });

    const duration = Date.now() - startTime;

    logger.info('Player created successfully', {
      userId: session.user.id,
      playerId: player.id,
      playerName: name,
      position,
      duration,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      player,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(
      'Failed to create player',
      error instanceof Error ? error : new Error(String(error)),
      {
        duration,
        statusCode: 500,
        path: request.nextUrl.pathname,
      }
    );

    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
