import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { gameSchema } from '@/lib/validations/game-schema'
import { sendEmail } from '@/lib/email'
import { emailTemplates } from '@/lib/email-templates'
import { getPlayer, getPlayers } from '@/lib/firebase/services/players'
import { getGames, createGame, getUnverifiedGames } from '@/lib/firebase/services/games'
import { getUser } from '@/lib/firebase/services/users'

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

    // Create game log with defensive stats (Firestore)
    const game = await createGame(session.user.id, validatedData.playerId, {
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
