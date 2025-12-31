'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Loader2,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Timer,
  Ruler,
  Repeat,
  Gauge,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Player, FitnessAssessment, FitnessTestType, FitnessTestUnit } from '@/types/firestore';

interface AssessmentSummary {
  totalAssessments: number;
  testsTaken: FitnessTestType[];
  latestByType: Record<
    FitnessTestType,
    { value: number; date: Date; percentile: number | null } | null
  >;
}

interface TestMetadata {
  name: string;
  description: string;
  unit: FitnessTestUnit;
  direction: 'higher_better' | 'lower_better';
  minValue: number;
  maxValue: number;
}

const TEST_TYPES: { value: FitnessTestType; label: string; icon: React.ReactNode }[] = [
  { value: 'beep_test', label: 'Beep Test (Yo-Yo)', icon: <Gauge className="h-4 w-4" /> },
  { value: '40_yard_dash', label: '40-Yard Dash', icon: <Timer className="h-4 w-4" /> },
  { value: 'pro_agility', label: 'Pro Agility (5-10-5)', icon: <Timer className="h-4 w-4" /> },
  { value: 'vertical_jump', label: 'Vertical Jump', icon: <Ruler className="h-4 w-4" /> },
  { value: 'plank_hold', label: 'Plank Hold', icon: <Timer className="h-4 w-4" /> },
  { value: 'pushups_1min', label: 'Push-ups (1 min)', icon: <Repeat className="h-4 w-4" /> },
  { value: 'situps_1min', label: 'Sit-ups (1 min)', icon: <Repeat className="h-4 w-4" /> },
  { value: 'mile_run', label: 'Mile Run', icon: <Timer className="h-4 w-4" /> },
];

