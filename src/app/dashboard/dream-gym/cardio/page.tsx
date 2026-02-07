'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Timer, Route, Flame, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Player, CardioLog, CardioActivityType } from '@/types/firestore';

const ACTIVITY_TYPES: { value: CardioActivityType; label: string }[] = [
  { value: 'run', label: 'Run' },
  { value: 'jog', label: 'Jog' },
  { value: 'sprint', label: 'Sprint Training' },
  { value: 'interval', label: 'Interval Training' },
  { value: 'recovery', label: 'Recovery Run' },
  { value: 'long_run', label: 'Long Run' },
];

const EFFORT_LEVELS = [
  { value: 1, label: '1 - Very Easy' },
  { value: 2, label: '2 - Easy' },
  { value: 3, label: '3 - Moderate' },
  { value: 4, label: '4 - Hard' },
  { value: 5, label: '5 - Very Hard' },
];

export default function CardioLogPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityType: 'run' as CardioActivityType,
    distanceMiles: '',
    durationMinutes: '',
    location: '',
    weather: '',
    notes: '',
    perceivedEffort: '',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const playersRes = await fetch('/api/players');
        if (!playersRes.ok) throw new Error('Failed to fetch players');
        const { players: fetchedPlayers } = await playersRes.json();

        if (playerId && fetchedPlayers?.length > 0) {
          const player = fetchedPlayers.find((p: Player) => p.id === playerId);
          if (player) {
            setSelectedPlayer(player);
            await fetchLogs(playerId);
          }
        } else if (fetchedPlayers?.length === 1) {
          setSelectedPlayer(fetchedPlayers[0]);
          await fetchLogs(fetchedPlayers[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId]);

  async function fetchLogs(pId: string) {
    try {
      const res = await fetch(`/api/players/${pId}/cardio-logs?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching cardio logs:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/players/${selectedPlayer.id}/cardio-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          activityType: formData.activityType,
          distanceMiles: parseFloat(formData.distanceMiles),
          durationMinutes: parseInt(formData.durationMinutes),
          location: formData.location || null,
          weather: formData.weather || null,
          notes: formData.notes || null,
          perceivedEffort: formData.perceivedEffort ? parseInt(formData.perceivedEffort) : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      // Reset form and refresh logs
      setFormData({
        date: new Date().toISOString().split('T')[0],
        activityType: 'run',
        distanceMiles: '',
        durationMinutes: '',
        location: '',
        weather: '',
        notes: '',
        perceivedEffort: '',
      });
      setShowForm(false);
      await fetchLogs(selectedPlayer.id);
    } catch (error) {
      console.error('Error saving cardio log:', error);
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logId: string) {
    if (!selectedPlayer || !confirm('Delete this cardio log?')) return;

    try {
      const res = await fetch(`/api/players/${selectedPlayer.id}/cardio-logs/${logId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setLogs(logs.filter(l => l.id !== logId));
      }
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  }

  // Calculate stats
  const totalMiles = logs.reduce((sum, log) => sum + log.distanceMiles, 0);
  const totalRuns = logs.length;
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!selectedPlayer) {
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
            <p className="text-zinc-600">Select an athlete from Dream Gym first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/dashboard/dream-gym?playerId=${selectedPlayer.id}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dream Gym
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Cardio Log</h1>
          <p className="text-zinc-600 mt-1">Track {selectedPlayer.name}&apos;s running and cardio activities</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Run
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Route className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalMiles.toFixed(1)}</p>
                <p className="text-sm text-zinc-500">Total Miles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalRuns}</p>
                <p className="text-sm text-zinc-500">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(totalMinutes / 60)}</p>
                <p className="text-sm text-zinc-500">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Log a Run</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) => setFormData({ ...formData, activityType: value as CardioActivityType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="distance">Distance (miles)</Label>
                  <Input
                    id="distance"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 2.5"
                    value={formData.distanceMiles}
                    onChange={(e) => setFormData({ ...formData, distanceMiles: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="e.g., 25"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Track, Park"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weather">Weather (optional)</Label>
                  <Input
                    id="weather"
                    placeholder="e.g., Sunny, 70°F"
                    value={formData.weather}
                    onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effort">Effort Level (optional)</Label>
                  <Select
                    value={formData.perceivedEffort}
                    onValueChange={(value) => setFormData({ ...formData, perceivedEffort: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                    <SelectContent>
                      {EFFORT_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How did it feel? Any observations?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Run'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Log History */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No runs logged yet. Click &quot;Log Run&quot; to get started!</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {log.distanceMiles.toFixed(2)} mi
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-600">{log.durationMinutes} min</span>
                      {log.avgPacePerMile && (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-600">{log.avgPacePerMile}/mi pace</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                      <span>{new Date(log.date).toLocaleDateString()}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="capitalize">{log.activityType.replace('_', ' ')}</span>
                      {log.location && (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span>{log.location}</span>
                        </>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-sm text-zinc-600 mt-2">{log.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-red-500"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
