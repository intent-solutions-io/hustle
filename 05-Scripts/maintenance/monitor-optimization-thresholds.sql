-- ============================================================================
-- OPTIMIZATION THRESHOLD MONITORING
-- ============================================================================
--
-- Run this query monthly in production to determine when date index is needed
--
-- DECISION CRITERIA:
--   - If avg_games_per_user > 500: Consider adding Game.date index
--   - If max_games_per_user > 1000: Definitely add Game.date index
--   - If power_users_count > 10: Monitor query performance closely
--
-- ============================================================================

-- Overall statistics
SELECT
  'Overall Stats' as metric_category,
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT p.id) as total_athletes,
  COUNT(g.id) as total_games,
  ROUND(COUNT(g.id)::numeric / NULLIF(COUNT(DISTINCT u.id), 0), 2) as avg_games_per_user,
  ROUND(COUNT(g.id)::numeric / NULLIF(COUNT(DISTINCT p.id), 0), 2) as avg_games_per_athlete
FROM "User" u
LEFT JOIN "Player" p ON p."parentId" = u.id
LEFT JOIN "Game" g ON g."playerId" = p.id;

-- User distribution by game count
SELECT
  'User Distribution' as metric_category,
  CASE
    WHEN game_count = 0 THEN '0 games (inactive)'
    WHEN game_count BETWEEN 1 AND 10 THEN '1-10 games (new user)'
    WHEN game_count BETWEEN 11 AND 50 THEN '11-50 games (typical user)'
    WHEN game_count BETWEEN 51 AND 100 THEN '51-100 games (active user)'
    WHEN game_count BETWEEN 101 AND 500 THEN '101-500 games (power user)'
    WHEN game_count > 500 THEN '500+ games (OPTIMIZATION NEEDED)'
  END as user_segment,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
  SELECT
    u.id as user_id,
    COUNT(g.id) as game_count
  FROM "User" u
  LEFT JOIN "Player" p ON p."parentId" = u.id
  LEFT JOIN "Game" g ON g."playerId" = p.id
  GROUP BY u.id
) user_games
GROUP BY user_segment
ORDER BY MIN(game_count);

-- Power users (potential performance concerns)
SELECT
  'Power Users (>100 games)' as metric_category,
  u.email,
  COUNT(DISTINCT p.id) as athlete_count,
  COUNT(g.id) as total_games,
  MAX(g.date) as most_recent_game,
  MIN(g.date) as first_game
FROM "User" u
INNER JOIN "Player" p ON p."parentId" = u.id
INNER JOIN "Game" g ON g."playerId" = p.id
GROUP BY u.id, u.email
HAVING COUNT(g.id) > 100
ORDER BY COUNT(g.id) DESC;

-- Season query complexity analysis
SELECT
  'Season Query Stats' as metric_category,
  COUNT(DISTINCT u.id) as users_with_season_games,
  AVG(season_games) as avg_season_games_per_user,
  MAX(season_games) as max_season_games_per_user,
  MIN(season_games) as min_season_games_per_user,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY season_games) as p95_season_games
FROM (
  SELECT
    u.id as user_id,
    COUNT(g.id) as season_games
  FROM "User" u
  INNER JOIN "Player" p ON p."parentId" = u.id
  INNER JOIN "Game" g ON g."playerId" = p.id
  WHERE g.date >= DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '5 months'  -- Aug 1
    AND g.date < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '7 months'  -- Jul 31
  GROUP BY u.id
) season_stats;

-- Optimization threshold alert
SELECT
  CASE
    WHEN avg_games > 500 THEN '🔴 CRITICAL: Add Game.date index immediately'
    WHEN avg_games > 300 THEN '🟡 WARNING: Monitor performance, consider date index'
    WHEN avg_games > 150 THEN '🟢 GOOD: Current indexes sufficient, monitor growth'
    ELSE '🟢 EXCELLENT: Well below optimization threshold'
  END as optimization_status,
  ROUND(avg_games, 0) as avg_games_per_user,
  max_games as max_games_per_user,
  power_user_count as users_with_100_plus_games
FROM (
  SELECT
    AVG(game_count) as avg_games,
    MAX(game_count) as max_games,
    COUNT(CASE WHEN game_count > 100 THEN 1 END) as power_user_count
  FROM (
    SELECT
      u.id,
      COUNT(g.id) as game_count
    FROM "User" u
    LEFT JOIN "Player" p ON p."parentId" = u.id
    LEFT JOIN "Game" g ON g."playerId" = p.id
    GROUP BY u.id
  ) user_stats
) threshold_check;

-- Index usage verification
SELECT
  'Current Index Usage' as metric_category,
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (tablename = 'Game' OR tablename = 'Player')
ORDER BY tablename, indexname;

-- Query for manual EXPLAIN ANALYZE testing
-- (Run this periodically to check actual query performance)
/*
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM "Game" g
INNER JOIN "Player" p ON g."playerId" = p.id
WHERE p."parentId" = 'YOUR-USER-ID-HERE'
  AND g.date >= '2024-08-01'
  AND g.date <= '2025-07-31';
*/
