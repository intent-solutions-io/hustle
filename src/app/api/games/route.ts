import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { gameSchema } from '@/lib/validations/game-schema'
import { sendEmail } from '@/lib/email'
import { emailTemplates } from '@/lib/email-templates'
import { getPlayer, getPlayers } from '@/lib/firebase/services/players'
import { getGames, createGame, getUnverifiedGames } from '@/lib/firebase/services/games'
import { getUser } from '@/lib/firebase/services/users'
import { getWorkspaceById, incrementGamesThisMonth } from '@/lib/firebase/services/workspaces'
import { getPlanLimits } from '@/lib/stripe/plan-mapping'
import { requireWorkspaceWriteAccess, WorkspaceAccessError } from '@/lib/firebase/access-control'

const logger = createLogger('api/games');

// Simple in-memory rate limiting (production: use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

// GET /api/games?playerId=xxx - Get all games for a player
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json({
        error: 'playerId is required'
      }, { status: 400 })
    }

    // Verify player exists and belongs to authenticated user (Firestore)
    const player = await getPlayer(session.user.id, playerId);

    if (!player) {
      return NextResponse.json({
        error: 'Player not found'
      }, { status: 404 })
    }

    // Get all games for this player from Firestore
    const games = await getGames(session.user.id, playerId);

    // Format response to match Prisma structure (include player info)
    const gamesWithPlayer = games.map((game) => ({
      ...game,
      player: {
        name: player.name,
        position: player.position
      }
    }));

    return NextResponse.json({ games: gamesWithPlayer })
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({
      error: 'Failed to fetch games'
    }, { status: 500 })
  }
}

// POST /api/games - Create a new game log
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const userId = session.user.id;
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
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

    const body = await request.json();

    // Handle finalScore format (e.g., "3-2") and convert to yourScore/opponentScore
    if (body.finalScore && typeof body.finalScore === 'string' && !body.yourScore) {
      const scores = body.finalScore.split('-');
      if (scores.length === 2) {
        body.yourScore = parseInt(scores[0]);
        body.opponentScore = parseInt(scores[1]);
      }
    }

    // Server-side Zod validation
    const validationResult = gameSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Verify player exists AND belongs to authenticated user (Firestore)
    const player = await getPlayer(session.user.id, validatedData.playerId);

    if (!player) {
      return NextResponse.json({
        error: 'Player not found'
      }, { status: 404 });
    }

    // Phase 7 Task 4: Enforce workspace subscription status (before plan limits)
    try {
      await requireWorkspaceWriteAccess(workspace.id);
    } catch (error) {
      if (error instanceof WorkspaceAccessError) {
        logger.warn('Game creation blocked - subscription inactive', {
          userId: session.user.id,
          workspaceId: workspace.id,
          workspaceStatus: error.status,
          reason: error.code,
        });

        return NextResponse.json(
          error.toJSON(),
          { status: error.httpStatus }
        );
      }
      throw error; // Re-throw if not workspace access error
    }

    // Phase 5 Task 4: Check plan limit for max games per month
    const limits = getPlanLimits(workspace.plan);
    if (workspace.usage.gamesThisMonth >= limits.maxGamesPerMonth) {
      logger.warn('Game creation blocked - plan limit exceeded', {
        userId: session.user.id,
        workspaceId: workspace.id,
        currentPlan: workspace.plan,
        currentGamesThisMonth: workspace.usage.gamesThisMonth,
        maxGamesPerMonth: limits.maxGamesPerMonth,
      });

      return NextResponse.json(
        {
          error: 'PLAN_LIMIT_EXCEEDED',
          message: `You've reached the maximum number of games (${limits.maxGamesPerMonth}) for your ${workspace.plan} plan this month. Upgrade your plan to track more games.`,
          currentPlan: workspace.plan,
          currentCount: workspace.usage.gamesThisMonth,
          limit: limits.maxGamesPerMonth,
        },
        { status: 403 }
      );
    }

    // Create game log with defensive stats (Firestore)
    const game = await createGame(session.user.id, validatedData.playerId, {
      workspaceId: workspace.id,  // Phase 5: Link to workspace
      date: new Date(validatedData.date),
      opponent: validatedData.opponent,
      result: validatedData.result,
      finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
      minutesPlayed: validatedData.minutesPlayed,
      goals: validatedData.goals,
      assists: validatedData.assists,
      tackles: validatedData.tackles ?? null,
      interceptions: validatedData.interceptions ?? null,
      clearances: validatedData.clearances ?? null,
      blocks: validatedData.blocks ?? null,
      aerialDuelsWon: validatedData.aerialDuelsWon ?? null,
      saves: validatedData.saves ?? null,
      goalsAgainst: validatedData.goalsAgainst ?? null,
      cleanSheet: validatedData.cleanSheet ?? null,
    });

    // Phase 5 Task 4: Increment workspace game count
    await incrementGamesThisMonth(workspace.id);

    // Send verification email notification to parent
    try {
      const parentUser = await getUser(session.user.id);

      // Count all unverified games for this user across all players
      const allPlayers = await getPlayers(session.user.id);
      let totalPendingCount = 0;
      for (const p of allPlayers) {
        const unverified = await getUnverifiedGames(session.user.id, p.id);
        totalPendingCount += unverified.length;
      }

      if (parentUser?.email) {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        const verifyUrl = `${baseUrl}/verify?playerId=${encodeURIComponent(validatedData.playerId)}`;

        const emailTemplate = emailTemplates.gameVerificationRequest({
          parentName: parentUser.firstName ?? 'Parent',
          playerName: player.name,
          opponent: validatedData.opponent,
          result: validatedData.result,
          finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
          minutesPlayed: validatedData.minutesPlayed,
          verifyUrl,
          pendingCount: totalPendingCount
        });

        await sendEmail({
          to: parentUser.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text
        });
      }
    } catch (notificationError) {
      console.error('[Game Notification] Failed to send verification email', notificationError);
      // Non-blocking: continue even if email fails
    }

    // Format response to match Prisma structure
    const gameWithPlayer = {
      ...game,
      player: {
        name: player.name,
        position: player.position
      }
    };

    return NextResponse.json({
      success: true,
      game: gameWithPlayer
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({
      error: 'Failed to create game'
    }, { status: 500 });
  }
}
