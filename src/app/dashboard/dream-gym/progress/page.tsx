'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, ChevronDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkoutProgressChart } from '@/components/dream-gym/WorkoutProgressChart';
import { ExerciseProgressChart } from '@/components/dream-gym/ExerciseProgressChart';
import { WorkoutStatsCards } from '@/components/dream-gym/WorkoutStatsCards';
import type { Player, WorkoutLog } from '@/types/firestore';

export default function ProgressPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

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
            await fetchWorkoutLogs(playerId);
          }
        } else if (fetchedPlayers?.length === 1) {
          // Auto-select single player
          setSelectedPlayer(fetchedPlayers[0]);
          await fetchWorkoutLogs(fetchedPlayers[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId]);

  async function fetchWorkoutLogs(pId: string) {
    try {
      const res = await fetch(`/api/players/${pId}/dream-gym/workout-logs`);
      if (res.ok) {
        const data = await res.json();
        setWorkoutLogs(data.workoutLogs || []);
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  }

  function handlePlayerSelect(player: Player) {
    setSelectedPlayer(player);
    setWorkoutLogs([]);
    router.push(`/dashboard/dream-gym/progress?playerId=${player.id}`);
    fetchWorkoutLogs(player.id);
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
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dream Gym
        </Link>

        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Athletes Yet</h2>
            <p className="text-zinc-600 mb-6">Add an athlete to track their progress.</p>
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
          href="/dashboard/dream-gym"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dream Gym
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Progress Tracking</h1>
          <p className="text-zinc-600 mt-2">Select an athlete to view their progress</p>
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
                  <TrendingUp className="h-8 w-8 text-zinc-600" />
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

  // Player selected - show progress
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/dream-gym?playerId=${selectedPlayer?.id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dream Gym
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

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Progress Tracking</h1>
        <p className="text-zinc-600 mt-2">
          {selectedPlayer?.name}&apos;s workout history and progress analytics
        </p>
      </div>

      {/* Stats Cards */}
      <WorkoutStatsCards workouts={workoutLogs} />

      {/* Charts */}
      {workoutLogs.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <WorkoutProgressChart workouts={workoutLogs} />
          <ExerciseProgressChart workouts={workoutLogs} />
        </div>
      ) : (
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Workout Data Yet</h2>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              Complete workouts to start tracking your progress. Charts will appear here once you have logged at least one workout.
            </p>
            <Link href={`/dashboard/dream-gym/workout?playerId=${selectedPlayer?.id}`}>
              <Button className="bg-zinc-900 hover:bg-zinc-800">Start a Workout</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
