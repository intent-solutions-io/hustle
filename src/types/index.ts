// ============================================================
// User & Auth
// ============================================================

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isParentGuardian: boolean;
  plan: 'free' | 'starter' | 'plus' | 'pro';
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================
// Athletes
// ============================================================

export type Position =
  | 'Goalkeeper'
  | 'Defender'
  | 'Midfielder'
  | 'Forward'
  | 'Winger';

export interface Athlete {
  id: string;
  parentUid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  position: Position;
  teamName?: string;
  jerseyNumber?: number;
  photoUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================
// Games
// ============================================================

export type GameResult = 'Win' | 'Loss' | 'Draw';

export interface GameStats {
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  tackles: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  rating?: number; // 1-10
}

export interface Game {
  id: string;
  athleteId: string;
  parentUid: string;
  date: Date;
  opponent: string;
  result: GameResult;
  teamScore: number;
  opponentScore: number;
  stats: GameStats;
  notes?: string;
  createdAt: Date;
}

// ============================================================
// Dream Gym
// ============================================================

export type DreamGymModule =
  | 'workout'
  | 'cardio'
  | 'mental'
  | 'strategy'
  | 'progress'
  | 'biometrics'
  | 'assessments'
  | 'practices';

export interface WorkoutSession {
  id: string;
  athleteId: string;
  parentUid: string;
  date: Date;
  module: DreamGymModule;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  notes?: string;
  createdAt: Date;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps?: number;
  durationSeconds?: number;
  completed: boolean;
}

// ============================================================
// Billing
// ============================================================

export type PlanId = 'free' | 'starter' | 'plus' | 'pro';

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  athletes: number | 'Unlimited';
  gamesPerMonth: number | 'Unlimited';
  storage: string;
  features: string[];
}
