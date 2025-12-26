'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Dumbbell, Calendar, Brain, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Player, DreamGym } from '@/types/firestore';

export default function DreamGymPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dreamGym, setDreamGym] = useState<DreamGym | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch players
        const playersRes = await fetch('/api/players');
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const { players: fetchedPlayers } = await playersRes.json();
        setPlayers(fetchedPlayers || []);

        // If playerId specified, use that player
        if (playerId && fetchedPlayers?.length > 0) {
          const player = fetchedPlayers.find((p: Player) => p.id === playerId);
          if (player) {
            setSelectedPlayer(player);
            await fetchDreamGym(playerId);
          }
        } else if (fetchedPlayers?.length === 1) {
          // Auto-select single player
          setSelectedPlayer(fetchedPlayers[0]);
          await fetchDreamGym(fetchedPlayers[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId]);

  async function fetchDreamGym(pId: string) {
    try {
      const res = await fetch(`/api/players/${pId}/dream-gym`);
      if (res.ok) {
        const data = await res.json();
        setDreamGym(data.dreamGym);
      }
    } catch (error) {
      console.error('Error fetching Dream Gym:', error);
    }
  }

  function handlePlayerSelect(player: Player) {
    setSelectedPlayer(player);
    setDreamGym(null);
    router.push(`/dashboard/dream-gym?playerId=${player.id}`);
    fetchDreamGym(player.id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // No players yet
  if (players.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Athletes Yet</h2>
            <p className="text-zinc-600 mb-6">Add an athlete to start their Dream Gym training program.</p>
            <Link href="/dashboard/add-athlete">
              <Button className="bg-zinc-900 hover:bg-zinc-800">Add Athlete</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple players, none selected
  if (!selectedPlayer && players.length > 1) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dream Gym</h1>
          <p className="text-zinc-600 mt-2">Select an athlete to view their training program</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <Card
              key={player.id}
              className="border-zinc-200 cursor-pointer hover:border-zinc-400 transition-colors"
              onClick={() => handlePlayerSelect(player)}
            >
              <CardContent className="py-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                  <Dumbbell className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="font-semibold text-zinc-900">{player.name}</h3>
                <p className="text-sm text-zinc-500">{player.primaryPosition}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Player selected - check onboarding status
  const needsOnboarding = !dreamGym?.profile?.onboardingComplete;

  if (needsOnboarding && selectedPlayer) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {players.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {selectedPlayer.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Athlete</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {players.map((player) => (
                  <DropdownMenuItem
                    key={player.id}
                    onClick={() => handlePlayerSelect(player)}
                    className={player.id === selectedPlayer.id ? 'bg-zinc-100' : ''}
                  >
                    {player.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              Set Up {selectedPlayer.name}&apos;s Dream Gym
            </h2>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              Complete a quick onboarding to personalize training based on goals, equipment, and schedule.
            </p>
            <Link href={`/dashboard/dream-gym/onboarding?playerId=${selectedPlayer.id}`}>
              <Button className="bg-zinc-900 hover:bg-zinc-800">Start Onboarding</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Onboarding complete - show main dashboard
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {players.length > 1 && selectedPlayer && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedPlayer.name}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch Athlete</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {players.map((player) => (
                <DropdownMenuItem
                  key={player.id}
                  onClick={() => handlePlayerSelect(player)}
                  className={player.id === selectedPlayer?.id ? 'bg-zinc-100' : ''}
                >
                  {player.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Dream Gym</h1>
        <p className="text-zinc-600 mt-2">{selectedPlayer?.name}&apos;s personalized training hub</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/dashboard/dream-gym/workout?playerId=${selectedPlayer?.id}`}>
          <Card className="border-zinc-200 cursor-pointer hover:border-zinc-400 transition-colors h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Today&apos;s Workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Get your personalized workout based on your schedule and goals.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/dream-gym/schedule?playerId=${selectedPlayer?.id}`}>
          <Card className="border-zinc-200 cursor-pointer hover:border-zinc-400 transition-colors h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Manage practice schedule and upcoming events.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/dream-gym/mental?playerId=${selectedPlayer?.id}`}>
          <Card className="border-zinc-200 cursor-pointer hover:border-zinc-400 transition-colors h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Mental Game
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Daily check-ins and mental performance tips.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Profile Summary */}
      {dreamGym?.profile && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="text-lg">Training Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-zinc-500">Gym Access</p>
              <p className="font-medium">{dreamGym.profile.hasGymAccess ? 'Yes' : 'Home Only'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Intensity</p>
              <p className="font-medium capitalize">{dreamGym.profile.intensity.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Goals</p>
              <p className="font-medium capitalize">
                {dreamGym.profile.goals.slice(0, 2).map(g => g.replace('_', ' ')).join(', ')}
                {dreamGym.profile.goals.length > 2 && ` +${dreamGym.profile.goals.length - 2}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Position</p>
              <p className="font-medium">{dreamGym.profile.position}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