export default function DreamGymAssessmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [assessments, setAssessments] = useState<FitnessAssessment[]>([]);
  const [summary, setSummary] = useState<AssessmentSummary | null>(null);
  const [metadata, setMetadata] = useState<Record<FitnessTestType, TestMetadata> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    testType: '' as FitnessTestType | '',
    value: '',
    unit: '' as FitnessTestUnit | '',
    percentile: '',
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

        const assessmentsRes = await fetch(
          `/api/players/${playerId}/assessments?includeSummary=true&includeMetadata=true&limit=50`
        );
        if (assessmentsRes.ok) {
          const data = await assessmentsRes.json();
          setAssessments(data.assessments || []);
          setSummary(data.summary);
          setMetadata(data.metadata);
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

  useEffect(() => {
    // Auto-set unit when test type changes
    if (formData.testType && metadata) {
      const testMeta = metadata[formData.testType];
      if (testMeta) {
        setFormData((prev) => ({ ...prev, unit: testMeta.unit }));
      }
    }
  }, [formData.testType, metadata]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !formData.testType) return;

    setSubmitting(true);
    try {
      const payload = {
        date: formData.date,
        testType: formData.testType,
        value: Number(formData.value),
        unit: formData.unit,
        percentile: formData.percentile ? Number(formData.percentile) : null,
        notes: formData.notes || null,
      };

      const response = await fetch(`/api/players/${playerId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to save assessment');
      }

      // Refresh data
      const assessmentsRes = await fetch(
        `/api/players/${playerId}/assessments?includeSummary=true&includeMetadata=true&limit=50`
      );
      if (assessmentsRes.ok) {
        const data = await assessmentsRes.json();
        setAssessments(data.assessments || []);
        setSummary(data.summary);
      }

      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        testType: '',
        value: '',
        unit: '',
        percentile: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(error instanceof Error ? error.message : 'Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  }

  function formatValue(testType: FitnessTestType, value: number): string {
    const testMeta = metadata?.[testType];
    if (!testMeta) return value.toString();

    if (testMeta.unit === 'time') {
      const minutes = Math.floor(value / 60);
      const seconds = Math.round(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (testMeta.unit === 'seconds') {
      return `${value.toFixed(2)}s`;
    }
    if (testMeta.unit === 'inches') {
      return `${value}"`;
    }
    if (testMeta.unit === 'level') {
      return `Level ${value}`;
    }
    return value.toString();
  }

  function getTestIcon(testType: FitnessTestType) {
    const test = TEST_TYPES.find((t) => t.value === testType);
    return test?.icon ?? <Target className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-zinc-900">Fitness Assessments</h1>
          <p className="text-zinc-600 mt-2">{player.name}&apos;s fitness test results</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2 bg-zinc-900 hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Log Test
        </Button>
      </div>

      {/* Log Entry Form */}
      {showForm && metadata && (
        <Card className="border-zinc-200">
          <CardHeader>
            <CardTitle>Log Fitness Test</CardTitle>
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
                  <Label htmlFor="testType">Test Type</Label>
                  <Select
                    value={formData.testType}
                    onValueChange={(value: FitnessTestType) =>
                      setFormData((prev) => ({ ...prev, testType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a test" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEST_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="flex items-center gap-2">
                            {t.icon}
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.testType && metadata[formData.testType] && (
                <>
                  <div className="p-3 bg-zinc-50 rounded-lg text-sm text-zinc-600">
                    <p className="font-medium text-zinc-900">{metadata[formData.testType].name}</p>
                    <p>{metadata[formData.testType].description}</p>
                    <p className="mt-1 text-xs">
                      {metadata[formData.testType].direction === 'higher_better'
                        ? 'Higher is better'
                        : 'Lower is better'}
                      {' | '}
                      Range: {metadata[formData.testType].minValue} - {metadata[formData.testType].maxValue}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="value">
                        Result ({metadata[formData.testType].unit === 'time' ? 'seconds' : metadata[formData.testType].unit})
                      </Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        min={metadata[formData.testType].minValue}
                        max={metadata[formData.testType].maxValue}
                        placeholder={`e.g., ${metadata[formData.testType].minValue}`}
                        value={formData.value}
                        onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="percentile">Percentile (optional)</Label>
                      <Input
                        id="percentile"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g., 75"
                        value={formData.percentile}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, percentile: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any observations or conditions during the test..."
                      value={formData.notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.testType || !formData.value}
                  className="bg-zinc-900 hover:bg-zinc-800"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Test'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && summary.testsTaken.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.testsTaken.slice(0, 4).map((testType) => {
            const latest = summary.latestByType[testType];
            const testMeta = metadata?.[testType];
            if (!latest || !testMeta) return null;

            return (
              <Card key={testType} className="border-zinc-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    {getTestIcon(testType)}
                    <span className="text-sm text-zinc-600">{testMeta.name}</span>
                  </div>
                  <p className="text-2xl font-bold">{formatValue(testType, latest.value)}</p>
                  {latest.percentile && (
                    <p className="text-sm text-zinc-500 mt-1">{latest.percentile}th percentile</p>
                  )}
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(latest.date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All Tests Overview */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>All Fitness Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEST_TYPES.map((test) => {
              const latest = summary?.latestByType[test.value];
              const testMeta = metadata?.[test.value];

              return (
                <div
                  key={test.value}
                  className={`p-4 rounded-lg border ${
                    latest ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-dashed border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {test.icon}
                    <span className="text-sm font-medium">{test.label}</span>
                  </div>
                  {latest ? (
                    <>
                      <p className="text-xl font-bold">{formatValue(test.value, latest.value)}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(latest.date).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-400">Not tested yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tests */}
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle>Recent Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Target className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
              <p>No fitness tests logged yet.</p>
              <p className="text-sm mt-1">Start tracking to measure progress over time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 15).map((assessment) => {
                const testMeta = metadata?.[assessment.testType];

                return (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTestIcon(assessment.testType)}
                      <div>
                        <p className="font-medium">{testMeta?.name ?? assessment.testType}</p>
                        <p className="text-sm text-zinc-500">
                          {new Date(assessment.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatValue(assessment.testType, assessment.value)}</p>
                      {assessment.percentile && (
                        <p className="text-sm text-zinc-500">{assessment.percentile}th %ile</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
