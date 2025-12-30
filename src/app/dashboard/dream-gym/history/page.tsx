'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, History, Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { WorkoutHistoryList } from '@/components/dream-gym/WorkoutHistoryList';
import { WorkoutStatsCards } from '@/components/dream-gym/WorkoutStatsCards';
import type { WorkoutLog } from '@/types/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function WorkoutHistoryPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    fetchWorkoutLogs();
  }, [playerId, typeFilter]);

  async function fetchWorkoutLogs(cursor?: string) {
    if (!playerId) return;

    try {
      if (!cursor) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const res = await fetch(`/api/players/${playerId}/dream-gym/workout-logs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch workout logs');

      const data = await res.json();

      if (cursor) {
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        setLogs(data.logs);
      }
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  if (!playerId) {
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
            <p className="text-zinc-600">Please select an athlete first.</p>
            <Link href="/dashboard/dream-gym">
              <Button className="mt-4">Go to Dream Gym</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/dream-gym?playerId=${playerId}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dream Gym
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
            <History className="h-8 w-8" />
            Workout History
          </h1>
        </div>
        <Link href={`/dashboard/dream-gym/workout?playerId=${playerId}`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Log Workout
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      {logs.length > 0 && <WorkoutStatsCards workouts={logs} />}

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-600">Filter by type:</span>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="conditioning">Conditioning</SelectItem>
            <SelectItem value="core">Core</SelectItem>
            <SelectItem value="recovery">Recovery</SelectItem>
            <SelectItem value="soccer_specific">Soccer Specific</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workout List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">No Workouts Yet</h2>
            <p className="text-zinc-600 mb-6">Complete your first workout to start tracking progress.</p>
            <Link href={`/dashboard/dream-gym/workout?playerId=${playerId}`}>
              <Button>Start a Workout</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <WorkoutHistoryList workouts={logs} />

          {nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchWorkoutLogs(nextCursor)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
