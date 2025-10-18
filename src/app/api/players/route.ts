import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/players - Get all players for authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only return players belonging to authenticated user
    const rawPlayers = await prisma.player.findMany({
      where: {
        parentId: session.user.id
      },
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: {
            email: true
          }
        },
        games: {
          where: {
            verified: false
          },
          select: {
            id: true
          }
        },
        games: {
          where: {
            verified: false
          },
          select: {
            id: true
          }
        }
      }
    })

    const players = rawPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      birthday: player.birthday,
      position: player.position,
      teamClub: player.teamClub,
      photoUrl: player.photoUrl,
      pendingGames: player.games.length,
      parentEmail: player.parent?.email ?? null
    }))

    return NextResponse.json({ players })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({
      error: 'Failed to fetch players'
    }, { status: 500 })
  }
}
