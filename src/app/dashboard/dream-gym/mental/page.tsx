'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Brain, Heart, Star, Zap, Battery, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { Player, DreamGym, DreamGymMentalCheckInClient } from '@/types/firestore';

const MENTAL_TIPS = [
  {
    id: 'tip1',
    title: 'Pre-Game Visualization',
    content: 'Spend 5 minutes before each game visualizing yourself making successful plays. See the ball, feel your movements, hear the crowd.',
  },
  {
    id: 'tip2',
    title: 'Bounce-Back Breathing',
    content: 'When things go wrong, take 3 deep breaths: 4 seconds in, hold 4, out 4. This resets your nervous system and clears your mind.',
  },
  {
    id: 'tip3',
    title: 'Focus on the Next Play',
    content: 'Champions have short memories. Whether you just scored or made a mistake, the only play that matters is the next one.',
  },
  {
    id: 'tip4',
    title: 'Positive Self-Talk',
    content: 'Replace "I can\'t" with "I\'m learning to." Your brain believes what you tell it. Be your own biggest supporter.',
  },
  {
    id: 'tip5',
    title: 'Control the Controllables',
    content: 'You can\'t control the ref, the weather, or your opponents. Focus on your effort, attitude, and preparation.',
  },
  {
    id: 'tip6',
    title: 'Celebrate Small Wins',
    content: 'Every good pass, tackle won, or smart run is a victory. Acknowledge your progress to build confidence.',
  },
];

const MOOD_EMOJIS = ['😫', '😕', '😐', '🙂', '😄'];

export default function DreamGymMentalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [dreamGym, setDreamGym] = useState<DreamGym | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkIn, setCheckIn] = useState({
    mood: 3 as 1 | 2 | 3 | 4 | 5,
    energy: 'ok' as 'low' | 'ok' | 'high',
    soreness: 'low' as 'low' | 'medium' | 'high',
    stress: 'low' as 'low' | 'medium' | 'high',
    notes: '',
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

        const dreamGymRes = await fetch(`/api/players/${playerId}/dream-gym`);
        if (dreamGymRes.ok) {
          const data = await dreamGymRes.json();
          setDreamGym(data.dreamGym);
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

  async function handleCheckIn() {
    if (!playerId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn),
      });

      if (!response.ok) throw new Error('Failed to save check-in');

      // Refresh Dream Gym data
      const dreamGymRes = await fetch(`/api/players/${playerId}/dream-gym`);
      if (dreamGymRes.ok) {
        const data = await dreamGymRes.json();
        setDreamGym(data.dreamGym);
      }

      setShowCheckIn(false);
      setCheckIn({
        mood: 3,
        energy: 'ok',
        soreness: 'low',
        stress: 'low',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving check-in:', error);
      alert('Failed to save check-in');
    } finally {
      setSubmitting(false);
    }
  }

  function getRecentCheckIns(): DreamGymMentalCheckInClient[] {
    if (!dreamGym?.mental?.checkIns) return [];
    return dreamGym.mental.checkIns.slice(-7).reverse();
  }

  function getMoodTrend() {
    const checkIns = getRecentCheckIns();
    if (checkIns.length < 2) return null;

    const recent = checkIns.slice(0, 3).reduce((sum, c) => sum + c.mood, 0) / Math.min(3, checkIns.length);
    const older = checkIns.slice(-3).reduce((sum, c) => sum + c.mood, 0) / Math.min(3, checkIns.length);

    if (recent > older + 0.5) return 'up';
    if (recent < older - 0.5) return 'down';
    return 'stable';
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

  const recentCheckIns = getRecentCheckIns();
  const moodTrend = getMoodTrend();
  const todayCheckedIn = recentCheckIns.length > 0 &&
    new Date(recentCheckIns[0].date).toDateString() === new Date().toDateString();

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
        <h1 className="text-3xl font-bold text-zinc-900">Mental Game</h1>
        <p className="text-zinc-600 mt-2">{player.name}&apos;s mental performance tracker</p>
      </div>

      {/* Daily Check-in Card */}
      <Card className={`border-zinc-200 ${todayCheckedIn ? 'bg-green-50 border-green-200' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Daily Check-in
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayCheckedIn ? (
            <div className="text-center py-4">
              <p className="text-green-700 font-medium">Already checked in today!</p>
              <p className="text-sm text-green-600 mt-1">
                Mood: {MOOD_EMOJIS[recentCheckIns[0].mood - 1]}
              </p>
            </div>
          ) : showCheckIn ? (
            <div className="space-y-4">
              {/* Mood */}
              <div>
                <label className="block text-sm font-medium mb-2">How are you feeling?</label>
                <div className="flex justify-between">
                  {MOOD_EMOJIS.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setCheckIn(prev => ({ ...prev, mood: (i + 1) as 1 | 2 | 3 | 4 | 5 }))}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        checkIn.mood === i + 1 ? 'bg-zinc-200 scale-110' : 'hover:bg-zinc-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <label className="block text-sm font-medium mb-2">Energy Level</label>
                <div className="flex gap-2">
                  {(['low', 'ok', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={checkIn.energy === level ? 'default' : 'outline'}
                      onClick={() => setCheckIn(prev => ({ ...prev, energy: level }))}
                      className={checkIn.energy === level ? 'bg-zinc-900' : ''}
                    >
                      {level === 'low' && <Battery className="h-4 w-4 mr-1" />}
                      {level === 'ok' && <Battery className="h-4 w-4 mr-1" />}
                      {level === 'high' && <Zap className="h-4 w-4 mr-1" />}
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Soreness */}
              <div>
                <label className="block text-sm font-medium mb-2">Body Soreness</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={checkIn.soreness === level ? 'default' : 'outline'}
                      onClick={() => setCheckIn(prev => ({ ...prev, soreness: level }))}
                      className={checkIn.soreness === level ? 'bg-zinc-900' : ''}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stress */}
              <div>
                <label className="block text-sm font-medium mb-2">Stress Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={checkIn.stress === level ? 'default' : 'outline'}
                      onClick={() => setCheckIn(prev => ({ ...prev, stress: level }))}
                      className={checkIn.stress === level ? 'bg-zinc-900' : ''}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={checkIn.notes}
                  onChange={(e) => setCheckIn(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  rows={2}
                  placeholder="Anything on your mind?"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCheckIn(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={submitting}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Check-in'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowCheckIn(true)}
              className="w-full bg-zinc-900 hover:bg-zinc-800"
            >
              Start Check-in
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Mood History */}
      {recentCheckIns.length > 0 && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Recent Mood
              </span>
              {moodTrend && (
                <span className={`text-sm px-2 py-1 rounded ${
                  moodTrend === 'up' ? 'bg-green-100 text-green-700' :
                  moodTrend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-zinc-100 text-zinc-700'
                }`}>
                  {moodTrend === 'up' ? 'Trending Up' : moodTrend === 'down' ? 'Trending Down' : 'Stable'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end gap-2 h-20">
              {recentCheckIns.map((checkIn, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-zinc-900 rounded-t"
                    style={{ height: `${(checkIn.mood / 5) * 100}%` }}
                  />
                  <span className="text-xs text-zinc-500">
                    {new Date(checkIn.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mental Tips */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Mental Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MENTAL_TIPS.map((tip) => (
            <div
              key={tip.id}
              className="p-4 bg-zinc-50 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{tip.title}</h3>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600">{tip.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
