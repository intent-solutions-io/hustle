'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2, Calendar, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import type { Player, DreamGym, DreamGymDayType, DreamGymSchedule } from '@/types/firestore';

const DAY_TYPE_OPTIONS: { value: DreamGymDayType; label: string; color: string }[] = [
  { value: 'off', label: 'Off Day', color: 'bg-gray-100 text-gray-700' },
  { value: 'practice_light', label: 'Light Practice', color: 'bg-green-100 text-green-700' },
  { value: 'practice_medium', label: 'Medium Practice', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'practice_hard', label: 'Hard Practice', color: 'bg-orange-100 text-orange-700' },
  { value: 'game', label: 'Game Day', color: 'bg-red-100 text-red-700' },
  { value: 'tournament', label: 'Tournament', color: 'bg-purple-100 text-purple-700' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export default function DreamGymSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [dreamGym, setDreamGym] = useState<DreamGym | null>(null);
  const [schedule, setSchedule] = useState<DreamGymSchedule>({
    monday: 'off',
    tuesday: 'off',
    wednesday: 'off',
    thursday: 'off',
    friday: 'off',
    saturday: 'off',
    sunday: 'off',
  });
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: '',
    type: 'game' as 'game' | 'tournament' | 'tryout' | 'camp',
    name: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchData() {
      if (!playerId) {
        router.push('/dashboard/dream-gym');
        return;
      }

      try {
        // Fetch player
        const playerRes = await fetch(`/api/players/${playerId}`);
        if (!playerRes.ok) throw new Error('Player not found');
        const playerData = await playerRes.json();
        setPlayer(playerData.player);

        // Fetch Dream Gym
        const dreamGymRes = await fetch(`/api/players/${playerId}/dream-gym`);
        if (dreamGymRes.ok) {
          const data = await dreamGymRes.json();
          if (data.dreamGym) {
            setDreamGym(data.dreamGym);
            setSchedule(data.dreamGym.schedule);
          }
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

  async function handleSaveSchedule() {
    if (!playerId || !dreamGym) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: dreamGym.profile,
          schedule,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEvent() {
    if (!playerId || !newEvent.date || !newEvent.name) return;

    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newEvent.date,
          type: newEvent.type,
          name: newEvent.name,
          notes: newEvent.notes || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to add event');

      // Refresh Dream Gym data
      const dreamGymRes = await fetch(`/api/players/${playerId}/dream-gym`);
      if (dreamGymRes.ok) {
        const data = await dreamGymRes.json();
        setDreamGym(data.dreamGym);
      }

      setShowEventModal(false);
      setNewEvent({ date: '', type: 'game', name: '', notes: '' });
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event');
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (!playerId || !confirm('Delete this event?')) return;

    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Refresh Dream Gym data
      const dreamGymRes = await fetch(`/api/players/${playerId}/dream-gym`);
      if (dreamGymRes.ok) {
        const data = await dreamGymRes.json();
        setDreamGym(data.dreamGym);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  }

  function getDayTypeInfo(type: DreamGymDayType) {
    return DAY_TYPE_OPTIONS.find(o => o.value === type) || DAY_TYPE_OPTIONS[0];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!player || !dreamGym) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/dashboard/dream-gym?playerId=${playerId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dream Gym
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Schedule</h1>
        <p className="text-zinc-600 mt-2">{player.name}&apos;s weekly training schedule</p>
      </div>

      {/* Weekly Schedule */}
      <Card className="border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Weekly Template</CardTitle>
          <Button
            onClick={handleSaveSchedule}
            disabled={saving}
            size="sm"
            className="bg-zinc-900 hover:bg-zinc-800"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const dayInfo = getDayTypeInfo(schedule[day]);
            return (
              <div key={day} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                <span className="font-medium capitalize w-24">{day}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${dayInfo.color}`}>
                    {dayInfo.label}
                  </span>
                  <select
                    value={schedule[day]}
                    onChange={(e) => setSchedule(prev => ({ ...prev, [day]: e.target.value as DreamGymDayType }))}
                    className="px-3 py-1.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  >
                    {DAY_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card className="border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <Button
            onClick={() => setShowEventModal(true)}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {dreamGym.events.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              No upcoming events. Add games, tournaments, or tryouts to plan around.
            </p>
          ) : (
            <div className="space-y-3">
              {dreamGym.events
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-sm text-zinc-500">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        <span className="mx-2">·</span>
                        <span className="capitalize">{event.type}</span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Event</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEventModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="League Finals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as typeof newEvent.type }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="game">Game</option>
                  <option value="tournament">Tournament</option>
                  <option value="tryout">Tryout</option>
                  <option value="camp">Camp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  rows={2}
                  placeholder="Any special notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEventModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEvent}
                  disabled={!newEvent.name || !newEvent.date}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800"
                >
                  Add Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
