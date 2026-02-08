'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Brain, Heart, Star, Zap, Battery, ChevronDown, ChevronUp, Eye, Wind, Target, MessageCircle, Settings, Trophy } from 'lucide-react';
import Link from 'next/link';
import type { Player, DreamGym, DreamGymMentalCheckInClient } from '@/types/firestore';

const MENTAL_TIPS = [
  {
    id: 'tip1',
    title: 'Pre-Game Visualization',
    icon: Eye,
    summary: 'See your success before it happens',
    content: 'Spend 5 minutes before each game visualizing yourself making successful plays. See the ball, feel your movements, hear the crowd. Athletes who visualize perform 13% better on average.',
    steps: [
      'Find a quiet spot 10 minutes before warm-up',
      'Close your eyes and take 3 deep breaths',
      'Picture yourself making 3 perfect plays',
      'Feel the emotions of success',
    ],
  },
  {
    id: 'tip2',
    title: 'Bounce-Back Breathing',
    icon: Wind,
    summary: 'Reset your mind in 12 seconds',
    content: 'When things go wrong, take 3 deep breaths: 4 seconds in, hold 4, out 4. This resets your nervous system and clears your mind. Used by elite athletes worldwide.',
    steps: [
      'Breathe in through your nose for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly through your mouth for 4 seconds',
      'Repeat 3 times, then refocus',
    ],
  },
  {
    id: 'tip3',
    title: 'Focus on the Next Play',
    icon: Target,
    summary: 'Champions have short memories',
    content: 'Whether you just scored or made a mistake, the only play that matters is the next one. Dwelling on the past steals energy from the present.',
    steps: [
      'Acknowledge what happened (1 second)',
      'Say "next play" out loud or in your head',
      'Reset your body posture - stand tall',
      'Lock eyes on where you need to be',
    ],
  },
  {
    id: 'tip4',
    title: 'Positive Self-Talk',
    icon: MessageCircle,
    summary: 'Be your own biggest supporter',
    content: 'Replace "I can\'t" with "I\'m learning to." Your brain believes what you tell it. Studies show positive self-talk improves performance by up to 25%.',
    steps: [
      'Notice negative thoughts when they come',
      'Challenge them: "Is this really true?"',
      'Replace with a positive statement',
      'Use "I am" statements: "I am getting better"',
    ],
  },
  {
    id: 'tip5',
    title: 'Control the Controllables',
    icon: Settings,
    summary: 'Focus your energy where it matters',
    content: 'You can\'t control the ref, the weather, or your opponents. Focus on your effort, attitude, and preparation - the things within your power.',
    steps: [
      'List what you CAN control today',
      'Let go of what you cannot change',
      'Put 100% effort into your controllables',
      'Review after: did you control what you could?',
    ],
  },
  {
    id: 'tip6',
    title: 'Celebrate Small Wins',
    icon: Trophy,
    summary: 'Build confidence through recognition',
    content: 'Every good pass, tackle won, or smart run is a victory. Acknowledging your progress builds confidence and motivation for bigger achievements.',
    steps: [
      'Set 3 mini-goals before each game/practice',
      'Notice when you achieve them',
      'Give yourself a small celebration (fist pump)',
      'Write down 3 wins after each session',
    ],
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
  const [expandedTip, setExpandedTip] = useState<string | null>(null);
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
        <Card className="border-zinc-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Recent Mood
              </span>
              {moodTrend && (
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  moodTrend === 'up' ? 'bg-green-100 text-green-700' :
                  moodTrend === 'down' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {moodTrend === 'up' ? 'Trending Up' : moodTrend === 'down' ? 'Trending Down' : 'Stable'}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-end gap-3 h-32">
              {recentCheckIns.map((checkInItem, i) => {
                const moodColors = [
                  'from-red-400 to-red-500',      // 1 - bad
                  'from-orange-400 to-orange-500', // 2 - not great
                  'from-yellow-400 to-yellow-500', // 3 - okay
                  'from-lime-400 to-lime-500',     // 4 - good
                  'from-green-400 to-green-500',   // 5 - great
                ];
                const moodColor = moodColors[checkInItem.mood - 1];
                const isToday = new Date(checkInItem.date).toDateString() === new Date().toDateString();

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-2xl">{MOOD_EMOJIS[checkInItem.mood - 1]}</span>
                    <div className="w-full h-16 bg-zinc-100 rounded-lg relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 w-full bg-gradient-to-t ${moodColor} rounded-lg transition-all duration-500`}
                        style={{ height: `${(checkInItem.mood / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-purple-600' : 'text-zinc-500'}`}>
                      {isToday ? 'Today' : new Date(checkInItem.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Average mood indicator */}
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-center gap-2">
              <span className="text-sm text-zinc-500">7-day average:</span>
              <span className="text-lg">
                {MOOD_EMOJIS[Math.round(recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length) - 1]}
              </span>
              <span className="text-sm font-medium text-zinc-700">
                {(recentCheckIns.reduce((sum, c) => sum + c.mood, 0) / recentCheckIns.length).toFixed(1)} / 5
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mental Tips */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Mental Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {MENTAL_TIPS.map((tip) => {
            const isExpanded = expandedTip === tip.id;
            const IconComponent = tip.icon;

            return (
              <div
                key={tip.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? 'bg-gradient-to-br from-zinc-50 to-zinc-100 border-zinc-300 shadow-sm'
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div className={`p-2 rounded-lg ${isExpanded ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900">{tip.title}</h3>
                    <p className="text-sm text-zinc-500">{tip.summary}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-zinc-700 leading-relaxed">{tip.content}</p>

                    <div className="bg-white rounded-lg p-4 border border-zinc-200">
                      <h4 className="font-medium text-zinc-900 mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        How to Practice
                      </h4>
                      <ol className="space-y-2">
                        {tip.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="flex-shrink-0 w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                              {i + 1}
                            </span>
                            <span className="text-zinc-600 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
