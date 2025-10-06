import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

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

    const body = await request.json()
    const {
      playerId,
      date,
      opponent,
      result,
      finalScore,
      minutesPlayed,
      goals,
      assists,
      saves,
      goalsAgainst,
      cleanSheet
    } = body

    // Validation
    if (!playerId || !opponent || !result || !finalScore || minutesPlayed === undefined) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Verify player exists AND belongs to authenticated user
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { parentId: true }
    })

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

    // Create game log
    const game = await prisma.game.create({
      data: {
        playerId,
        date: date ? new Date(date) : new Date(),
        opponent,
        result,
        finalScore,
        minutesPlayed: parseInt(minutesPlayed),
        goals: parseInt(goals) || 0,
        assists: parseInt(assists) || 0,
        saves: saves ? parseInt(saves) : null,
        goalsAgainst: goalsAgainst ? parseInt(goalsAgainst) : null,
        cleanSheet: cleanSheet !== undefined ? cleanSheet : null,
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
    })

    return NextResponse.json({
      success: true,
      game
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({
      error: 'Failed to create game'
    }, { status: 500 })
  }
}
