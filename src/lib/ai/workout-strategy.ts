/**
 * AI Workout Strategy Module
 *
 * Uses Vertex AI Gemini to generate personalized workout strategies
 * based on player history, position, goals, and biometrics.
 */

import { VertexAI } from '@google-cloud/vertexai';

// Types for workout strategy
export interface WorkoutStrategyInput {
  playerId: string;
  playerName: string;
  position: string;
  goals: string[];
  age?: number;

  // Workout history summary
  recentWorkouts: {
    date: Date;
    type: string;
    duration: number;
    totalVolume?: number;
    exercises: string[];
  }[];

  // Biometrics summary (if available)
  biometrics?: {
    avgRestingHeartRate?: number;
    avgHrv?: number;
    avgSleepHours?: number;
    avgSleepScore?: number;
  };

  // Mental check-in data
  recentMood?: {
    avgMood: number;
    avgEnergy: string;
    avgSoreness: string;
  };

  // Schedule constraints
  availableDays?: string[];
  hasGymAccess?: boolean;

  // Upcoming events
  upcomingGames?: { date: Date; opponent?: string }[];
}

export interface WorkoutStrategy {
  weeklyPlan: WeeklyWorkoutPlan;
  recoveryRecommendation: RecoveryRecommendation;
  progressionSuggestions: ProgressionSuggestion[];
  insights: string[];
  generatedAt: Date;
}

export interface WeeklyWorkoutPlan {
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
}

export interface RecoveryRecommendation {
  status: 'optimal' | 'moderate' | 'needs_rest' | 'overtraining_risk';
  message: string;
  recommendations: string[];
}

export interface ProgressionSuggestion {
  exerciseName: string;
  currentLevel: string;
  suggestion: string;
  reason: string;
}

// Initialize Vertex AI client
function getVertexAI(): VertexAI {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
  }

  return new VertexAI({
    project: projectId,
    location,
  });
}

/**
 * Generate a personalized workout strategy using Vertex AI Gemini
 */
export async function generateWorkoutStrategy(
  input: WorkoutStrategyInput
): Promise<WorkoutStrategy> {
  const vertexAI = getVertexAI();
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const prompt = buildStrategyPrompt(input);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Vertex AI');
    }

    return parseStrategyResponse(text, input);
  } catch (error) {
    console.error('Error generating workout strategy:', error);
    // Return a fallback strategy
    return generateFallbackStrategy(input);
  }
}

/**
 * Build the prompt for Gemini based on player data
 */
function buildStrategyPrompt(input: WorkoutStrategyInput): string {
  const workoutSummary = input.recentWorkouts.length > 0
    ? input.recentWorkouts.map(w =>
        `- ${w.date.toLocaleDateString()}: ${w.type} (${w.duration}min)${w.totalVolume ? `, volume: ${w.totalVolume}` : ''}`
      ).join('\n')
    : 'No recent workout history available.';

  const biometricsSummary = input.biometrics
    ? `
Biometrics (30-day averages):
- Resting Heart Rate: ${input.biometrics.avgRestingHeartRate ?? 'N/A'} bpm
- HRV: ${input.biometrics.avgHrv ?? 'N/A'} ms
- Sleep: ${input.biometrics.avgSleepHours ?? 'N/A'} hrs (score: ${input.biometrics.avgSleepScore ?? 'N/A'}/100)
`
    : 'No biometrics data available.';

  const moodSummary = input.recentMood
    ? `
Mental Check-ins:
- Average Mood: ${input.recentMood.avgMood}/5
- Energy Level: ${input.recentMood.avgEnergy}
- Soreness: ${input.recentMood.avgSoreness}
`
    : 'No mental check-in data available.';

  const gameSchedule = input.upcomingGames?.length
    ? `Upcoming games: ${input.upcomingGames.map(g => g.date.toLocaleDateString()).join(', ')}`
    : 'No upcoming games scheduled.';

  return `You are an expert youth soccer fitness coach. Generate a personalized weekly workout strategy for the following player.

PLAYER PROFILE:
- Name: ${input.playerName}
- Position: ${input.position}
- Age: ${input.age ?? 'Unknown'}
- Goals: ${input.goals.join(', ') || 'General fitness'}
- Gym Access: ${input.hasGymAccess ? 'Yes' : 'No (home workouts only)'}
- Available Days: ${input.availableDays?.join(', ') || 'Flexible'}

RECENT WORKOUT HISTORY (last 4 weeks):
${workoutSummary}

${biometricsSummary}

${moodSummary}

${gameSchedule}

Based on this information, provide:

1. WEEKLY WORKOUT PLAN
Create a balanced 7-day plan appropriate for a youth soccer player. Consider:
- Position-specific needs (${input.position})
- Recovery time between sessions
- Game day preparation and recovery
- Progressive overload principles

2. RECOVERY ASSESSMENT
Evaluate the player's current recovery status based on workout load, biometrics, and mood data.
Status options: optimal, moderate, needs_rest, overtraining_risk

3. PROGRESSION SUGGESTIONS
If workout history is available, identify 1-3 exercises where the player could progress (increase weight, reps, or complexity).

4. KEY INSIGHTS
Provide 2-3 actionable insights specific to this player's situation.

Format your response as JSON with this structure:
{
  "weeklyPlan": {
    "summary": "Brief overview of the week's focus",
    "days": [
      {
        "dayOfWeek": "Monday",
        "workoutType": "strength",
        "focus": "Lower body power",
        "duration": 45,
        "exercises": [
          {"name": "Squats", "sets": 3, "reps": "8-10", "notes": "Focus on depth"}
        ]
      }
    ]
  },
  "recoveryRecommendation": {
    "status": "moderate",
    "message": "Brief assessment",
    "recommendations": ["Specific action items"]
  },
  "progressionSuggestions": [
    {
      "exerciseName": "Exercise name",
      "currentLevel": "Current performance",
      "suggestion": "What to try next",
      "reason": "Why this progression"
    }
  ],
  "insights": ["Insight 1", "Insight 2"]
}

Respond ONLY with valid JSON, no markdown formatting.`;
}

