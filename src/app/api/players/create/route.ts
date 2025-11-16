import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { createPlayer } from '@/lib/firebase/services/players';
import { incrementPlayerCount } from '@/lib/firebase/services/workspaces';
import { getUser } from '@/lib/firebase/services/users';
import { getWorkspaceById } from '@/lib/firebase/services/workspaces';
import { getPlanLimits } from '@/lib/stripe/plan-mapping';

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

    // Phase 5 Task 4: Get user's workspace and check plan limits
    const user = await getUser(session.user.id);
    if (!user?.defaultWorkspaceId) {
      logger.error('User has no default workspace', {
        userId: session.user.id,
      });

      return NextResponse.json(
        { error: 'No workspace found. Please contact support.' },
        { status: 500 }
      );
    }

    const workspace = await getWorkspaceById(user.defaultWorkspaceId);
    if (!workspace) {
      logger.error('Workspace not found', {
        userId: session.user.id,
        workspaceId: user.defaultWorkspaceId,
      });

      return NextResponse.json(
        { error: 'Workspace not found. Please contact support.' },
        { status: 500 }
      );
    }

    // Phase 5 Task 4: Check plan limit for max players
    const limits = getPlanLimits(workspace.plan);
    if (workspace.usage.playerCount >= limits.maxPlayers) {
      logger.warn('Player creation blocked - plan limit exceeded', {
        userId: session.user.id,
        workspaceId: workspace.id,
        currentPlan: workspace.plan,
        currentPlayerCount: workspace.usage.playerCount,
        maxPlayers: limits.maxPlayers,
      });

      return NextResponse.json(
        {
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `You've reached the maximum number of players (${limits.maxPlayers}) for your ${workspace.plan} plan. Upgrade your plan to add more players.`,
          currentPlan: workspace.plan,
          currentCount: workspace.usage.playerCount,
          limit: limits.maxPlayers,
        },
        { status: 403 }
      );
    }

    // Create player with workspace context (Firestore)
    const player = await createPlayer(session.user.id, {
      workspaceId: workspace.id,  // Phase 5: Link to workspace
      name,
      birthday: new Date(birthday),
      position,
      teamClub,
      photoUrl: null,
    });

    // Phase 5 Task 4: Increment workspace player count
    await incrementPlayerCount(workspace.id);

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
