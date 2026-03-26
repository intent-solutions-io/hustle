/**
 * Game utility functions for the Hustle application
 *
 * These functions provide helper utilities for game data processing,
 * statistics calculation, and display formatting.
 */

import type { GameData, AthleteStats, GameResult } from '@/types/game';

/**
 * Calculate aggregated statistics from games array
 *
 * Takes an array of games and computes cumulative statistics including
 * total games, goals, assists, minutes played, and position-specific stats.
 *
 * @param games - Array of game records from database
 * @returns Aggregated statistics object
 *
 * @example
 * ```typescript
 * const stats = calculateAthleteStats(games);
 * console.log(stats.totalGoals); // 12
 * console.log(stats.goalsPerGame); // 0.8
 * ```
 */
export function calculateAthleteStats(games: GameData[]): AthleteStats {
  const totalGames = games.length;

  // If no games, return zero stats
  if (totalGames === 0) {
    return {
      totalGames: 0,
      totalGoals: 0,
      totalAssists: 0,
      totalMinutes: 0,
      cleanSheets: 0,
      averageMinutesPerGame: 0,
      goalsPerGame: 0,
    };
  }

  // Calculate cumulative stats
  const totalGoals = games.reduce((sum, game) => sum + game.goals, 0);
  const totalAssists = games.reduce((sum, game) => sum + game.assists, 0);
  const totalMinutes = games.reduce((sum, game) => sum + game.minutesPlayed, 0);

  // Clean sheets only relevant for goalkeepers
  const cleanSheets = games.filter((game) => game.cleanSheet === true).length;

  // Calculate averages
  const averageMinutesPerGame = Math.round(totalMinutes / totalGames);
  const goalsPerGame = parseFloat((totalGoals / totalGames).toFixed(2));

  return {
    totalGames,
    totalGoals,
    totalAssists,
    totalMinutes,
    cleanSheets,
    averageMinutesPerGame,
    goalsPerGame,
  };
}

/**
 * Format game statistics for display based on player position
 *
 * Generates a human-readable stats string:
 * - Field players: "2G, 1A" (goals and assists)
 * - Goalkeepers: "3 saves, 1 GA, CS" (saves, goals against, clean sheet)
 *
 * Returns "-" if no stats to display.
 *
 * @param game - Game record from database
 * @param position - Player position (determines which stats to show)
 * @returns Formatted stats string
 *
 * @example
 * ```typescript
 * formatGameStats(game, 'Forward'); // "2G, 1A"
 * formatGameStats(game, 'Goalkeeper'); // "3 saves, 1 GA, CS"
 * formatGameStats(gameWithNoStats, 'Midfielder'); // "-"
 * ```
 */
export function formatGameStats(game: GameData, position: string): string {
  if (position === 'Goalkeeper') {
    // Goalkeeper stats: Saves, Goals Against, Clean Sheet
    const parts: string[] = [];

    // Saves (always show, default 0)
    parts.push(`${game.saves ?? 0} saves`);

    // Goals against (always show, default 0)
    parts.push(`${game.goalsAgainst ?? 0} GA`);

    // Clean sheet indicator (only if true)
    if (game.cleanSheet) {
      parts.push('CS');
    }

    return parts.join(', ');
  } else {
    // Field player stats: Goals, Assists, Defensive Stats
    const parts: string[] = [];

    // Offensive stats
    if (game.goals > 0) {
      parts.push(`${game.goals}G`);
    }

    if (game.assists > 0) {
      parts.push(`${game.assists}A`);
    }

    // Defensive stats (only show if recorded)
    const defensiveStats: string[] = [];

    if (game.tackles && game.tackles > 0) {
      defensiveStats.push(`${game.tackles}T`);
    }

    if (game.interceptions && game.interceptions > 0) {
      defensiveStats.push(`${game.interceptions}I`);
    }

    if (game.clearances && game.clearances > 0) {
      defensiveStats.push(`${game.clearances}C`);
    }

    if (game.blocks && game.blocks > 0) {
      defensiveStats.push(`${game.blocks}B`);
    }

    if (game.aerialDuelsWon && game.aerialDuelsWon > 0) {
      defensiveStats.push(`${game.aerialDuelsWon}AD`);
    }

    // Add defensive stats to parts
    parts.push(...defensiveStats);

    // Return "-" if no stats to show
    return parts.length > 0 ? parts.join(', ') : '-';
  }
}

