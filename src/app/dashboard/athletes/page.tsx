import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { calculateAge, getInitials, getAvatarColor } from '@/lib/player-utils';
import type { Prisma } from '@prisma/client';

/**
 * Type representing a Player from the database
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Player = Prisma.PlayerGetPayload<{}>;

/**
 * Athletes List Page
 *
 * Displays all athletes (players) for the authenticated parent user.
 * Features:
 * - Grid layout of athlete cards with avatar, name, position, age, and team
 * - Empty state with call-to-action for first athlete
 * - Add new athlete card in grid
 * - Server-side authentication check
 * - Links to individual athlete detail pages
 *
 * @returns Server component rendering athlete list
 */
export default async function AthletesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch all players for the logged-in parent with error handling
  let players: Player[] = [];
  let error: string | null = null;

  try {
    players = await prisma.player.findMany({
      where: { parentId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err) {
    console.error('Error fetching players:', err);
    error = 'Unable to load athletes. Please try again later.';
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Athletes</h1>
          <p className="text-zinc-600 mt-2">
            Manage your athletes and their performance
          </p>
        </div>
        <Link href="/dashboard/add-athlete">
          <Button className="bg-zinc-900 hover:bg-zinc-800">
            <Plus className="mr-2 h-4 w-4" />
            Add Athlete
          </Button>
        </Link>
      </div>

      {/* Error State */}
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Error Loading Athletes
            </h3>
            <p className="text-sm text-red-700 mb-6 max-w-sm">
              {error}
            </p>
            <Link href="/dashboard/athletes">
              <Button className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        /* Empty State */
        <Card className="border-zinc-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">⚽</div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              No athletes yet
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-sm">
              Get started by adding your first athlete profile to begin tracking their performance
            </p>
            <Link href="/dashboard/add-athlete">
              <Button className="bg-zinc-900 hover:bg-zinc-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Athlete
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Athletes Grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player: Player) => {
            const age: number = calculateAge(player.birthday);
            const initials: string = getInitials(player.name);
            const avatarColor: string = getAvatarColor(player.name);

            return (
              <Link key={player.id} href={`/dashboard/athletes/${player.id}`}>
                <Card className="border-zinc-200 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className={`w-20 h-20 rounded-full ${avatarColor} flex items-center justify-center text-xl font-semibold mb-4`}>
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={`${player.name}'s avatar`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-lg font-semibold text-zinc-900 mb-1 truncate w-full">
                      {player.name}
                    </h3>

                    {/* Position & Age */}
                    <p className="text-sm text-zinc-600 mb-2">
                      {player.position} • Age {age}
                    </p>

                    {/* Team/Club */}
                    <p className="text-xs text-zinc-500 truncate w-full">
                      {player.teamClub}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Add New Athlete Card */}
          <Link href="/dashboard/add-athlete">
            <Card className="border-zinc-200 border-dashed border-2 hover:border-zinc-400 hover:bg-zinc-50 transition-all cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center min-h-[232px]">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-sm font-medium text-zinc-600">
                  Add New Athlete
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
