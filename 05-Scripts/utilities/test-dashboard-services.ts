/**
 * Test Dashboard Services (Firebase Admin SDK)
 *
 * Tests the Admin SDK services for players and games to verify
 * they work correctly for dashboard queries.
 *
 * Usage: npx tsx 05-Scripts/utilities/test-dashboard-services.ts <uid>
 */

import { getPlayersAdmin } from '../../src/lib/firebase/admin-services/players';
import {
  getVerifiedGamesCountAdmin,
  getUnverifiedGamesCountAdmin,
  getSeasonGamesCountAdmin,
  getFirstPendingGameAdmin,
} from '../../src/lib/firebase/admin-services/games';

// Calculate current soccer season dates (same as dashboard)
function getCurrentSeasonDates() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (month >= 7) {
    return {
      start: new Date(year, 7, 1),
      end: new Date(year + 1, 7, 0, 23, 59, 59, 999),
    };
  } else {
    return {
      start: new Date(year - 1, 7, 1),
      end: new Date(year, 7, 0, 23, 59, 59, 999),
    };
  }
}

async function testDashboardServices(uid: string) {
  try {
    console.log(`\n🧪 Testing Dashboard Services for UID: ${uid}\n`);

    // Test 1: Get all players
    console.log('1️⃣  Testing getPlayersAdmin()...');
    const players = await getPlayersAdmin(uid);
    console.log(`   ✅ Found ${players.length} players`);
    if (players.length > 0) {
      console.log(`   📋 Sample player:`, {
        id: players[0].id,
        name: players[0].name,
        position: players[0].position,
      });
    }

    // Test 2: Count verified games
    console.log('\n2️⃣  Testing getVerifiedGamesCountAdmin()...');
    const verifiedCount = await getVerifiedGamesCountAdmin(uid);
    console.log(`   ✅ Total verified games: ${verifiedCount}`);

    // Test 3: Count unverified games
    console.log('\n3️⃣  Testing getUnverifiedGamesCountAdmin()...');
    const unverifiedCount = await getUnverifiedGamesCountAdmin(uid);
    console.log(`   ✅ Total unverified games: ${unverifiedCount}`);

    // Test 4: Count season games
    console.log('\n4️⃣  Testing getSeasonGamesCountAdmin()...');
    const { start, end } = getCurrentSeasonDates();
    const seasonCount = await getSeasonGamesCountAdmin(uid, start, end);
    console.log(`   ✅ Season games (${start.toLocaleDateString()} - ${end.toLocaleDateString()}): ${seasonCount}`);

    // Test 5: Find first pending game
    console.log('\n5️⃣  Testing getFirstPendingGameAdmin()...');
    const firstPending = await getFirstPendingGameAdmin(uid);
    if (firstPending) {
      console.log(`   ✅ First pending game found for player: ${firstPending.playerId}`);
    } else {
      console.log(`   ℹ️  No pending games found`);
    }

    console.log('\n✅ All dashboard services working correctly!\n');
  } catch (error: any) {
    console.error('\n❌ Error testing dashboard services:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get UID from command line
const uid = process.argv[2];
if (!uid) {
  console.error('Usage: npx tsx 05-Scripts/utilities/test-dashboard-services.ts <uid>');
  console.error('Example: npx tsx 05-Scripts/utilities/test-dashboard-services.ts 1orBfTdF6kT90H6JzBJyYyQAbII3');
  process.exit(1);
}

testDashboardServices(uid)
  .then(() => {
    console.log('✅ Test complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
