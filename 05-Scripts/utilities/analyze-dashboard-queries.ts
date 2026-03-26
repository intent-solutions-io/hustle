// @ts-nocheck
/**
 * Dashboard Query Performance Analysis
 *
 * Tests the 3 dashboard queries with EXPLAIN ANALYZE to verify:
 * - Query execution time
 * - Index usage
 * - Join efficiency
 * - Optimization opportunities
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
    { emit: 'stdout', level: 'error' },
  ],
});

// Listen to query events to capture raw SQL
prisma.$on('query', (e) => {
  console.log('\n📊 Query:', e.query);
  console.log('⏱️  Duration:', e.duration, 'ms');
  console.log('🔧 Params:', e.params);
});

// Calculate season dates (same as dashboard)
function getCurrentSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 7) {
    return {
      start: new Date(year, 7, 1),
      end: new Date(year + 1, 6, 31, 23, 59, 59),
    };
  } else {
    return {
      start: new Date(year - 1, 7, 1),
      end: new Date(year, 6, 31, 23, 59, 59),
    };
  }
}

async function analyzeDashboardQueries() {
  console.log('🔍 Dashboard Query Performance Analysis\n');
  console.log('=' .repeat(80));

  // Get a test user ID (first user in database)
  const testUser = await prisma.user.findFirst({
    select: { id: true, email: true },
  });

  if (!testUser) {
    console.error('❌ No users found in database. Please create a user first.');
    return;
  }

  console.log(`\n✅ Testing with user: ${testUser.email} (ID: ${testUser.id})`);
  console.log('=' .repeat(80));

  // Query 1: Total games count
  console.log('\n\n📈 QUERY 1: Total Games Count');
  console.log('-'.repeat(80));
  const startTotal = performance.now();
  const totalGames = await prisma.game.count({
    where: {
      player: {
        parentId: testUser.id,
      },
    },
  });
  const endTotal = performance.now();
  console.log(`✅ Result: ${totalGames} games`);
  console.log(`⏱️  Client-side duration: ${(endTotal - startTotal).toFixed(2)}ms`);

  // Query 2: Season games count
  console.log('\n\n📅 QUERY 2: Season Games Count');
  console.log('-'.repeat(80));
  const { start, end } = getCurrentSeasonDates();
  console.log(`Season range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
  const startSeason = performance.now();
  const seasonGames = await prisma.game.count({
    where: {
      player: {
        parentId: testUser.id,
      },
      date: {
        gte: start,
        lte: end,
      },
    },
  });
  const endSeason = performance.now();
  console.log(`✅ Result: ${seasonGames} games this season`);
  console.log(`⏱️  Client-side duration: ${(endSeason - startSeason).toFixed(2)}ms`);

  // Query 3: Athletes for dropdown
  console.log('\n\n👥 QUERY 3: Athletes List');
  console.log('-'.repeat(80));
  const startAthletes = performance.now();
  const athletes = await prisma.player.findMany({
    where: { parentId: testUser.id },
    select: {
      id: true,
      name: true,
      position: true,
    },
    orderBy: { name: 'asc' },
  });
  const endAthletes = performance.now();
  console.log(`✅ Result: ${athletes.length} athletes`);
  console.log(`⏱️  Client-side duration: ${(endAthletes - startAthletes).toFixed(2)}ms`);
  athletes.forEach((a) => console.log(`   - ${a.name} (${a.position})`));

  // Total timing
  const totalTime = (endTotal - startTotal) + (endSeason - startSeason) + (endAthletes - startAthletes);
  console.log('\n\n📊 TOTAL DASHBOARD QUERY TIME');
  console.log('-'.repeat(80));
  console.log(`⏱️  ${totalTime.toFixed(2)}ms total`);
  console.log(`🎯 Target: <200ms (${totalTime < 200 ? '✅ PASS' : '⚠️  NEEDS OPTIMIZATION'})`);

  // Now run EXPLAIN ANALYZE for detailed query plans
  console.log('\n\n🔬 DETAILED QUERY PLANS (PostgreSQL EXPLAIN ANALYZE)');
  console.log('=' .repeat(80));

  // EXPLAIN ANALYZE for Query 1
  console.log('\n\n1️⃣  Total Games Query Plan:');
  console.log('-'.repeat(80));
  const explainQuery1 = await prisma.$queryRaw<any[]>`
    EXPLAIN ANALYZE
    SELECT COUNT(*)
    FROM "Game" g
    INNER JOIN "Player" p ON g."playerId" = p.id
    WHERE p."parentId" = ${testUser.id}
  `;
  console.log(explainQuery1.map(row => row['QUERY PLAN']).join('\n'));

  // EXPLAIN ANALYZE for Query 2
  console.log('\n\n2️⃣  Season Games Query Plan:');
  console.log('-'.repeat(80));
  const explainQuery2 = await prisma.$queryRaw<any[]>`
    EXPLAIN ANALYZE
    SELECT COUNT(*)
    FROM "Game" g
    INNER JOIN "Player" p ON g."playerId" = p.id
    WHERE p."parentId" = ${testUser.id}
      AND g.date >= ${start}
      AND g.date <= ${end}
  `;
  console.log(explainQuery2.map(row => row['QUERY PLAN']).join('\n'));

  // EXPLAIN ANALYZE for Query 3
  console.log('\n\n3️⃣  Athletes List Query Plan:');
  console.log('-'.repeat(80));
  const explainQuery3 = await prisma.$queryRaw<any[]>`
    EXPLAIN ANALYZE
    SELECT id, name, position
    FROM "Player"
    WHERE "parentId" = ${testUser.id}
    ORDER BY name ASC
  `;
  console.log(explainQuery3.map(row => row['QUERY PLAN']).join('\n'));

  // Check existing indexes
  console.log('\n\n🔍 INDEX VERIFICATION');
  console.log('=' .repeat(80));
  const indexes = await prisma.$queryRaw<any[]>`
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (tablename = 'Game' OR tablename = 'Player')
    ORDER BY tablename, indexname
  `;

  console.log('\n📋 Existing Indexes:');
  indexes.forEach((idx) => {
    console.log(`\n${idx.tablename}.${idx.indexname}:`);
    console.log(`   ${idx.indexdef}`);
  });

  console.log('\n\n✅ Analysis complete!');
}

// Run analysis
analyzeDashboardQueries()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
