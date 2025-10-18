import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { gameSchema } from '@/lib/validations/game-schema'
import { sendEmail } from '@/lib/email'
import { emailTemplates } from '@/lib/email-templates'

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

    // Verify player belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { parentId: true }
    });

    if (!player) {
      return NextResponse.json({
        error: 'Player not found'
      }, { status: 404 })
    }

    if (player.parentId !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 })
    }

    const games = await prisma.game.findMany({
      where: { playerId },
      orderBy: { date: 'desc' },
      include: {
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json({ games })
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

    // Verify player exists AND belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: validatedData.playerId },
      select: {
        parentId: true,
        position: true,
        name: true
      }
    });

    if (!player) {
      return NextResponse.json({
        error: 'Player not found'
      }, { status: 404 });
    }

    if (player.parentId !== session.user.id) {
      return NextResponse.json({
        error: 'Forbidden - Not your player'
      }, { status: 403 });
    }

    // Create game log with defensive stats
    const game = await prisma.game.create({
      data: {
        playerId: validatedData.playerId,
        date: new Date(validatedData.date),
        opponent: validatedData.opponent,
        result: validatedData.result,
        finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
        minutesPlayed: validatedData.minutesPlayed,
        goals: validatedData.goals,
        assists: validatedData.assists ?? undefined,
        tackles: validatedData.tackles ?? undefined,
        interceptions: validatedData.interceptions ?? undefined,
        clearances: validatedData.clearances ?? undefined,
        blocks: validatedData.blocks ?? undefined,
        aerialDuelsWon: validatedData.aerialDuelsWon ?? undefined,
        saves: validatedData.saves ?? undefined,
        goalsAgainst: validatedData.goalsAgainst ?? undefined,
        cleanSheet: validatedData.cleanSheet ?? undefined,
        verified: false
      },
      include: {
        player: {
          select: {
            name: true,
            position: true
          }
        }
      }
    });

    // Send verification email notification to parent
    try {
      const parentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { firstName: true, email: true }
      });

      const pendingCount = await prisma.game.count({
        where: {
          player: {
            parentId: session.user.id
          },
          verified: false
        }
      });

      if (parentUser?.email) {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:4000';

        const verifyUrl = `${baseUrl}/verify?playerId=${encodeURIComponent(validatedData.playerId)}`;

        const emailTemplate = emailTemplates.gameVerificationRequest({
          parentName: parentUser.firstName ?? 'Parent',
          playerName: player?.name ?? 'Your athlete',
          opponent: validatedData.opponent,
          result: validatedData.result,
          finalScore: `${validatedData.yourScore}-${validatedData.opponentScore}`,
          minutesPlayed: validatedData.minutesPlayed,
          verifyUrl,
          pendingCount
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

    return NextResponse.json({
      success: true,
      game
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({
      error: 'Failed to create game'
    }, { status: 500 });
  }
}
