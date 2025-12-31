import { getDashboardUser } from '@/lib/firebase/admin-auth';
import { redirect } from 'next/navigation';
import { getPlayersAdmin } from '@/lib/firebase/admin-services/players';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { AthleteCard, AddAthleteCard } from '@/components/athlete-card';
import type { Player } from '@/types/firestore';

// Note: calculateAge, getInitials, getAvatarColor are now used internally by AthleteCard

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
  // Firebase Admin auth check
  const user = await getDashboardUser();

  if (!user || !user.emailVerified) {
    redirect('/login');
  }

  // Fetch all players for the logged-in parent with error handling (Firestore Admin SDK)
  let players: Player[] = [];
  let error: string | null = null;

  try {
    players = await getPlayersAdmin(user.uid);
    // Players from Firestore are already ordered by name asc (see admin-services/players.ts)
    // For createdAt desc ordering, we need to sort here
    players.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
          {players.map((player: Player) => (
            <AthleteCard
              key={player.id}
              athlete={player}
              variant="full"
              href={`/dashboard/athletes/${player.id}`}
            />
          ))}

          {/* Add New Athlete Card */}
          <AddAthleteCard href="/dashboard/add-athlete" />
        </div>
      )}
    </div>
  );
}
