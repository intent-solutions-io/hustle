/**
 * Game-related type definitions for the Hustle application
 *
 * These types provide strict TypeScript checking for game data structures,
 * statistics calculations, and display formatting used throughout the application.
 */

/**
 * Game data structure from Firestore database
 *
 * Use this for raw game data from Firestore queries.
 *
 * @example
 * ```typescript
 * import { getGames } from '@/lib/firebase/services/games';
 * const games: GameData[] = await getGames(userId, playerId);
 * ```
 */
export interface GameData {
  id: string;
  date: Date;
  opponent: string;
  result: 'Win' | 'Loss' | 'Draw';
  finalScore: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  tackles: number | null;
  interceptions: number | null;
  clearances: number | null;
  blocks: number | null;
  aerialDuelsWon: number | null;
  saves: number | null;
  goalsAgainst: number | null;
  cleanSheet: boolean | null;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Game result options
 *
 * Represents the outcome of a game from the player's team perspective.
 * Must match the values stored in the database Game.result field.
 */
export type GameResult = 'Win' | 'Loss' | 'Draw';

/**
 * Performance Rating (1-5 stars)
 */
export type PerformanceRating = 1 | 2 | 3 | 4 | 5;

/**
 * Game Emotion Tags
 */
export type GameEmotionTag =
  | 'confident'
  | 'frustrated'
  | 'tired'
  | 'focused'
  | 'nervous'
  | 'excited'
  | 'proud'
  | 'disappointed';

/**
 * Aggregated athlete statistics calculated from games
 *
 * Contains cumulative statistics across all games for an athlete.
 * Used in dashboard summary cards and athlete detail pages.
 *
 * @example
 * ```typescript
 * const stats: AthleteStats = {
 *   totalGames: 15,
 *   totalGoals: 12,
 *   totalAssists: 8,
 *   totalMinutes: 1200,
 *   cleanSheets: 3,
 *   averageMinutesPerGame: 80,
 *   goalsPerGame: 0.8
 * };
 * ```
 */
export interface AthleteStats {
  /**
   * Total number of games played
   */
  totalGames: number;

  /**
   * Total goals scored across all games
   */
  totalGoals: number;

  /**
   * Total assists across all games
   */
  totalAssists: number;

  /**
   * Total minutes played across all games
   */
  totalMinutes: number;

  /**
   * Number of clean sheets (goalkeeper only)
   * Will be 0 for field players
   */
  cleanSheets: number;

  /**
   * Average minutes per game
   * Calculated as totalMinutes / totalGames
   */
  averageMinutesPerGame: number;

  /**
   * Average goals per game
   * Calculated as totalGoals / totalGames
   */
  goalsPerGame: number;
}

/**
 * Game display data with formatted fields for UI rendering
 *
 * Extends GameData with pre-formatted strings for common display patterns.
 * Use this type when passing game data to UI components that need
 * human-readable formatted values.
 *
 * @example
 * ```typescript
 * const displayGame: GameDisplayData = {
 *   ...gameData,
 *   formattedDate: 'Oct 5, 2024',
 *   formattedStats: '2G, 1A'
 * };
 * ```
 */
export interface GameDisplayData extends GameData {
  /**
   * Human-readable date string (e.g., "Oct 5, 2024")
   */
  formattedDate: string;

  /**
   * Formatted statistics string for display (e.g., "2G, 1A" or "3 saves, 1 GA")
   */
  formattedStats: string;
}

/**
 * Props for athlete detail page component
 *
 * Defines the structure of dynamic route parameters passed to the
 * athlete detail page. The id parameter comes from the URL route.
 */
export interface AthleteDetailPageProps {
  /**
   * Dynamic route parameters (Promise in Next.js 15)
   */
  params: Promise<{
    /**
     * Player ID from URL route parameter
     */
    id: string;
  }>;
}

/**
 * Complete athlete detail data bundle
 *
 * Contains all data needed to render the athlete detail page:
 * - Player information
 * - All games
 * - Calculated statistics
 *
 * This is typically the structure returned by server-side data fetching
 * functions before rendering the page.
 */
export interface AthleteDetailData {
  /**
   * Player profile information
   */
  athlete: {
    id: string;
    name: string;
    birthday: Date;
    position: string;
    teamClub: string;
    photoUrl: string | null;
    parentId: string;
    createdAt: Date;
    updatedAt: Date;
  };

  /**
   * All games for this athlete (typically sorted by date DESC)
   */
  games: GameData[];

  /**
   * Aggregated statistics calculated from games
   */
  stats: AthleteStats;
}

/**
 * Position-specific stat fields
 *
 * Used to determine which statistics to display based on player position.
 * Goalkeepers show different stats than field players.
 */
export interface PositionStats {
  /**
   * Whether this position uses goalkeeper-specific stats
   */
  isGoalkeeper: boolean;

  /**
   * Primary stat categories to display
   */
  primaryStats: string[];

  /**
   * Secondary stat categories to display
   */
  secondaryStats: string[];
}