/**
 * Parse the Gemini response into structured strategy
 */
function parseStrategyResponse(
  text: string,
  input: WorkoutStrategyInput
): WorkoutStrategy {
  try {
    // Clean up the response (remove markdown if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    const parsed = JSON.parse(cleanText);

    return {
      weeklyPlan: parsed.weeklyPlan || generateDefaultWeeklyPlan(input),
      recoveryRecommendation: parsed.recoveryRecommendation || {
        status: 'moderate',
        message: 'Unable to assess recovery status with available data.',
        recommendations: ['Continue with balanced training'],
      },
      progressionSuggestions: parsed.progressionSuggestions || [],
      insights: parsed.insights || [],
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error parsing strategy response:', error);
    return generateFallbackStrategy(input);
  }
}

/**
 * Generate a default weekly plan based on position
 */
function generateDefaultWeeklyPlan(input: WorkoutStrategyInput): WeeklyWorkoutPlan {
  const isGoalkeeper = input.position === 'GK';

  return {
    summary: `Balanced weekly plan for a ${input.position} focusing on ${input.goals[0] || 'overall fitness'}`,
    days: [
      {
        dayOfWeek: 'Monday',
        workoutType: 'strength',
        focus: isGoalkeeper ? 'Upper body & core' : 'Lower body power',
        duration: 45,
        exercises: isGoalkeeper
          ? [
              { name: 'Push-ups', sets: 3, reps: '10-15' },
              { name: 'Plank', sets: 3, reps: '30-45 sec' },
              { name: 'Medicine ball throws', sets: 3, reps: '10' },
            ]
          : [
              { name: 'Squats', sets: 3, reps: '10-12' },
              { name: 'Lunges', sets: 3, reps: '10 each leg' },
              { name: 'Box jumps', sets: 3, reps: '8' },
            ],
      },
      {
        dayOfWeek: 'Tuesday',
        workoutType: 'conditioning',
        focus: 'Speed & agility',
        duration: 30,
      },
      {
        dayOfWeek: 'Wednesday',
        workoutType: 'recovery',
        focus: 'Active recovery & stretching',
        duration: 20,
      },
      {
        dayOfWeek: 'Thursday',
        workoutType: 'strength',
        focus: 'Core & stability',
        duration: 40,
      },
      {
        dayOfWeek: 'Friday',
        workoutType: 'rest',
        focus: 'Pre-game rest',
        duration: 0,
      },
      {
        dayOfWeek: 'Saturday',
        workoutType: 'game_day',
        focus: 'Game day',
        duration: 90,
      },
      {
        dayOfWeek: 'Sunday',
        workoutType: 'recovery',
        focus: 'Post-game recovery',
        duration: 20,
      },
    ],
  };
}

/**
 * Generate a fallback strategy when AI fails
 */
function generateFallbackStrategy(input: WorkoutStrategyInput): WorkoutStrategy {
  return {
    weeklyPlan: generateDefaultWeeklyPlan(input),
    recoveryRecommendation: {
      status: 'moderate',
      message: 'Based on general guidelines for youth athletes.',
      recommendations: [
        'Ensure 8-10 hours of sleep each night',
        'Stay hydrated throughout the day',
        'Include rest days between intense training',
      ],
    },
    progressionSuggestions: [],
    insights: [
      'Log more workouts to get personalized recommendations',
      'Track your biometrics for better recovery insights',
    ],
    generatedAt: new Date(),
  };
}

/**
 * Analyze recovery status based on biometrics and workout load
 */
export function analyzeRecoveryStatus(input: {
  recentWorkouts: { date: Date; duration: number; totalVolume?: number }[];
  biometrics?: {
    avgRestingHeartRate?: number;
    avgHrv?: number;
    avgSleepScore?: number;
  };
  recentMood?: {
    avgMood: number;
    avgSoreness: string;
  };
}): RecoveryRecommendation {
  let score = 100; // Start at optimal
  const recommendations: string[] = [];

  // Analyze workout frequency
  const workoutsLast7Days = input.recentWorkouts.filter(
    w => w.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  if (workoutsLast7Days > 5) {
    score -= 20;
    recommendations.push('Consider adding more rest days');
  }

  // Analyze sleep
  if (input.biometrics?.avgSleepScore !== undefined) {
    if (input.biometrics.avgSleepScore < 70) {
      score -= 15;
      recommendations.push('Focus on improving sleep quality');
    }
  }

  // Analyze HRV (higher is generally better for recovery)
  if (input.biometrics?.avgHrv !== undefined) {
    if (input.biometrics.avgHrv < 40) {
      score -= 15;
      recommendations.push('Your HRV suggests high stress - prioritize recovery');
    }
  }

  // Analyze soreness
  if (input.recentMood?.avgSoreness === 'high') {
    score -= 20;
    recommendations.push('High soreness detected - include more recovery work');
  }

  // Analyze mood
  if (input.recentMood?.avgMood !== undefined && input.recentMood.avgMood < 3) {
    score -= 10;
    recommendations.push('Low mood may affect training - consider lighter sessions');
  }

  // Determine status
  let status: RecoveryRecommendation['status'];
  let message: string;

  if (score >= 80) {
    status = 'optimal';
    message = 'Your recovery looks great! Ready for intense training.';
  } else if (score >= 60) {
    status = 'moderate';
    message = 'Recovery is adequate. Continue with balanced training.';
  } else if (score >= 40) {
    status = 'needs_rest';
    message = 'Signs of fatigue detected. Consider reducing training load.';
  } else {
    status = 'overtraining_risk';
    message = 'Warning: Possible overtraining. Prioritize rest and recovery.';
  }

  return { status, message, recommendations };
}

/**
 * Suggest exercise progressions based on workout history
 */
export function suggestProgressions(
  workoutHistory: {
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    date: Date;
  }[]
): ProgressionSuggestion[] {
  const suggestions: ProgressionSuggestion[] = [];

  // Group by exercise
  const exerciseMap = new Map<string, typeof workoutHistory>();
  for (const entry of workoutHistory) {
    const existing = exerciseMap.get(entry.exerciseName) || [];
    existing.push(entry);
    exerciseMap.set(entry.exerciseName, existing);
  }

  // Analyze each exercise for progression opportunities
  for (const [exerciseName, history] of exerciseMap) {
    if (history.length < 3) continue; // Need at least 3 data points

    // Sort by date
    const sorted = history.sort((a, b) => a.date.getTime() - b.date.getTime());
    const recent = sorted.slice(-3);

    // Check if weight has been consistent (plateau detection)
    const weights = recent.map(h => h.weight).filter((w): w is number => w !== undefined);
    if (weights.length >= 2) {
      const allSame = weights.every(w => w === weights[0]);
      if (allSame && recent.every(h => h.reps >= 10)) {
        suggestions.push({
          exerciseName,
          currentLevel: `${weights[0]} lbs x ${recent[0].reps} reps`,
          suggestion: `Increase weight to ${Math.round(weights[0] * 1.1)} lbs`,
          reason: 'Consistent performance at current weight for 3+ sessions',
        });
      }
    }

    // Check bodyweight exercises (reps progression)
    if (weights.length === 0) {
      const reps = recent.map(h => h.reps);
      if (reps.every(r => r >= 15)) {
        suggestions.push({
          exerciseName,
          currentLevel: `${reps[reps.length - 1]} reps`,
          suggestion: 'Add resistance or try a harder variation',
          reason: 'High rep count suggests readiness for progression',
        });
      }
    }
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
}
