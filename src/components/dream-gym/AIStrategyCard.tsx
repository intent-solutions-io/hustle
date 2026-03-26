'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Loader2,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface RecoveryRecommendation {
  status: 'optimal' | 'moderate' | 'needs_rest' | 'overtraining_risk';
  message: string;
  recommendations: string[];
}

interface ProgressionSuggestion {
  exerciseName: string;
  currentLevel: string;
  suggestion: string;
  reason: string;
}

interface AIStrategyCardProps {
  playerId: string;
  compact?: boolean;
}

export function AIStrategyCard({ playerId, compact = false }: AIStrategyCardProps) {
  const [loading, setLoading] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryRecommendation | null>(null);
  const [progressions, setProgressions] = useState<ProgressionSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchQuickInsights() {
    setLoading(true);
    setError(null);

    try {
      const [recoveryRes, progressionRes] = await Promise.all([
        fetch(`/api/players/${playerId}/dream-gym/ai-strategy?type=recovery`),
        fetch(`/api/players/${playerId}/dream-gym/ai-strategy?type=progressions`),
      ]);

      if (!recoveryRes.ok || !progressionRes.ok) {
        throw new Error('Failed to load one or more insights.');
      }

      const recoveryData = await recoveryRes.json();
      const progressionData = await progressionRes.json();

      setRecovery(recoveryData.recovery);
      setProgressions(progressionData.progressions || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }

  function getRecoveryStatusColor(status: string) {
    switch (status) {
      case 'optimal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'needs_rest':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'overtraining_risk':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-zinc-600 bg-zinc-50 border-zinc-200';
    }
  }

  function getRecoveryIcon(status: string) {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="h-4 w-4" />;
      case 'moderate':
        return <Activity className="h-4 w-4" />;
      case 'needs_rest':
      case 'overtraining_risk':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  }

  if (compact) {
    return (
      <Link href={`/dashboard/dream-gym/strategy?playerId=${playerId}`}>
        <Card className="border-zinc-200 cursor-pointer hover:border-purple-300 transition-colors h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">
              Get personalized workout plans powered by AI.
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-purple-600">
              View Strategy
              <ChevronRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Card className="border-zinc-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Insights
          </span>
          {!recovery && !loading && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuickInsights}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Load Insights
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !recovery && !error && (
          <p className="text-sm text-zinc-500 text-center py-4">
            Click &quot;Load Insights&quot; to see your recovery status and progression suggestions.
          </p>
        )}

        {recovery && (
          <div className="space-y-4">
            {/* Recovery Status */}
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${getRecoveryStatusColor(
                recovery.status
              )}`}
            >
              {getRecoveryIcon(recovery.status)}
              <div className="flex-1">
                <p className="font-medium capitalize text-sm">
                  Recovery: {recovery.status.replace('_', ' ')}
                </p>
                <p className="text-xs opacity-80">{recovery.message}</p>
              </div>
            </div>

            {/* Quick Recommendations */}
            {recovery.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase">
                  Recommendations
                </p>
                {recovery.recommendations.slice(0, 2).map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Progression Highlights */}
            {progressions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Ready to Progress
                </p>
                {progressions.slice(0, 2).map((prog, i) => (
                  <div key={i} className="p-2 bg-purple-50 rounded text-sm">
                    <p className="font-medium text-purple-800">{prog.exerciseName}</p>
                    <p className="text-purple-600 text-xs">{prog.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Link to full strategy */}
            <Link
              href={`/dashboard/dream-gym/strategy?playerId=${playerId}`}
              className="block text-center text-sm text-purple-600 hover:text-purple-700 py-2"
            >
              View Full AI Strategy
              <ChevronRight className="h-4 w-4 inline ml-1" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
