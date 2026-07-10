/**
 * Hustle Mobile - Type Definitions
 *
 * Shared types for the React Native mobile app.
 * Reused from the Next.js web app for consistency.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Position Types
// ============================================================================

export type SoccerPositionCode =
  | 'GK'   // Goalkeeper
  | 'CB'   // Center Back
  | 'RB'   // Right Back
  | 'LB'   // Left Back
  | 'RWB'  // Right Wing Back
  | 'LWB'  // Left Wing Back
  | 'DM'   // Defensive Midfielder
  | 'CM'   // Central Midfielder
  | 'AM'   // Attacking Midfielder
  | 'RW'   // Right Winger
  | 'LW'   // Left Winger
  | 'ST'   // Striker
  | 'CF';  // Center Forward

export const POSITION_LABELS: Record<SoccerPositionCode, string> = {
  GK: 'Goalkeeper',
  CB: 'Center Back',
  RB: 'Right Back',
  LB: 'Left Back',
  RWB: 'Right Wing Back',
  LWB: 'Left Wing Back',
  DM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  AM: 'Attacking Midfielder',
  RW: 'Right Winger',
  LW: 'Left Winger',
  ST: 'Striker',
  CF: 'Center Forward',
};

// ============================================================================
// League Types
// ============================================================================

export type LeagueCode =
  | 'ecnl_girls' | 'ecnl_boys' | 'ecnl_rl_girls' | 'ecnl_rl_boys'
  | 'mls_next' | 'girls_academy' | 'dpl' | 'elite_academy' | 'national_academy_league'
  | 'rush_soccer' | 'surf_soccer' | 'barca_residency' | 'tfa_national'
  | 'strikers_fc' | 'sporting_kc_youth' | 'fc_dallas_youth' | 'real_colorado'
  | 'celtic_fc_usa' | 'pda_soccer' | 'legends_fc' | 'la_galaxy_academy'
  | 'usys_national_pro' | 'usys_nlc' | 'elite_64' | 'npl' | 'edp'
  | 'norcal' | 'socal' | 'nycsl' | 'mid_america_academy'
  | 'state_premier' | 'state_championship' | 'state_classic'
  | 'regional_premier' | 'regional_select'
  | 'high_school' | 'middle_school'
  | 'local_travel' | 'local_rec' | 'ymca'
  | 'other';

export const LEAGUE_LABELS: Record<LeagueCode, string> = {
  ecnl_girls: 'ECNL (Girls)',
  ecnl_boys: 'ECNL (Boys)',
  ecnl_rl_girls: 'ECNL Regional League (Girls)',
  ecnl_rl_boys: 'ECNL Regional League (Boys)',
  mls_next: 'MLS NEXT',
  girls_academy: 'Girls Academy (GA)',
  dpl: 'Development Player League (DPL)',
  elite_academy: 'Elite Academy (EA)',
  national_academy_league: 'National Academy League (NAL)',
  rush_soccer: 'Rush Soccer',
  surf_soccer: 'Surf Select / Surf Soccer',
  barca_residency: 'Barça Residency Academy',
  tfa_national: 'Total Futbol Academy (TFA)',
  strikers_fc: 'Strikers FC National',
  sporting_kc_youth: 'Sporting KC Youth / SBV',
  fc_dallas_youth: 'FC Dallas Youth',
  real_colorado: 'Real Colorado',
  celtic_fc_usa: 'Celtic FC USA',
  pda_soccer: 'PDA Soccer',
  legends_fc: 'Legends FC',
  la_galaxy_academy: 'LA Galaxy Academy',
  usys_national_pro: 'USYS National League P.R.O.',
  usys_nlc: 'USYS National League Conference',
  elite_64: 'USYS Elite 64 (E64)',
  npl: 'US Club Soccer NPL',
  edp: 'EDP Soccer',
  norcal: 'NorCal Premier',
  socal: 'SOCAL Soccer League',
  nycsl: 'NYCSL',
  mid_america_academy: 'Mid-America Academy League',
  state_premier: 'State Premier League',
  state_championship: 'State Championship League',
  state_classic: 'State Classic League',
  regional_premier: 'Regional Premier League',
  regional_select: 'Regional Select League',
  high_school: 'High School Soccer',
  middle_school: 'Middle School Soccer',
  local_travel: 'Competitive Travel',
  local_rec: 'Recreational League',
  ymca: 'YMCA / Community League',
  other: 'Other (Type Your Own)',
};

// ============================================================================
// User Types
// ============================================================================

export type PlayerGender = 'male' | 'female';
export type WorkspacePlan = 'free' | 'starter' | 'plus' | 'pro';
export type WorkspaceStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'suspended' | 'deleted';
export type GameResult = 'Win' | 'Loss' | 'Draw';

// ============================================================================
// Firestore Document Types
// ============================================================================

export interface UserDocument {
  defaultWorkspaceId: string | null;
  ownedWorkspaces: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  termsAgreedAt: Timestamp | null;
  privacyAgreedAt: Timestamp | null;
  verificationPinHash?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlayerDocument {
  workspaceId?: string | null;
  name: string;
  birthday: Timestamp;
  gender: PlayerGender;
  primaryPosition: SoccerPositionCode;
  secondaryPositions?: SoccerPositionCode[];
  positionNote?: string;
  leagueCode: LeagueCode;
  leagueOtherName?: string;
  teamClub: string;
  photoUrl?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GameDocument {
  workspaceId?: string | null;
  date: Timestamp;
  opponent: string;
  result: GameResult;
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocks?: number | null;
  aerialDuelsWon?: number | null;
  saves?: number | null;
  goalsAgainst?: number | null;
  cleanSheet?: boolean | null;
  verified: boolean;
  verifiedAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Client Types (with Date instead of Timestamp)
// ============================================================================

export interface User {
  id: string;
  defaultWorkspaceId: string | null;
  ownedWorkspaces: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  isParentGuardian: boolean;
  termsAgreedAt: Date | null;
  privacyAgreedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  workspaceId?: string | null;
  name: string;
  birthday: Date;
  gender: PlayerGender;
  primaryPosition: SoccerPositionCode;
  secondaryPositions?: SoccerPositionCode[];
  positionNote?: string;
  leagueCode: LeagueCode;
  leagueOtherName?: string;
  teamClub: string;
  photoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  workspaceId?: string | null;
  date: Date;
  opponent: string;
  result: GameResult;
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles?: number | null;
  interceptions?: number | null;
  clearances?: number | null;
  blocks?: number | null;
  aerialDuelsWon?: number | null;
  saves?: number | null;
  goalsAgainst?: number | null;
  cleanSheet?: boolean | null;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
