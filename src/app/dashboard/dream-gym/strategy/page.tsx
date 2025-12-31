'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import type { Player } from '@/types/firestore';
import { AIStrategyCard } from '@/components/dream-gym/AIStrategyCard';

interface WorkoutStrategy {
  weeklyPlan: {
    summary: string;
    days: {
      dayOfWeek: string;
      workoutType: 'strength' | 'conditioning' | 'recovery' | 'rest' | 'game_day';
      focus: string;
      duration: number;
      exercises?: {
        name: string;
        sets: number;
        reps: string;
        notes?: string;
      }[];
    }[];
  };
  recoveryRecommendation: {
    status: 'optimal' | 'moderate' | 'needs_rest' | 'overtraining_risk';
    message: string;
    recommendations: string[];
  };
  progressionSuggestions: {
    exerciseName: string;
    currentLevel: string;
    suggestion: string;
    reason: string;
  }[];
  insights: string[];
  generatedAt: Date;
}

export default function DreamGymStrategyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [strategy, setStrategy] = useState<WorkoutStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err) {
        console.error('Error fetching data:', err);
        router.push('/dashboard/dream-gym');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId, router]);

  async function generateStrategy() {
    if (!playerId) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/players/${playerId}/dream-gym/ai-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate strategy');
      }

      const data = await response.json();
      setStrategy(data.strategy);
    } catch (err) {
      console.error('Error generating strategy:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy');
    } finally {
      setGenerating(false);
    }
  }

  function getRecoveryStatusColor(status: string) {
    switch (status) {
      case 'optimal':
        return 'text-green-600 bg-green-50';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50';
      case 'needs_rest':
        return 'text-orange-600 bg-orange-50';
      case 'overtraining_risk':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-zinc-600 bg-zinc-50';
    }
  }

  function getRecoveryIcon(status: string) {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="h-5 w-5" />;
      case 'moderate':
        return <Activity className="h-5 w-5" />;
      case 'needs_rest':
      case 'overtraining_risk':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  }

  function getWorkoutTypeColor(type: string) {
    switch (type) {
      case 'strength':
        return 'bg-blue-100 text-blue-700';
      case 'conditioning':
        return 'bg-purple-100 text-purple-700';
      case 'recovery':
        return 'bg-green-100 text-green-700';
      case 'rest':
        return 'bg-zinc-100 text-zinc-700';
      case 'game_day':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
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
          <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AI Strategy
          </h1>
          <p className="text-zinc-600 mt-2">
            Personalized workout plan for {player.name}
          </p>
        </div>
        <Button
          onClick={generateStrategy}
          disabled={generating}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generating ? 'Generating...' : strategy ? 'Regenerate' : 'Generate Strategy'}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {!strategy && !generating && !error && (
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-purple-300 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              Generate Your AI Workout Strategy
            </h2>
            <p className="text-zinc-600 mb-6 max-w-md mx-auto">
              Our AI analyzes your workout history, biometrics, and goals to create a
              personalized weekly training plan.
            </p>
            <Button
              onClick={generateStrategy}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Generate Strategy
            </Button>
          </CardContent>
        </Card>
      )}

      {strategy && (
        <>
          {/* Weekly Plan */}
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Plan
              </CardTitle>
              <p className="text-sm text-zinc-600">{strategy.weeklyPlan.summary}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {strategy.weeklyPlan.days.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 bg-zinc-50 rounded-lg"
                  >
                    <div className="w-24 flex-shrink-0">
                      <p className="font-medium">{day.dayOfWeek}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getWorkoutTypeColor(
                          day.workoutType
                        )}`}
                      >
                        {day.workoutType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900">{day.focus}</p>
                      {day.duration > 0 && (
                        <p className="text-sm text-zinc-500">{day.duration} min</p>
                      )}
                      {day.exercises && day.exercises.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {day.exercises.map((exercise, i) => (
                            <li key={i} className="text-sm text-zinc-600">
                              {exercise.name}: {exercise.sets} x {exercise.reps}
                              {exercise.notes && (
                                <span className="text-zinc-400 ml-1">
                                  ({exercise.notes})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recovery Status */}
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recovery Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${getRecoveryStatusColor(
                  strategy.recoveryRecommendation.status
                )}`}
              >
                {getRecoveryIcon(strategy.recoveryRecommendation.status)}
                <div>
                  <p className="font-medium capitalize">
                    {strategy.recoveryRecommendation.status.replace('_', ' ')}
                  </p>
                  <p className="text-sm opacity-80">
                    {strategy.recoveryRecommendation.message}
                  </p>
                </div>
              </div>
              {strategy.recoveryRecommendation.recommendations.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {strategy.recoveryRecommendation.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Progression Suggestions */}
          {strategy.progressionSuggestions.length > 0 && (
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progression Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategy.progressionSuggestions.map((suggestion, i) => (
                    <div key={i} className="p-4 bg-zinc-50 rounded-lg">
                      <p className="font-medium text-zinc-900">{suggestion.exerciseName}</p>
                      <p className="text-sm text-zinc-500 mt-1">
                        Current: {suggestion.currentLevel}
                      </p>
                      <p className="text-sm text-purple-600 mt-2 font-medium">
                        {suggestion.suggestion}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {strategy.insights.length > 0 && (
            <Card className="border-zinc-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {strategy.insights.map((insight, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg text-purple-800"
                    >
                      <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Generated timestamp */}
          <p className="text-xs text-zinc-400 text-center">
            Generated {new Date(strategy.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
