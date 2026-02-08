'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Loader2,
  Heart,
  Moon,
  Footprints,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Player, BiometricsLog, BiometricsSource } from '@/types/firestore';

interface BiometricsTrends {
  avgRestingHeartRate: number | null;
  avgHrv: number | null;
  avgSleepScore: number | null;
  avgSleepHours: number | null;
  avgSteps: number | null;
  dataPoints: number;
}

const SOURCES: { value: BiometricsSource; label: string }[] = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'garmin', label: 'Garmin' },
  { value: 'fitbit', label: 'Fitbit' },
  { value: 'google_fit', label: 'Google Fit' },
];

export default function DreamGymBiometricsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [logs, setLogs] = useState<BiometricsLog[]>([]);
  const [trends, setTrends] = useState<BiometricsTrends | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    restingHeartRate: '',
    hrv: '',
    sleepScore: '',
    sleepHours: '',
    steps: '',
    activeMinutes: '',
    source: 'manual' as BiometricsSource,
  });

  useEffect(() => {
    async function fetchData() {
      if (!playerId) {
        router.push('/dashboard/dream-gym');
        return;
      }

      try {
        const playerRes = await fetch(`/api/players/${playerId}`);
        if (!playerRes.ok) throw new Error('Player not found');
        const playerData = await playerRes.json();
        setPlayer(playerData.player);

        const biometricsRes = await fetch(
          `/api/players/${playerId}/biometrics?includeTrends=true&limit=30`
        );
        if (biometricsRes.ok) {
          const data = await biometricsRes.json();
          setLogs(data.logs || []);
          setTrends(data.trends);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/dashboard/dream-gym');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId) return;

    setSubmitting(true);
    try {
      const payload = {
        date: formData.date,
        restingHeartRate: formData.restingHeartRate ? Number(formData.restingHeartRate) : null,
        hrv: formData.hrv ? Number(formData.hrv) : null,
        sleepScore: formData.sleepScore ? Number(formData.sleepScore) : null,
        sleepHours: formData.sleepHours ? Number(formData.sleepHours) : null,
        steps: formData.steps ? Number(formData.steps) : null,
        activeMinutes: formData.activeMinutes ? Number(formData.activeMinutes) : null,
        source: formData.source,
      };

      console.log('[BIOMETRICS] Saving payload:', payload);

      const response = await fetch(`/api/players/${playerId}/biometrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('[BIOMETRICS] Save response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save biometrics');
      }

      // Refresh data with cache-busting
      const biometricsRes = await fetch(
        `/api/players/${playerId}/biometrics?includeTrends=true&limit=30&_t=${Date.now()}`
      );
      const data = await biometricsRes.json();
      console.log('[BIOMETRICS] Refresh response:', data);

      if (biometricsRes.ok) {
        setLogs(data.logs || []);
        setTrends(data.trends);
      }

      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        restingHeartRate: '',
        hrv: '',
        sleepScore: '',
        sleepHours: '',
        steps: '',
        activeMinutes: '',
        source: 'manual',
      });
    } catch (error) {
      console.error('Error saving biometrics:', error);
      alert(error instanceof Error ? error.message : 'Failed to save biometrics');
    } finally {
      setSubmitting(false);
    }
  }

  function getTrendIcon(current: number | null, avg: number | null, higherIsBetter = true) {
    if (current === null || avg === null) return null;
    const diff = current - avg;
    const threshold = avg * 0.05; // 5% threshold
    if (Math.abs(diff) < threshold) return <Minus className="h-4 w-4 text-zinc-400" />;
    if ((diff > 0 && higherIsBetter) || (diff < 0 && !higherIsBetter)) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!player) {
    return null;
  }

  const latestLog = logs[0];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/dashboard/dream-gym?playerId=${playerId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dream Gym
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Biometrics</h1>
          <p className="text-zinc-600 mt-2">{player.name}&apos;s health metrics</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-zinc-900 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Log Entry
        </Button>
      </div>

      {/* Log Entry Form */}
      {showForm && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Log Biometrics</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Data Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: BiometricsSource) =>
                      setFormData((prev) => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="restingHeartRate">Resting HR (bpm)</Label>
                  <Input
                    id="restingHeartRate"
                    type="number"
                    min="30"
                    max="220"
                    placeholder="e.g., 65"
                    value={formData.restingHeartRate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, restingHeartRate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hrv">HRV (ms)</Label>
                  <Input
                    id="hrv"
                    type="number"
                    min="0"
                    max="300"
                    placeholder="e.g., 55"
                    value={formData.hrv}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hrv: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepScore">Sleep Score (0-100)</Label>
                  <Input
                    id="sleepScore"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 85"
                    value={formData.sleepScore}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sleepScore: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepHours">Sleep Hours</Label>
                  <Input
                    id="sleepHours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="e.g., 8.5"
                    value={formData.sleepHours}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sleepHours: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="steps">Steps</Label>
                  <Input
                    id="steps"
                    type="number"
                    min="0"
                    max="100000"
                    placeholder="e.g., 8500"
                    value={formData.steps}
                    onChange={(e) => setFormData((prev) => ({ ...prev, steps: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activeMinutes">Active Minutes</Label>
                  <Input
                    id="activeMinutes"
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="e.g., 45"
                    value={formData.activeMinutes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, activeMinutes: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-zinc-900 hover:bg-zinc-800">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Entry'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {trends && trends.dataPoints > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-zinc-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-zinc-600">Resting HR</span>
                </div>
                {getTrendIcon(latestLog?.restingHeartRate ?? null, trends.avgRestingHeartRate, false)}
              </div>
              <p className="text-2xl font-bold mt-2">
                {latestLog?.restingHeartRate ?? trends.avgRestingHeartRate ?? '-'}
                <span className="text-sm font-normal text-zinc-500 ml-1">bpm</span>
              </p>
              {trends.avgRestingHeartRate && (
                <p className="text-xs text-zinc-500 mt-1">Avg: {trends.avgRestingHeartRate} bpm</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <span className="text-sm text-zinc-600">HRV</span>
                </div>
                {getTrendIcon(latestLog?.hrv ?? null, trends.avgHrv, true)}
              </div>
              <p className="text-2xl font-bold mt-2">
                {latestLog?.hrv ?? trends.avgHrv ?? '-'}
                <span className="text-sm font-normal text-zinc-500 ml-1">ms</span>
              </p>
              {trends.avgHrv && <p className="text-xs text-zinc-500 mt-1">Avg: {trends.avgHrv} ms</p>}
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-zinc-600">Sleep</span>
                </div>
                {getTrendIcon(latestLog?.sleepScore ?? null, trends.avgSleepScore, true)}
              </div>
              <p className="text-2xl font-bold mt-2">
                {latestLog?.sleepHours ?? trends.avgSleepHours ?? '-'}
                <span className="text-sm font-normal text-zinc-500 ml-1">hrs</span>
              </p>
              {trends.avgSleepHours && (
                <p className="text-xs text-zinc-500 mt-1">Avg: {trends.avgSleepHours} hrs</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-zinc-600">Steps</span>
                </div>
                {getTrendIcon(latestLog?.steps ?? null, trends.avgSteps, true)}
              </div>
              <p className="text-2xl font-bold mt-2">
                {latestLog?.steps?.toLocaleString() ?? trends.avgSteps?.toLocaleString() ?? '-'}
              </p>
              {trends.avgSteps && (
                <p className="text-xs text-zinc-500 mt-1">Avg: {trends.avgSteps.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Logs */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
              <p>No biometrics logged yet.</p>
              <p className="text-sm mt-1">Start tracking to see your health trends.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-zinc-500 capitalize">
                      {log.source.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-600">
                    {log.restingHeartRate && (
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-400" />
                        {log.restingHeartRate}
                      </span>
                    )}
                    {log.hrv && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-purple-400" />
                        {log.hrv}
                      </span>
                    )}
                    {log.sleepHours && (
                      <span className="flex items-center gap-1">
                        <Moon className="h-4 w-4 text-blue-400" />
                        {log.sleepHours}h
                      </span>
                    )}
                    {log.steps && (
                      <span className="flex items-center gap-1">
                        <Footprints className="h-4 w-4 text-green-400" />
                        {log.steps.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
