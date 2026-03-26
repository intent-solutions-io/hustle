export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  category: 'strength' | 'conditioning' | 'core' | 'recovery';
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  exercises: Exercise[];
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'strength',
    name: 'Strength Training',
    description: 'Build lower body power and muscle endurance',
    duration: '45 min',
    icon: '💪',
    color: 'bg-orange-500',
    exercises: [
      { name: 'Pistol Squat Exercise', sets: 3, reps: '8 each leg', rest: '60s', category: 'strength' },
      { name: 'Bent Knees Bench Dip Exercise', sets: 3, reps: '12', rest: '45s', category: 'strength' },
      { name: 'Knee Push Up Exercise', sets: 3, reps: '15', rest: '45s', category: 'strength' },
      { name: 'Glute Bridge Exercise', sets: 3, reps: '15', rest: '45s', category: 'strength' },
      { name: 'Plank Shoulder Tap Exercise', sets: 3, reps: '30s', rest: '30s', category: 'core' },
    ],
  },
  {
    id: 'conditioning',
    name: 'Conditioning Circuit',
    description: 'High-intensity athletic endurance builder',
    duration: '30 min',
    icon: '⚡',
    color: 'bg-red-500',
    exercises: [
      { name: 'Sumo Squat Jumps', sets: 4, reps: '10', rest: '45s', category: 'conditioning' },
      { name: 'Modified Burpee Exercise', sets: 4, reps: '8', rest: '45s', category: 'conditioning' },
      { name: 'Running in Place', sets: 4, reps: '30s', rest: '30s', category: 'conditioning' },
      { name: 'Alternating Hurdles Exercise', sets: 4, reps: '12', rest: '30s', category: 'conditioning' },
    ],
  },
  {
    id: 'core',
    name: 'Core Blast',
    description: 'Strengthen your center for on-field stability',
    duration: '20 min',
    icon: '🔥',
    color: 'bg-amber-500',
    exercises: [
      { name: 'Bicycle Crunch Exercise', sets: 3, reps: '20', rest: '30s', category: 'core' },
      { name: 'Sit Up Exercise', sets: 3, reps: '15', rest: '30s', category: 'core' },
      { name: 'Leg Pull Low Plank', sets: 3, reps: '12', rest: '30s', category: 'core' },
      { name: 'Elbow to Knee Crunch', sets: 3, reps: '20', rest: '30s', category: 'core' },
      { name: 'Hip Abduction L-Sit Leg Raise Alternating', sets: 3, reps: '10 each', rest: '30s', category: 'core' },
    ],
  },
  {
    id: 'recovery',
    name: 'Active Recovery',
    description: 'Gentle movement to restore and rebuild',
    duration: '25 min',
    icon: '🌿',
    color: 'bg-green-500',
    exercises: [
      { name: 'Bridge Marching', sets: 2, reps: '30s', rest: '20s', category: 'recovery' },
      { name: 'Straight Leg Hip Raise Exercise', sets: 2, reps: '10 each', rest: '20s', category: 'recovery' },
      { name: 'Cocoons Exercise', sets: 2, reps: '12', rest: '20s', category: 'recovery' },
    ],
  },
];
