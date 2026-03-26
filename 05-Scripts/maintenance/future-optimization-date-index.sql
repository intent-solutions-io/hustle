-- ============================================================================
-- FUTURE OPTIMIZATION: Game.date Index
-- ============================================================================
--
-- PURPOSE: Add index on Game.date column for season query optimization
--
-- WHEN TO APPLY:
--   - Average games per user exceeds 500 games
--   - Season query consistently takes >100ms
--   - User complaints about Dashboard load time
--
-- CURRENT STATUS: NOT NEEDED (MVP scale handles well without this index)
--
-- ESTIMATED IMPACT:
--   - Season query speedup: 40-60ms → 10-20ms (70% faster)
--   - Write penalty: +2-5ms per game creation (acceptable tradeoff)
--   - Storage overhead: ~50 bytes per game row
--
-- TESTING CHECKLIST:
--   [ ] Verify average games/user >500 in production
--   [ ] Measure current P95 season query latency (should be >100ms)
--   [ ] Test on staging with production-sized dataset
--   [ ] Run EXPLAIN ANALYZE before and after
--   [ ] Verify write performance impact acceptable
--
-- ROLLBACK:
--   DROP INDEX CONCURRENTLY "Game_date_idx";
--
-- ============================================================================

-- Create index concurrently to avoid locking table
-- (allows reads/writes to continue during index creation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Game_date_idx"
  ON "Game" ("date");

-- Verify index was created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Game'
  AND indexname = 'Game_date_idx';

-- Test query performance with new index
-- (Compare EXPLAIN ANALYZE before and after)
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM "Game" g
INNER JOIN "Player" p ON g."playerId" = p.id
WHERE p."parentId" = 'test-user-id-here'
  AND g.date >= '2024-08-01'
  AND g.date <= '2025-07-31';

-- Expected result:
--   Before: "Seq Scan on Game" (~40-60ms for 500+ games)
--   After:  "Index Scan using Game_date_idx" (~10-20ms)
