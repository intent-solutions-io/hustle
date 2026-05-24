/**
 * AI Workout Strategy Module
 *
 * Uses Claude (via lib/ai/claude.ts) to generate personalized workout
 * strategies based on player history, position, goals, and biometrics.
 *
 * When ANTHROPIC_API_KEY is unset, or NODE_ENV === 'test' without a key,
 * `generateWorkoutStrategy` returns a deterministic fallback strategy so
 * offline / CI environments stay green without making network calls.
 */

import { generateText, ClaudeError } from './claude';

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

/**
 * Whether the offline / test fallback path should fire instead of a real
 * Claude call. If there is no API key, or we're in a test environment
 * without one, return the canned plan rather than crashing.
 */
function shouldUseFallback(): boolean {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) return true;
  // NODE_ENV === 'test' AND key present → still call the (mocked) API.
  return false;
}

/**
 * Generate a personalized workout strategy using Claude.
 *
 * Public signature is unchanged from the previous implementation so API
 * routes that import this don't need to change.
 */
export async function generateWorkoutStrategy(
  input: WorkoutStrategyInput
): Promise<WorkoutStrategy> {
  if (shouldUseFallback()) {
    console.log('[AI Strategy] ANTHROPIC_API_KEY not set — using fallback strategy');
    return generateFallbackStrategy(input);
  }

  try {
    console.log('[AI Strategy] Attempting Claude generation for player:', input.playerName);

    const userPrompt = buildStrategyPrompt(input);
    const text = await generateText({
      system: STRATEGY_SYSTEM_PROMPT,
      user: userPrompt,
      // 8192 token output budget — generous for the full weekly plan JSON.
      maxTokens: 8192,
      temperature: 0.7,
    });

    if (!text) {
      throw new Error('No response text from Claude');
    }

    console.log('[AI Strategy] SUCCESS - Received AI-generated strategy');
    return parseStrategyResponse(text, input);
  } catch (error) {
    const msg = error instanceof ClaudeError || error instanceof Error
      ? error.message
      : String(error);
    console.error('[AI Strategy] FAILED - Using fallback strategy. Error:', msg);
    // Return a fallback strategy when Claude is unavailable or fails.
    return generateFallbackStrategy(input);
  }
}

/**
 * System prompt for workout strategy generation. Lifted out so the
 * persona/role lives outside the user-data prompt.
 */
const STRATEGY_SYSTEM_PROMPT =
  'You are an expert youth soccer fitness coach. You respond ONLY with valid JSON ' +
  'matching the schema described in the user message. No markdown, no code fences, ' +
  'no commentary outside the JSON.';

/**
 * Build the user prompt based on player data
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

  return `Generate a personalized weekly workout strategy for the following player.

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

IMPORTANT:
- Respond ONLY with valid JSON, no markdown formatting or code blocks
- Keep exercise descriptions brief (under 50 characters)
- Limit to 3-4 exercises per day maximum
- Ensure all strings are properly terminated
- Do not truncate the response - complete all JSON structures`;
}

/**
 * Attempt to fix common JSON issues from LLM responses
 */
function tryFixJSON(text: string): string {
  let fixed = text;

  // Try to find the last complete object/array
  // Count braces and brackets to find where JSON might be truncated
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let lastValidEnd = -1;

  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    const prevChar = i > 0 ? fixed[i - 1] : '';

    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0 && bracketCount === 0) {
          lastValidEnd = i;
        }
      }
      if (char === '[') bracketCount++;
      if (char === ']') {
        bracketCount--;
        if (braceCount === 0 && bracketCount === 0) {
          lastValidEnd = i;
        }
      }
    }
  }

  // If we found a valid end point, truncate there
  if (lastValidEnd > 0 && lastValidEnd < fixed.length - 1) {
    fixed = fixed.slice(0, lastValidEnd + 1);
  }

  // If still unbalanced, try to close open structures
  if (braceCount > 0 || bracketCount > 0) {
    // Close any unclosed strings first
    const quoteCount = (fixed.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      fixed += '"';
    }
    // Close arrays and objects
    while (bracketCount > 0) {
      fixed += ']';
      bracketCount--;
    }
    while (braceCount > 0) {
      fixed += '}';
      braceCount--;
    }
  }

  return fixed;
}

/**
 * Parse the Claude response into structured strategy
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

    // First attempt: parse as-is
    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      // Second attempt: try to fix the JSON
      console.log('[AI Strategy] Attempting to fix malformed JSON...');
      const fixedText = tryFixJSON(cleanText);
      try {
        parsed = JSON.parse(fixedText);
        console.log('[AI Strategy] Successfully fixed and parsed JSON');
      } catch (fixError) {
        // If still failing, use fallback
        console.error('[AI Strategy] Could not fix JSON, using fallback strategy');
        return generateFallbackStrategy(input);
      }
    }

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