/**
 * Format game date for display
 *
 * Converts a Date object to a human-readable format.
 * Uses locale-aware formatting for consistent display.
 *
 * @param date - Date object to format
 * @param format - Format type ('short' or 'long')
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatGameDate(new Date('2024-10-05'), 'short'); // "Oct 5, 2024"
 * formatGameDate(new Date('2024-10-05'), 'long'); // "October 5, 2024"
 * ```
 */
export function formatGameDate(
  date: Date,
  format: 'short' | 'long' = 'short'
): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format game date for mobile display (without year)
 *
 * Uses shorter format suitable for mobile cards.
 *
 * @param date - Date object to format
 * @returns Formatted date string without year (e.g., "Oct 5")
 *
 * @example
 * ```typescript
 * formatGameDateMobile(new Date('2024-10-05')); // "Oct 5"
 * ```
 */
export function formatGameDateMobile(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Get CSS classes for game result badge
 *
 * Returns Tailwind CSS classes for styling result badges consistently.
 * Maps each result to appropriate background and text colors.
 *
 * @param result - Game result value
 * @returns Tailwind CSS class string
 *
 * @example
 * ```typescript
 * getResultBadgeClasses('Win'); // "bg-green-600 text-white"
 * getResultBadgeClasses('Loss'); // "bg-red-600 text-white"
 * ```
 */
export function getResultBadgeClasses(result: string): string {
  const RESULT_STYLES: Record<GameResult, string> = {
    Win: 'bg-green-600 text-white',
    Loss: 'bg-red-600 text-white',
    Draw: 'bg-zinc-500 text-white',
  };

  // Type guard to ensure result is a valid GameResult
  if (result === 'Win' || result === 'Loss' || result === 'Draw') {
    return RESULT_STYLES[result];
  }

  // Fallback for unknown results (shouldn't happen with proper DB constraints)
  return 'bg-zinc-500 text-white';
}

/**
 * Check if a position is goalkeeper
 *
 * Helper function to determine if position-specific stats should be shown.
 *
 * @param position - Player position string
 * @returns True if position is goalkeeper
 *
 * @example
 * ```typescript
 * isGoalkeeper('Goalkeeper'); // true
 * isGoalkeeper('Forward'); // false
 * ```
 */
export function isGoalkeeper(position: string): boolean {
  return position === 'Goalkeeper';
}

/**
 * Validate game result value
 *
 * Type guard function to check if a string is a valid GameResult.
 *
 * @param result - String to validate
 * @returns True if result is valid GameResult type
 *
 * @example
 * ```typescript
 * isValidGameResult('Win'); // true
 * isValidGameResult('Unknown'); // false
 * ```
 */
export function isValidGameResult(result: string): result is GameResult {
  return result === 'Win' || result === 'Loss' || result === 'Draw';
}

/**
 * Calculate win percentage
 *
 * Calculates the percentage of games won from total games played.
 *
 * @param games - Array of game records
 * @returns Win percentage (0-100)
 *
 * @example
 * ```typescript
 * calculateWinPercentage(games); // 66.67 (if 2 wins out of 3 games)
 * ```
 */
export function calculateWinPercentage(games: GameData[]): number {
  if (games.length === 0) return 0;

  const wins = games.filter((game) => game.result === 'Win').length;
  return parseFloat(((wins / games.length) * 100).toFixed(2));
}

/**
 * Get most recent game
 *
 * Returns the most recent game from an array of games.
 * Assumes games are already sorted by date DESC.
 *
 * @param games - Array of game records
 * @returns Most recent game or null if no games
 *
 * @example
 * ```typescript
 * const recentGame = getMostRecentGame(games);
 * if (recentGame) {
 *   console.log(formatGameDate(recentGame.date));
 * }
 * ```
 */
export function getMostRecentGame(games: GameData[]): GameData | null {
  return games.length > 0 ? games[0] : null;
}

/**
 * Filter games by date range
 *
 * Returns games within a specified date range (inclusive).
 *
 * @param games - Array of game records
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Filtered array of games
 *
 * @example
 * ```typescript
 * const thisMonthGames = filterGamesByDateRange(
 *   games,
 *   new Date('2024-10-01'),
 *   new Date('2024-10-31')
 * );
 * ```
 */
export function filterGamesByDateRange(
  games: GameData[],
  startDate: Date,
  endDate: Date
): GameData[] {
  return games.filter((game) => {
    const gameDate = new Date(game.date);
    return gameDate >= startDate && gameDate <= endDate;
  });
}
