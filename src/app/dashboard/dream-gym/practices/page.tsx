'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Clock, Target, Calendar, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Player, PracticeLog, PracticeType, PracticeFocusArea } from '@/types/firestore';

const PRACTICE_TYPES: { value: PracticeType; label: string }[] = [
  { value: 'team_practice', label: 'Team Practice' },
  { value: 'small_group', label: 'Small Group Training' },
  { value: 'individual', label: 'Individual Practice' },
  { value: 'private_lesson', label: 'Private Lesson' },
  { value: 'camp', label: 'Soccer Camp' },
  { value: 'clinic', label: 'Skills Clinic' },
];

const FOCUS_AREAS: { value: PracticeFocusArea; label: string }[] = [
  { value: 'passing', label: 'Passing' },
  { value: 'shooting', label: 'Shooting' },
  { value: 'dribbling', label: 'Dribbling' },
  { value: 'defending', label: 'Defending' },
  { value: 'heading', label: 'Heading' },
  { value: 'first_touch', label: 'First Touch' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'set_pieces', label: 'Set Pieces' },
  { value: 'goalkeeping', label: 'Goalkeeping' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'scrimmage', label: 'Scrimmage' },
  { value: 'tactics', label: 'Tactics' },
  { value: 'other', label: 'Other' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: '1 - Light' },
  { value: 2, label: '2 - Easy' },
  { value: 3, label: '3 - Moderate' },
  { value: 4, label: '4 - Intense' },
  { value: 5, label: '5 - Very Intense' },
];

export default function PracticeLogPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    practiceType: 'team_practice' as PracticeType,
    durationMinutes: '',
    focusAreas: [] as PracticeFocusArea[],
    teamName: '',
    location: '',
    intensity: '',
    enjoyment: '',
    improvement: '',
    notes: '',
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
      const res = await fetch(`/api/players/${pId}/practice-logs?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching practice logs:', error);
    }
  }

  function toggleFocusArea(area: PracticeFocusArea) {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) return;
    if (formData.focusAreas.length === 0) {
      alert('Please select at least one focus area');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/players/${selectedPlayer.id}/practice-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          practiceType: formData.practiceType,
          durationMinutes: parseInt(formData.durationMinutes),
          focusAreas: formData.focusAreas,
          teamName: formData.teamName || null,
          location: formData.location || null,
          intensity: formData.intensity ? parseInt(formData.intensity) : null,
          enjoyment: formData.enjoyment ? parseInt(formData.enjoyment) : null,
          improvement: formData.improvement || null,
          notes: formData.notes || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      // Reset form and refresh logs
      setFormData({
        date: new Date().toISOString().split('T')[0],
        practiceType: 'team_practice',
        durationMinutes: '',
        focusAreas: [],
        teamName: '',
        location: '',
        intensity: '',
        enjoyment: '',
        improvement: '',
        notes: '',
      });
      setShowForm(false);
      await fetchLogs(selectedPlayer.id);
    } catch (error) {
      console.error('Error saving practice log:', error);
      alert(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(logId: string) {
    if (!selectedPlayer || !confirm('Delete this practice log?')) return;

    try {
      const res = await fetch(`/api/players/${selectedPlayer.id}/practice-logs/${logId}`, {
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
  const totalPractices = logs.length;
  const totalMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Count focus areas
  const focusAreaCounts: Record<string, number> = {};
  logs.forEach(log => {
    log.focusAreas.forEach(area => {
      focusAreaCounts[area] = (focusAreaCounts[area] || 0) + 1;
    });
  });
  const topFocusArea = Object.entries(focusAreaCounts).sort((a, b) => b[1] - a[1])[0];

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
          <h1 className="text-3xl font-bold text-zinc-900">Practice Log</h1>
          <p className="text-zinc-600 mt-1">Track {selectedPlayer.name}&apos;s practice sessions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Practice
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalPractices}</p>
                <p className="text-sm text-zinc-500">Total Practices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalHours}</p>
                <p className="text-sm text-zinc-500">Total Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold capitalize">
                  {topFocusArea ? topFocusArea[0].replace('_', ' ') : '—'}
                </p>
                <p className="text-sm text-zinc-500">Top Focus Area</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Log a Practice</CardTitle>
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
                  <Label htmlFor="practiceType">Practice Type</Label>
                  <Select
                    value={formData.practiceType}
                    onValueChange={(value) => setFormData({ ...formData, practiceType: value as PracticeType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRACTICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    placeholder="e.g., 90"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team/Coach (optional)</Label>
                  <Input
                    id="teamName"
                    placeholder="e.g., FC United"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Field"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Focus Areas (select at least one)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FOCUS_AREAS.map((area) => (
                    <div key={area.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={area.value}
                        checked={formData.focusAreas.includes(area.value)}
                        onCheckedChange={() => toggleFocusArea(area.value)}
                      />
                      <label
                        htmlFor={area.value}
                        className="text-sm cursor-pointer"
                      >
                        {area.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="intensity">Intensity (optional)</Label>
                  <Select
                    value={formData.intensity}
                    onValueChange={(value) => setFormData({ ...formData, intensity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How intense was it?" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTENSITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enjoyment">Enjoyment (optional)</Label>
                  <Select
                    value={formData.enjoyment}
                    onValueChange={(value) => setFormData({ ...formData, enjoyment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How much fun was it?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Not fun</SelectItem>
                      <SelectItem value="2">2 - Okay</SelectItem>
                      <SelectItem value="3">3 - Good</SelectItem>
                      <SelectItem value="4">4 - Fun</SelectItem>
                      <SelectItem value="5">5 - Loved it!</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvement">What did you improve on? (optional)</Label>
                <Input
                  id="improvement"
                  placeholder="e.g., Left foot passing, communication"
                  value={formData.improvement}
                  onChange={(e) => setFormData({ ...formData, improvement: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any other thoughts about the practice?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Practice'}
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
          <CardTitle>Practice History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No practices logged yet. Click &quot;Log Practice&quot; to get started!</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 bg-zinc-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium capitalize">
                        {log.practiceType.replace('_', ' ')}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-600">{log.durationMinutes} min</span>
                      {log.teamName && (
                        <>
                          <span className="text-zinc-400">•</span>
                          <span className="text-zinc-600">{log.teamName}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">
                      {new Date(log.date).toLocaleDateString()}
                      {log.location && ` • ${log.location}`}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {log.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full capitalize"
                        >
                          {area.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    {log.improvement && (
                      <p className="text-sm text-green-700 mt-2">
                        Improved: {log.improvement}
                      </p>
                    )}
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
