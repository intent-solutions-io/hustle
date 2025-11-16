import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPlayers } from '@/lib/firebase/services/players'
import { getUnverifiedGames } from '@/lib/firebase/services/games'
import { getUser } from '@/lib/firebase/services/users'

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

    // Get all players for authenticated user from Firestore
    const firestorePlayers = await getPlayers(session.user.id);

    // Get user email for parent info
    const parentUser = await getUser(session.user.id);

    // Get pending games count for each player
    const playersWithPending = await Promise.all(
      firestorePlayers.map(async (player) => {
        const unverifiedGames = await getUnverifiedGames(session.user.id, player.id);
        return {
          id: player.id,
          name: player.name,
          birthday: player.birthday,
          position: player.position,
          teamClub: player.teamClub,
          photoUrl: player.photoUrl,
          pendingGames: unverifiedGames.length,
          parentEmail: parentUser?.email ?? null
        };
      })
    );

    return NextResponse.json({ players: playersWithPending })
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({
      error: 'Failed to fetch players'
    }, { status: 500 })
  }
}
