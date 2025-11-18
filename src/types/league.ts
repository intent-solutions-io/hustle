/**
 * Youth Soccer League Types
 *
 * Comprehensive taxonomy of U.S. youth soccer leagues and competitions.
 * Includes national elite leagues, club/franchise organizations, USYS/US Club leagues,
 * regional/state leagues, school-based soccer, and local/recreational options.
 */

/**
 * League Code Enum
 *
 * Structured classification of youth soccer leagues across the United States.
 */
export type LeagueCode =
  // A. National Elite Leagues
  | 'ecnl_girls'
  | 'ecnl_boys'
  | 'ecnl_rl_girls'
  | 'ecnl_rl_boys'
  | 'mls_next'
  | 'girls_academy'
  | 'dpl'
  | 'elite_academy'
  | 'national_academy_league'

  // B. National Club / Franchise Organizations
  | 'rush_soccer'
  | 'surf_soccer'
  | 'barca_residency'
  | 'tfa_national'
  | 'strikers_fc'
  | 'sporting_kc_youth'
  | 'fc_dallas_youth'
  | 'real_colorado'
  | 'celtic_fc_usa'
  | 'pda_soccer'
  | 'legends_fc'
  | 'la_galaxy_academy'

  // C. USYS / US Club Leagues
  | 'usys_national_pro'
  | 'usys_nlc'
  | 'elite_64'
  | 'npl'
  | 'edp'
  | 'norcal'
  | 'socal'
  | 'nycsl'
  | 'mid_america_academy'

  // D. Regional / State
  | 'state_premier'
  | 'state_championship'
  | 'state_classic'
  | 'regional_premier'
  | 'regional_select'

  // E. School-Based
  | 'high_school'
  | 'middle_school'

  // F. Local / Rec
  | 'local_travel'
  | 'local_rec'
  | 'ymca'

  // G. Catch-All
  | 'other';

/**
 * League Display Labels
 *
 * Human-readable names for each league code.
 * Used in dropdown menus and display components.
 */
export const LEAGUE_LABELS: Record<LeagueCode, string> = {
  // A. National Elite
  ecnl_girls: 'ECNL (Girls)',
  ecnl_boys: 'ECNL (Boys)',
  ecnl_rl_girls: 'ECNL Regional League (Girls)',
  ecnl_rl_boys: 'ECNL Regional League (Boys)',
  mls_next: 'MLS NEXT',
  girls_academy: 'Girls Academy (GA)',
  dpl: 'Development Player League (DPL)',
  elite_academy: 'Elite Academy (EA)',
  national_academy_league: 'National Academy League (NAL)',

  // B. Club / Franchise
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

  // C. USYS / US Club
  usys_national_pro: 'USYS National League P.R.O.',
  usys_nlc: 'USYS National League Conference',
  elite_64: 'USYS Elite 64 (E64)',
  npl: 'US Club Soccer NPL',
  edp: 'EDP Soccer',
  norcal: 'NorCal Premier',
  socal: 'SOCAL Soccer League',
  nycsl: 'NYCSL',
  mid_america_academy: 'Mid-America Academy League',

  // D. Regional / State
  state_premier: 'State Premier League',
  state_championship: 'State Championship League',
  state_classic: 'State Classic League',
  regional_premier: 'Regional Premier League',
  regional_select: 'Regional Select League',

  // E. School-Based
  high_school: 'High School Soccer',
  middle_school: 'Middle School Soccer',

  // F. Local / Rec
  local_travel: 'Competitive Travel',
  local_rec: 'Recreational League',
  ymca: 'YMCA / Community League',

  // G. Other
  other: 'Other (Type Your Own)',
};

/**
 * Position Display Labels
 *
 * Human-readable names for soccer position codes.
 */
export const POSITION_LABELS: Record<string, string> = {
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
