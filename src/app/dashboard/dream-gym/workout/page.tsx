'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Dumbbell, Clock, Target, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { Player, DreamGym, DreamGymDayType, WorkoutExercise } from '@/types/firestore';

// Sample workout templates based on goals and intensity
const WORKOUT_TEMPLATES = {
  strength: {
    title: 'Strength Training',
    duration: 45,
    warmup: ['Light jog 2 min', 'Dynamic stretches', 'Leg swings'],
    cooldown: ['Static stretches 5 min', 'Foam rolling'],
    exercises: [
      { exerciseId: 'sq1', name: 'Goblet Squats', sets: 3, reps: '10-12', rest: '60s' },
      { exerciseId: 'lu1', name: 'Walking Lunges', sets: 3, reps: '10 each leg', rest: '60s' },
      { exerciseId: 'dl1', name: 'Romanian Deadlifts', sets: 3, reps: '10-12', rest: '60s' },
      { exerciseId: 'pu1', name: 'Push-ups', sets: 3, reps: '12-15', rest: '45s' },
      { exerciseId: 'pl1', name: 'Plank Hold', sets: 3, reps: '30-45s', rest: '30s' },
    ],
  },
  conditioning: {
    title: 'Conditioning Circuit',
    duration: 30,
    warmup: ['Jump rope 2 min', 'High knees', 'Butt kicks'],
    cooldown: ['Walk 3 min', 'Deep breathing', 'Light stretches'],
    exercises: [
      { exerciseId: 'bj1', name: 'Box Jumps', sets: 4, reps: '8', rest: '45s' },
      { exerciseId: 'bu1', name: 'Burpees', sets: 4, reps: '10', rest: '45s' },
      { exerciseId: 'mc1', name: 'Mountain Climbers', sets: 4, reps: '20 each', rest: '30s' },
      { exerciseId: 'sk1', name: 'Lateral Skaters', sets: 4, reps: '12 each', rest: '30s' },
    ],
  },
  core: {
    title: 'Core Blast',
    duration: 25,
    warmup: ['Cat-cow stretches', 'Dead bugs', 'Hip circles'],
    cooldown: ['Child pose 1 min', 'Spinal twists'],
    exercises: [
      { exerciseId: 'cr1', name: 'Bicycle Crunches', sets: 3, reps: '20', rest: '30s' },
      { exerciseId: 'pl2', name: 'Side Plank', sets: 3, reps: '30s each', rest: '30s' },
      { exerciseId: 'lr1', name: 'Leg Raises', sets: 3, reps: '12-15', rest: '30s' },
      { exerciseId: 'ru1', name: 'Russian Twists', sets: 3, reps: '20', rest: '30s' },
      { exerciseId: 'hh1', name: 'Hollow Hold', sets: 3, reps: '30s', rest: '30s' },
    ],
  },
  recovery: {
    title: 'Active Recovery',
    duration: 20,
    warmup: ['Deep breathing 2 min'],
    cooldown: ['Meditation 5 min'],
    exercises: [
      { exerciseId: 'fr1', name: 'Foam Rolling - Quads', sets: 1, reps: '2 min', rest: '0s' },
      { exerciseId: 'fr2', name: 'Foam Rolling - Hamstrings', sets: 1, reps: '2 min', rest: '0s' },
      { exerciseId: 'fr3', name: 'Foam Rolling - IT Band', sets: 1, reps: '2 min each', rest: '0s' },
      { exerciseId: 'st1', name: 'Hip Flexor Stretch', sets: 1, reps: '1 min each', rest: '0s' },
      { exerciseId: 'st2', name: 'Pigeon Pose', sets: 1, reps: '1 min each', rest: '0s' },
    ],
  },
};

function getDayOfWeek(): keyof typeof DAY_WORKOUT_MAP {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return days[new Date().getDay()] as keyof typeof DAY_WORKOUT_MAP;
}

const DAY_WORKOUT_MAP: Record<DreamGymDayType, keyof typeof WORKOUT_TEMPLATES | null> = {
  off: 'recovery',
  practice_light: 'strength',
  practice_medium: 'core',
  practice_hard: 'recovery',
  game: null,
  tournament: null,
};

export default function DreamGymWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [dreamGym, setDreamGym] = useState<DreamGym | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [workoutStarted, setWorkoutStarted] = useState(false);

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

  function getRecommendedWorkout() {
    if (!dreamGym) return WORKOUT_TEMPLATES.strength;

    const today = getDayOfWeek();
    const todaySchedule = dreamGym.schedule[today as keyof typeof dreamGym.schedule];
    const workoutType = DAY_WORKOUT_MAP[todaySchedule];

    if (workoutType === null) {
      // Game or tournament day - rest
      return null;
    }

    return WORKOUT_TEMPLATES[workoutType];
  }

  function toggleExercise(exerciseId: string) {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
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

  const workout = getRecommendedWorkout();
  const today = getDayOfWeek();
  const todaySchedule = dreamGym.schedule[today as keyof typeof dreamGym.schedule];
  const allCompleted = workout && completedExercises.size === workout.exercises.length;

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
          <h1 className="text-3xl font-bold text-zinc-900">Today&apos;s Workout</h1>
          <p className="text-zinc-600 mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className="px-3 py-1 bg-zinc-100 rounded-full text-sm capitalize">
          {todaySchedule.replace('_', ' ')}
        </span>
      </div>

      {!workout ? (
        <Card className="border-zinc-200">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Rest Day</h2>
            <p className="text-zinc-600 max-w-md mx-auto">
              Today is a {todaySchedule.replace('_', ' ').toLowerCase()} day.
              Focus on staying hydrated and getting good sleep.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Workout Overview */}
          <Card className="border-zinc-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {workout.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm text-zinc-600 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {workout.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {workout.exercises.length} exercises
                </span>
              </div>

              {!workoutStarted ? (
                <Button
                  onClick={() => setWorkoutStarted(true)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800"
                >
                  Start Workout
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{completedExercises.size} / {workout.exercises.length}</span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-zinc-900 h-2 rounded-full transition-all"
                      style={{ width: `${(completedExercises.size / workout.exercises.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {workoutStarted && (
            <>
              {/* Warmup */}
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg">Warmup</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {workout.warmup.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Exercises */}
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg">Exercises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workout.exercises.map((exercise) => (
                    <div
                      key={exercise.exerciseId}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                        completedExercises.has(exercise.exerciseId)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                      }`}
                      onClick={() => toggleExercise(exercise.exerciseId)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            completedExercises.has(exercise.exerciseId)
                              ? 'bg-green-500 text-white'
                              : 'bg-zinc-200'
                          }`}
                        >
                          {completedExercises.has(exercise.exerciseId) && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-sm text-zinc-500">
                            {exercise.sets} sets × {exercise.reps}
                            <span className="mx-2">·</span>
                            Rest {exercise.rest}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Cooldown */}
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg">Cooldown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {workout.cooldown.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Complete Workout */}
              {allCompleted && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="py-6 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <h2 className="text-xl font-semibold text-green-900 mb-2">
                      Workout Complete!
                    </h2>
                    <p className="text-green-700 mb-4">
                      Great job {player.name}! Keep up the hard work.
                    </p>
                    <Button
                      onClick={() => {
                        setWorkoutStarted(false);
                        setCompletedExercises(new Set());
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Start Another Workout
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
